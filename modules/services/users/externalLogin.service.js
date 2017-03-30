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
    _ = require('lodash');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var client = redis.createClient(config.cache);

var hashOAuthProviderSecret = function (salt) {
    return crypto.pbkdf2Sync(config.oauthProviderSecret, new Buffer(salt, 'base64'), 10000, 64).toString('base64');
};

var addExternalProvider = function (providerUserProfile, authenticatedId) {
    return User.findOne({ email: providerUserProfile.email })
        .then(existingUser => {

            if (existingUser) {
                if (authenticatedId && authenticatedId === existingUser._id.toString()) {
                    if (_.find(existingUser.externalLogins, { 'loginProvider': providerUserProfile.provider, 'providerKey': providerUserProfile.providerData.id })) {
                        throw new ExternalUserAlreadyRegisteredError('external user already registered', existingUser.email);
                    }

                    let additionalLogin = new ExternalLogin({ _id: { loginProvider: providerUserProfile.provider, providerKey: providerUserProfile.providerData.id } });
                    existingUser.externalLogins.push(additionalLogin._id);
                    existingUser.markModified('externalLogins');
                    existingUser.save();
                    additionalLogin._id.userId = existingUser._id;
                    additionalLogin.save();
                    return existingUser;
                }
                else {
                    throw new ExternalUserAlreadyRegisteredError('external user already registered', existingUser.email);
                }
            }

            //if authenticatedid and user exists with that id add the external login otherwise do this =>
            var user = new User(providerUserProfile);
            user.emailConfirmed = true;
            let externalLogin = new ExternalLogin({ _id: { loginProvider: providerUserProfile.provider, providerKey: providerUserProfile.providerData.id } });
            user.externalLogins.push(externalLogin._id);

            return user.save()
                .then(user => {
                    externalLogin._id.userId = user._id;
                    return externalLogin.save().then(externalLogin => { return user; });
                })
                .catch(error => { throw new EntityValidationError('error creating user from external provider', error); });
        })
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
        .then(hash => {
            if (!hash) throw new Error('oauth state does not exist');

            if (hashOAuthProviderSecret(hash.salt) !== stateParam) throw new Error('oauth state has invalid hash');

            return hash;
        })
        .catch(error => { throw error; });
};

exports.removeOAuthState = function (stateParam) {
    var self = this;
    var key = 'oauthstate:' + stateParam;
    var stateCache;
    return client.del(key);
};

exports.findOrAddOAuthProfile = function (providerUserProfile, authenticatedId) {
    return User.findOne({ 'externalLogins.loginProvider': providerUserProfile.provider, 'externalLogins.providerKey': providerUserProfile.providerData.id })
        .then(existingUser => existingUser ? existingUser : addExternalProvider(providerUserProfile, authenticatedId))
        .then(user => user)
        .catch(error => { throw error; });
};