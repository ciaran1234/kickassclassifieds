'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    redis = require('redis'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    ExternalLogin = mongoose.model('ExternalLogin'),
    Classified = mongoose.model('Classified'),
    config = require('../../../config/config'),
    passwordResetEmail = require('../../infrastructure/email/passwordResetEmail'),
    accountConfirmationEmail = require('../../infrastructure/email/accountConfirmationEmail'),
    InvalidAccountTokenError = require('../../core/errors/invalidAccountTokenError.error'),
    EntityNotFoundError = require('../../core/errors/entityNotFound.error'),
    EntityValidationError = require('../../core/errors/entityValidation.error'),
    ExternalUserAlreadyRegisteredError = require('../../core/errors/externalUserAlreadyRegistered.error'),
    crypto = require('crypto');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var client = redis.createClient(config.cache);

var hashSecret = function (secret, salt) {
    return crypto.pbkdf2Sync(secret, new Buffer(salt, 'base64'), 10000, 64, 'sha1').toString('base64');
};

var validateAccountToken = function (key, token) {
    return client.hgetallAsync(key + ':' + token)
        .then(hash => {
            if (!hash) {
                throw new InvalidAccountTokenError('invalid token provided');
            }

            var currentDate = new Date();
            currentDate.setDate(currentDate.getDate());
            var expires = new Date(hash.expires);
            let validExpiration = expires !== null ? currentDate.getTime() < expires.getTime() : true;

            if (!validExpiration || hashSecret(config.accountTokenSecret, hash.salt) !== token) {
                throw new InvalidAccountTokenError('invalid token provided');
            }

            return hash.userId;
        })
        .catch(error => { throw error; });
};

var generateAccountToken = function (key, user, expires) {
    var salt = crypto.randomBytes(16).toString('base64');
    var token = hashSecret(config.accountTokenSecret, salt);

    var hash = [key + ':' + token, 'salt', salt, 'userId', user._id.toString(), 'expires', (expires || '')];

    return client.hmsetAsync(hash)
        .then(result => {
            return token;
        })
        .catch(error => { throw error; });
};

exports.confirmAccount = function (token) {
    return validateAccountToken('accountconfirmation', token)
        .then(userId => User.findById(userId))
        .then(user => {
            if (!user) throw new EntityNotFoundError('user does not exist');

            user.emailConfirmed = true;
            user.updated = Date.now();
            return user;
        })
        .then(user => user.save())
        .then(user => { return user; })
        .catch(error => { throw error; });
};

exports.resetPassword = function (userId, password, token) {
    return validateAccountToken('resetpassword', token)
        .then(userId => User.findById(userId))
        .then(user => {
            if (!user) throw new EntityNotFoundError('user does not exist');

            user.password = password;
            user.updated = Date.now();
            return user;
        })
        .then(user => user.save())
        .then(user => { return user; })
        .catch(error => { throw error; });
};

exports.sendResetPasswordRequest = function (email, callbackUrl) {
    var expires = new Date();
    expires.setDate(expires.getDate() + 1);
    var existingUser;

    return User.findOne({ email: email })
        .then(user => {
            if (!user) throw new EntityNotFoundError('User not found');

            existingUser = user;
            return existingUser;
        })
        .then(user => generateAccountToken('resetpassword', user, expires))
        .then(token => {
            let resetPasswordUrl = callbackUrl + '?token=' + token;
            passwordResetEmail.send(existingUser, resetPasswordUrl);
        })
        .catch(EntityNotFoundError, err => { }) //user doesn't exist. let it fail silently for security reasons
        .catch(error => { throw error; });
};

exports.signup = function (registration) {
    var user = new User(registration);
    user.provider = 'jwt';

    var expires = new Date();
    expires.setDate(expires.getDate() + 2);

    return user.save()
        .then(user => generateAccountToken('accountconfirmation', user, expires))
        .then(token => {
            let callbackUrl = registration.confirmationUrl + '?token=' + token;
            return accountConfirmationEmail.send(user, callbackUrl);
        })
        .catch(mongoose.Error.ValidationError, err => {
            throw new EntityValidationError('user validation failed', err.errors);
        })
        .catch(error => { return Promise.reject(error); });
};

exports.signin = function (model) {
    return User.findOne({ email: model.email })
        .then(user => {
            if (!(user && user.authenticate(model.password))) {
                throw new Error('User not authenticated');
            }

            return user;
        })
        .catch(error => { throw error; });
};

exports.update = function (user) {
    user.updated = Date.now();

    return user.save()
        .then(user => { return user; })
        .catch(error => {
            throw new EntityValidationError('user update failed', error.errors);
        });
};

exports.exchangeToken = function (loginProvider, providerKey) {
    return ExternalLogin.findOne({ '_id.loginProvider': loginProvider, '_id.providerKey': providerKey })
        .then(externalLogin => {
            if (!externalLogin) throw new EntityNotFoundError('external login not found');

            return externalLogin;
        })
        .then(externalLogin => User.findById(externalLogin._id.userId))
        .then(user => {
            if (!user) throw new EntityNotFoundError('user not found');

            return user;
        })
        .catch(error => { throw error; });
};

exports.addToWishlist = function (user, classifiedId) {
    user.wishlist = user.wishlist ? user.wishlist : [];
    user.wishlist.push(classifiedId);

    return user.save(classifiedId)
        .then(user => {
            return user;
        })
        .catch(error => {
            throw error;
        });
};

exports.removeFromWishlist = function (user, classifiedId) {
    user.wishlist = user.wishlist ? user.wishlist : [];
    let index = user.wishlist.indexOf(classifiedId);
    user.wishlist.splice(index, 1);

    return user.save().then(user => {
        return user;
    })
        .catch(error => {
            throw error;
        });
};

exports.getWishlist = function (user, filter) {
    user.wishlist = user.wishlist ? user.wishlist : [];
    filter.query._id = { $in: user.wishlist };

    let count = Classified.find(filter.query).count();

    let data = Classified.aggregate()
        .match(filter.query)
        .sort(filter.sort)
        .skip(filter.skip)
        .limit(filter.take)
        .project({
            '_id': 1,
            'title': 1,
            'image': { $arrayElemAt: ['$images', 0] },
            'price': 1,
            'created': 1,
            'category': 1,
            'state': 1,
            'region': 1,
            'country': 1
        }).then(classifieds => {
            return classifieds;
        }).catch(error => { throw error; });

    return Promise.all([count, data])
        .then(result => {
            return {
                count: result[0],
                data: result[1]
            };
        }).catch(error => {
            throw error;
        });
};

exports.delete = function (user) {
    return User.findByIdAndRemove(user._id)
        .then(result => ExternalLogin.deleteMany({ '_id.userId': user._id }))
        .then(result => Classified.deleteMany({ 'advertiser._id': user._id }))
        .then(r => { return true; })
        .catch(error => {            
            throw error;
        });
};


