'use strict';

var mongoose = require('mongoose'),
    passport = require('passport'),
    User = mongoose.model('User'),
    ExternalLogin = mongoose.model('ExternalLogin'),
    config = require('../../../config/config'),
    jwt = require('jsonwebtoken'),
    https = require('https');

var issueJwt = function (id) {
    var token = jwt.sign({ id: id }, config.sessionSecret, {
        expiresIn: config.jwt.expiration,
    });

    return 'JWT ' + token;
};

var verifyExternalAccessToken = function (provider, accessToken, cb) {
    if (provider === 'facebook') {
        var url = config.facebook.verificationUrl
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
            return res.status(400).send(err);
        }
        else {
            res.json({ token: issueJwt(user.id) });
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

exports.oauthCall = function (strategy, scope) {
    return function (req, res, next) {
        passport.authenticate(strategy, {
            scope: scope,
            state: req.query.redirectUrl
        })(req, res, next);
    };
};

exports.oauthCallback = function (strategy) {
    return function (req, res, next) {
        passport.authenticate(strategy, function (err, user) {
            if (err) {
                return res.redirect(req.query.state + '?error=' + err.code);
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

/**
 * Helper function to save or update a OAuth user profile
 */
// exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
//     if (!req.user) {
//         // Define a search query fields
//         var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
//         var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

//         // Define main provider search query
//         var mainProviderSearchQuery = {};
//         mainProviderSearchQuery.provider = providerUserProfile.provider;
//         mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

//         // Define additional provider search query
//         var additionalProviderSearchQuery = {};
//         additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

//         // Define a search query to find existing user with current provider profile
//         var searchQuery = {
//             $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
//         };


//         User.findOne(searchQuery, function (err, user) {
//             if (err) {
//                 return done(err);
//             } else {
//                 if (!user) {

//                     console.log(providerUserProfile);
//                     var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

//                     User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
//                         user = new User({
//                             firstName: providerUserProfile.firstName,
//                             lastName: providerUserProfile.lastName,
//                             username: availableUsername,
//                             displayName: providerUserProfile.displayName,
//                             email: providerUserProfile.email,
//                             profileImageURL: providerUserProfile.profileImageURL,
//                             provider: providerUserProfile.provider,
//                             providerData: providerUserProfile.providerData
//                         });

//                         // And save the user
//                         user.save(function (err) {
//                             return done(err, user);
//                         });
//                     });
//                 } else {
//                     return done(err, user);
//                 }
//             }
//         });
//     } else {      
//         // User is already logged in, join the provider data to the existing user
//         var user = req.user;

//         // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
//         if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
//             // Add the provider data to the additional provider data field
//             if (!user.additionalProvidersData) {
//                 user.additionalProvidersData = {};
//             }

//             user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

//             // Then tell mongoose that we've updated the additionalProvidersData field
//             user.markModified('additionalProvidersData');

//             // And save the user
//             user.save(function (err) {
//                 return done(err, user, '/settings/accounts');
//             });
//         } else {
//             return done(new Error('User is already connected using this provider'), user);
//         }
//     }
// };

//Register External
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {

    return verifyExternalAccessToken(providerUserProfile.provider, providerUserProfile.providerData.accessToken, function (err, externalToken) {
        if (!externalToken.verified) {
            return done(err);
        }

        ExternalLogin.findOne({ '_id.loginProvider': providerUserProfile.provider, '_id.providerKey': providerUserProfile.providerData.id }, function (err, existingProvider) {
            if (existingProvider) {
                return done(config.errorCodes.authorization.externalUserAlreadyRegistered, providerUserProfile);
            }
            else {
                var user = new User(providerUserProfile);
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
    });
};

