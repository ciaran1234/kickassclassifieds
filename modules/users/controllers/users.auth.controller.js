'use strict';

var mongoose = require('mongoose'),
    passport = require('passport'),
    User = mongoose.model('User'),
    ExternalLogin = mongoose.model('ExternalLogin'),
    AccountTokenSchema = mongoose.model('AccountTokenSchema'),
    config = require('../../../config/config'),
    jwt = require('jsonwebtoken'),
    https = require('https'),
    accountConfirmationEmail = require('../../infrastructure/email/accountConfirmationEmail'),
    passwordResetEmail = require('../../infrastructure/email/passwordResetEmail'),
    _ = require('lodash');

var issueJwt = function (id) {
    var token = jwt.sign({ id: id }, config.sessionSecret, {
        expiresIn: config.jwt.expiration,
    });

    return 'JWT ' + token;
};

var verifyExternalAccessToken = function (provider, accessToken, cb) {
    if (provider === 'facebook') {
        let url = config.facebook.verificationUrl
            .replace('#{appToken}', config.facebook.appToken)
            .replace('#{clientAccessToken}', accessToken);

        https.request(url, function (res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                try {
                    var result = JSON.parse(body);
                    return cb(null, {
                        verified: result.data.is_valid && result.data.app_id === config.facebook.clientID,
                        providerKey: result.data.user_id,
                        loginProvider: 'facebook'
                    });
                }
                catch (ex) {
                    return cb(ex, false);
                }
            });

            res.on('error', function (err) {
                return cb(err, false);
            });
        }).end();
    }
    else if (provider === 'google') {
        let url = config.google.verificationUrl.replace('#{clientAccessToken}', accessToken);
        https.request(url, function (res) {
            var body = '';

            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                try {
                    var result = JSON.parse(body);

                    return cb(null, {
                        verified: result.expires_in > 0 && result.verified_email && result.issued_to === config.google.clientID,
                        providerKey: result.user_id,
                        loginProvider: 'google'
                    });
                }
                catch (ex) {
                    return cb(ex, false);
                }
            });

            res.on('error', function (err) {
                return cb(err, false);
            });
        }).end();
    }
    else {
        return cb(config.errorCodes.authorization.invalidExternalAccessToken.message, false);
    }
};

exports.signup = function (req, res) {
    delete req.body.roles; // For security measurement we remove the roles from the req.body object

    var user = new User(req.body);
    user.provider = 'jwt';

    user.save(function (err) {
        if (err) {
            res.status(400).send(err);
        }
        else {
            user.generateEmailConfirmationToken(function (err, confirmationToken) {
                let callbackUrl = 'http://localhost:4200/account/confirm?token=' + confirmationToken.token + '&uid=' + user._id;  // need to get schema + host... append token to end...

                accountConfirmationEmail.send(user, callbackUrl, function (error, info) {
                    if (error) {
                        res.status(400).json({ message: 'An error occurred' });
                    }

                    res.status(200).json({ message: 'success' });
                });
            });
        }
    });
};

exports.confirmAccount = function (req, res) {
    AccountTokenSchema.findOne({ token: req.body.token, userId: req.body.userId, type: 'email' }, function (err, token) {
        if (err || !token) {
          return  res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
        }
        else if (token.isValid(req.body.userId)) {
            User.findById(req.body.userId, function (err, user) {
                if (err || !user) {
                 return   res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
                }
                else {
                    user.emailConfirmed = true;
                    user.updated = Date.now();
                    user.markModified('emailConfirmed');

                    user.save(function (err) {
                        if (err) {
                           return res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
                        }
                        else {
                            token.remove();
                         return   res.status(200).json();
                        }
                    });
                }
            });
        }
        else {
         return   res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
        }
    });
};

exports.resetPassword = function(req, res) {
    User.findOne({email: req.body.email}, function(err, user){
        if(err || !user || !user.emailConfirmed) {           
            return res.status(200).json(); 
        }      

        user.generatePasswordResetToken(function(err, resetToken) {
                let callbackUrl = 'http://localhost:4200/account/confirmResetPassword?token=' + resetToken.token + '&uid=' + user._id;
                passwordResetEmail.send(user, callbackUrl, function (error, info) {                 
                    if (error) {
                       return res.status(400).json();
                    }

                   return res.status(200).json();
                });
        });
    });
};

exports.resetPasswordConfirmed = function(req, res) {
    AccountTokenSchema.findOne({ token: req.body.token, userId: req.body.userId, type: 'password' }, function (err, token) {
        if (err || !token) {
            return res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
        }
        else if (token.isValid(req.body.userId)) {
            User.findById(req.body.userId, function (err, user) {
                if (err || !user) {
                    return res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
                }
                else {
                    user.password = req.body.password;
                    user.updated = Date.now();
                    user.markModified('password');

                    user.save(function (err) {
                        if (err) {
                           return res.status(400).json(err);
                        }
                        else {
                            token.remove();
                            return res.status(200).json();
                        }
                    });
                }
            });
        }
        else {
            return res.status(400).json(config.errorCodes.authorization.invalidConfirmationToken);
        }
    });
};

