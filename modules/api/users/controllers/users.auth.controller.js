'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    passport = require('passport'),
    jwt = require('jsonwebtoken'),
    config = require('../../../../config/config'),
    EntityValidationError = require('../../../core/errors/entityValidation.error'),
    InvalidExternalTokenError = require('../../../core/errors/invalidExternalToken.error'),
    ExternalUserAlreadyRegisteredError = require('../../../core/errors/externalUserAlreadyRegistered.error'),
    RegistrationModel = require('../models/registration.model'),
    SigninModel = require('../models/signin.model'),
    externalLoginValidator = Promise.promisifyAll(require('../validation/externalLogin.validator')),
    userService = require('../../../services/users/users.service'),
    externalLoginService = require('../../../services/users/externalLogin.service');

var issueJwt = function (id) {
    var token = jwt.sign({ id: id }, config.sessionSecret, { expiresIn: config.jwt.expiration });
    return 'JWT ' + token;
};

exports.signup = function (req, res) {

    userService.signup(new RegistrationModel(req.body))
        .then(success => res.status(200).json())
        .catch(EntityValidationError, error => {
            return res.status(400).json(error.i18n(req.i18n));
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.confirmAccount = function (req, res) {
    userService.confirmAccount(req.body.token, req.body.userId)
        .then(success => res.status(200).json())
        .catch(err => res.status(400).json({ errors: { message: req.i18n.__("authorization.invalidConfirmationToken") } }));
};

exports.resetPasswordRequest = function (req, res) {
    userService.sendResetPasswordRequest(req.body.email, req.body.callbackUrl) //N.B ENSURE req.body.callbackUrl IS WHITELISTED!!!!!!!!!!   
        .then(success => res.status(200).json())
        .catch(error => res.status(400).json());
};

exports.resetPasswordConfirmed = function (req, res) {
    userService.resetPassword(req.body.userId, req.body.password, req.body.token)
        .then(success => { res.status(200).json(); })
        .catch(error => { res.status(400).json({ errors: { message: req.i18n.__("authorization.invalidResetToken") } }); });
};

exports.signin = function (req, res, next) {
    userService.signin(new SigninModel(req.body))
        .then(user => res.status(200).json({ token: issueJwt(user._id) }))
        .catch(error => res.status(400).json({ errors: { message: req.i18n.__("authorization.invalidUsernamOrPassword") } }));
};

exports.signout = function (req, res) {
    req.logout();
    res.status(200).json();
};

exports.openAuthCall = function (strategy, scope) {
    return function (req, res, next) {
        var token = '';

        if (req.query.local_token) {
            token = req.query.local_token.substring('JWT '.length, req.query.local_token.length);
        }

        return jwt.verify(token, config.sessionSecret, function (err, decoded) {
            let userId;
            if (!err) userId = decoded.id;

            return externalLoginService.generateOAuthState(req.query.redirectUrl, userId)
                .then(stateToken => {
                    passport.authenticate(strategy, {
                        scope: scope,
                        state: stateToken,
                    })(req, res, next);
                })
                .catch(error => {
                    return res.redirect(req.query.redirectUrl + '?error=unknown');
                });
        });
    };
};

exports.openAuthCallback = function (strategy) {
    return function (req, res, next) {
        return externalLoginService.parseOAuthState(req.query.state)
            .then(state => {
                return passport.authenticate(strategy, function (err, result) {
                    externalLoginService.removeOAuthState(req.query.state);

                    if (err) {
                        return res.redirect(state.redirectUrl + '?error=' + err.code + (err instanceof ExternalUserAlreadyRegisteredError ? ('&email=' + err.email) : ''));
                    }
                    else if (!result.user) {
                        return res.redirect(state.redirectUrl + '?error=' + config.errorCodes.authorization.userAlreadySignedIn.code);
                    }
                    else if (!err && result.user) {
                        return res.redirect(state.redirectUrl + '?provider=' + strategy + '&access_token=' + result.accessToken);
                    }

                })(req, res, next);
            })
            .catch(error => {
                externalLoginService.removeOAuthState(req.query.state);
                return res.status(500).send('<h1>An error occurred</h1>');
            });
    };
};

exports.removeExternalLogin = function (req, res) {
    return externalLoginService.removeExternalLogin(req.user, req.externalLogin)
        .then(result => res.status(204).json())
        .catch(error => res.status(400).json({ errors: { message: req.i18n.__(error.message) } }));
};

exports.exchangeAccessToken = function (req, res) {
    return externalLoginValidator.verifyExternalLoginAsync(req.query.provider, req.query.access_token)
        .then(externalToken => userService.exchangeToken(externalToken.loginProvider, externalToken.providerKey))
        .then(externalLogin => {
            return res.json({ token: issueJwt(externalLogin._id.userId) });
        })
        .catch(error => res.status(400).json({ errors: { message: req.i18n.__("authorization.invalidExternalAccessToken") } }));
};

exports.findOrCreateOAuthProfile = function (req, providerUserProfile, done) {
    return externalLoginService.parseOAuthState(req.query.state)
        .then(state => externalLoginService.findOrAddOAuthProfile(providerUserProfile, state.id))
        .then(user => {
            return done(null, { user: user, accessToken: providerUserProfile.providerData.accessToken });
        })
        .catch(ExternalUserAlreadyRegisteredError, error => { return done(error); })
        .catch(EntityValidationError, error => { return done(error); })
        .catch(InvalidExternalTokenError, error => { return done(error); })
        .catch(error => { return done(new InvalidExternalTokenError('invalid external token')); });
};