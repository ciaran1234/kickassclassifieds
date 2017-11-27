'use strict';

var Promise = require('bluebird'),
    redis = require('redis'),
    crypto = require('crypto'),
    config = require('../../../config/config'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    ExternalLogin = mongoose.model('ExternalLogin'),
    ExternalUserAlreadyRegisteredError = require('../../core/errors/externalUserAlreadyRegistered.error'),
    EntityValidationError = require('../../core/errors/entityValidation.error'),
    EntityNotFoundError = require('../../core/errors/entityNotFound.error'),
    _ = require('lodash');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var client = redis.createClient(config.cache);

var hashOAuthProviderSecret = function (salt) {
    var buffer = new Buffer(salt, 'base64');
    var iterations = 10000;
    var keyLength = 64;
    return crypto.pbkdf2Sync(config.oauthProviderSecret, buffer, iterations, keyLength, 'sha1').toString('base64');
};

var addExternalProviderToExistingAccount = function (user, providerUserProfile) {
    if (_.find(user.externalLogins, {
        'loginProvider': providerUserProfile.provider, 'providerKey': providerUserProfile.providerData.id
    })) {
        throw new ExternalUserAlreadyRegisteredError('external user already registered', user.email);
    }

    let additionalLogin = new ExternalLogin({
        _id: {
            loginProvider: providerUserProfile.provider,
            providerKey: providerUserProfile.providerData.id
        }
    });

    user.externalLogins.push(additionalLogin._id);
    user.markModified('externalLogins');
    return user.save().then(user => {
        additionalLogin._id.userId = user._id;
        additionalLogin.save();
        return user;
    });
};

var addExternalProvider = function (providerUserProfile, authenticatedId) {
    return User.findOne({ email: providerUserProfile.email })
        .then(existingUser => {

            if (existingUser) {
                if (authenticatedId && authenticatedId === existingUser._id.toString()) {  //check if its an existing account with same email                
                    return addExternalProviderToExistingAccount(existingUser, providerUserProfile);
                }
                else {
                    throw new ExternalUserAlreadyRegisteredError('external user already registered', existingUser.email);
                }
            }

            return User.findById(authenticatedId) //check if its an existing account with different email
                .then(localUser => {
                    if (localUser) {

                        return addExternalProviderToExistingAccount(localUser, providerUserProfile);
                    }

                    //create new user from provider data
                    var user = new User(providerUserProfile);

                    return User.generateRandomPassphrase().then(password => {
                        user.password = password;
                        user.emailConfirmed = true;
                        let externalLogin = new ExternalLogin({
                            _id: {
                                loginProvider: providerUserProfile.provider,
                                providerKey: providerUserProfile.providerData.id
                            }
                        });

                        user.externalLogins.push(externalLogin._id);

                        return user.save()
                            .then(user => {
                                externalLogin._id.userId = user._id;
                                return externalLogin.save().then(externalLogin => { return user; });
                            })
                            .catch(error => {
                                throw new EntityValidationError('error creating user from external provider', error.errors);
                            });
                    });
                });
        })
        .catch(error => { throw error; });
};

exports.removeExternalLogin = function (user, externalLogin) {

    let index = _.findIndex(user.externalLogins, externalLogin);

    return User.findById(user._id)
        .then(user => {
            if (index < 0) throw new EntityNotFoundError('validation.externalLogin.notFound');

            user.externalLogins.splice(index, 1);
            return user.save();
        })
        .then(user => ExternalLogin.remove({'_id.loginProvider': externalLogin.loginProvider, '_id.providerKey': externalLogin.providerKey }))       
        .then(result => true)
        .catch(error => { throw error; });

};

exports.generateOAuthState = function (redirectUrl, userId) {
    var salt = crypto.randomBytes(16).toString('base64');
    var token = hashOAuthProviderSecret(salt);
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate());
    var hash = ['oauthstate:' + token, 'salt', salt, 'redirectUrl', redirectUrl, 'timestamp', currentDate.toString()];

    if (userId) hash.push('id', userId);

    return client.hmsetAsync(hash)
        .then(result => token)
        .catch(err => { throw Error('Error creating oauth state parameter hash'); });
};

exports.parseOAuthState = function (stateParam) {
    var key = 'oauthstate:' + stateParam;

    return client.hgetallAsync(key)
        .then(redisHash => {
            if (!redisHash) {
                throw new Error('oauth state does not exist');
            }

            var hashedSecret = hashOAuthProviderSecret(redisHash.salt);

            if (hashedSecret !== stateParam) {
                throw new Error('oauth state has invalid hash');
            }

            return redisHash;
        })
        .catch(error => { throw error; });
};

exports.removeOAuthState = function (stateParam) {
    var self = this;
    var key = 'oauthstate:' + stateParam;
    return client.del(key);
};

exports.findOrAddOAuthProfile = function (providerUserProfile, authenticatedId) {
    return User.findOne({ 'externalLogins.loginProvider': providerUserProfile.provider, 'externalLogins.providerKey': providerUserProfile.providerData.id })
        .then(existingUser => existingUser ? existingUser : addExternalProvider(providerUserProfile, authenticatedId))
        .then(user => user)
        .catch(error => { throw error; });
};