exports.signin = function (req, res, next) {
    User.findOne({
        email: req.body.email
    }, function (err, user) {
        if (user && user.authenticate(req.body.password)) {
            res.json({ token: issueJwt(user.id) });
        }
        else {
            res.status(400).json(config.errorCodes.authorization.invalidUsernamOrPassword);
        }
    });
};

exports.signout = function (req, res) {
    req.logout();
    res.status(200).send();
};


exports.addExternalLogin = function (strategy, scope) {
    return function (req, res, next) {

        if (!req.body.externalToken) {
            return res.status(400).json(config.errorCodes.authorization.invalidExternalAccessToken);
        }
        else {
            verifyExternalAccessToken(strategy, req.body.externalToken, function (err, externalToken) {
                if (!externalToken.verified) {
                    return res.status(400).json(config.errorCodes.authorization.invalidExternalAccessToken);
                }
                else {
                    User.findById(req.user._id, function (err, user) {
                        if (err) {
                            return res.status(400).json();
                        }
                        else if (_.find(user.externalLogins, { 'loginProvider': externalToken.loginProvider, 'providerKey': externalToken.providerKey })) {
                            return res.status(400).json(config.errorCodes.authorization.externalUserAlreadyRegistered);
                        }
                        else {
                            var externalLogin = new ExternalLogin({ _id: { loginProvider: externalToken.loginProvider, providerKey: externalToken.providerKey } });
                            user.externalLogins.push(externalLogin._id);
                            user.markModified('externalLogins');

                            user.save(function (err) {
                                if (!err) {
                                    externalLogin._id.userId = user._id;

                                    externalLogin.save(function (err) {
                                        return res.status(201).json();
                                    });
                                }
                                else {
                                    return res.status(400).json();
                                }
                            });
                        }
                    });
                }
            });
        }
    };
};

exports.openAuthCall = function (strategy, scope) {
    return function (req, res, next) {
        passport.authenticate(strategy, {
            scope: scope,
            state: req.query.redirectUrl,  //N.B ENSURE req.query.redirectUrl IS WHITELISTED!!!!!!!!!!            
        })(req, res, next);
    };
};

exports.openAuthCallback = function (strategy) {
    return function (req, res, next) {
        passport.authenticate(strategy, function (err, user) {
            if (err) {
                if (err.code === config.errorCodes.authorization.externalUserAlreadyRegistered.code && err.email) {
                    return res.redirect(req.query.state + '?error=' + err.code + '&email=' + err.email);
                }
                else {
                    return res.redirect(req.query.state + '?error=' + err.code);
                }
            }
            else if (!user) {
                return res.redirect(req.query.state + '?error=' + config.errorCodes.authorization.userAlreadySignedIn.code);
            }
            else if (!err && user) {
                return res.redirect(req.query.state + '?provider=' + strategy + '&access_token=' + user.providerData.accessToken);
            }
        })(req, res, next);
    };
};

exports.exchangeAccessToken = function (req, res) {
    return verifyExternalAccessToken(req.query.provider, req.query.access_token, function (err, externalToken) {
        if (!externalToken.verified) {
            return res.status(400).json(config.errorCodes.authorization.invalidExternalAccessToken);
        }
        else {
            ExternalLogin.findOne({ '_id.loginProvider': externalToken.loginProvider, '_id.providerKey': externalToken.providerKey }, function (err, externalLogin) {
                if (err || !externalLogin) {
                    return res.status(400).json(config.errorCodes.authorization.invalidExternalAccessToken);
                }
                else {
                    return res.json({ token: issueJwt(externalLogin._id.userId) });
                }
            });
        }
    });
};

exports.findOrCreateOAuthProfile = function (req, providerUserProfile, done) {
    return verifyExternalAccessToken(providerUserProfile.provider, providerUserProfile.providerData.accessToken, function (err, externalToken) {
        if (!externalToken.verified) {
            return done(err);
        }

        ExternalLogin.findOne({ '_id.loginProvider': providerUserProfile.provider, '_id.providerKey': providerUserProfile.providerData.id }, function (err, existingProvider) {
            if (existingProvider) {
                User.findById(existingProvider._id.userId, function (err, user) {
                    if (err || !user) {
                        return done(config.errorCodes.authorization.invalidExternalAccessToken, user);
                    }
                    else {
                        return done(null, user);
                    }
                });
            }
            else {
                User.findOne({ email: providerUserProfile.email }, function (err, existingUser) {
                    if (err) {
                        return done(err, existingUser);
                    }
                    else if (existingUser) {
                        let error = config.errorCodes.authorization.externalUserAlreadyRegistered;
                        error.email = existingUser.email;
                        return done(error);
                    }
                    else {
                        var user = new User(providerUserProfile);
                        user.emailConfirmed = true;
                        var externalLogin = new ExternalLogin({ _id: { loginProvider: providerUserProfile.provider, providerKey: providerUserProfile.providerData.id } });
                        user.externalLogins.push(externalLogin._id);

                        user.save(function (err) {
                            if (!err) {
                                externalLogin._id.userId = user._id;

                                externalLogin.save(function (err) {
                                    return done(null, user);
                                });
                            }
                            else {
                                return done(err, user);
                            }
                        });
                    }
                });
            }
        });
    });
};

