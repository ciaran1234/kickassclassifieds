'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fileManager = Promise.promisifyAll(require('../../../infrastructure/files/file.manager'));
var MeModel = require('../models/me.model');
var UpdateUserModel = require('../models/user.update.model');
var EntityValidationError = require('../../../core/errors/entityValidation.error');
var userService = require('../../../services/users/users.service');
var mongoose = require('mongoose');
var Classified = mongoose.model('Classified');

exports.update = function (req, res) {
    var user = _.extend(req.user, new UpdateUserModel(req.body));

    userService.update(user)
        .then(user => { return res.status(200).json(new MeModel(user)); })
        .catch(EntityValidationError, error => {
            return res.status(400).json(error.i18n(req.i18n));
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.changeProfilePicture = function (req, res) {
    var user = req.user;

    fileManager.saveFileAsync(req, res)
        .then(result => {
            user.profileImageUrl = result.filePath;
            return userService.update(user);
        })
        .then(user => res.json(new MeModel(user)))
        .catch(EntityValidationError, error => {
            return res.status(400).json(error.i18n(req.i18n));
        })
        .catch(error => {
            return res.status(400).json({ errors: { message: req.i18n.__(error.message) } });
        });
};

exports.me = function (req, res) {
    res.json(req.user ? new MeModel(req.user) : null);
};

exports.classifieds = function (req, res) {
    Classified.find({ _id: { $in: req.user.classifieds || [] } }).limit(30).sort({ 'created': -1 })
        .then(classifieds => {
            return res.status(200).json(classifieds);
        })
        .catch(error => res.status(500).json());
};

exports.addToWishlist = function (req, res) {
    return userService.addToWishlist(req.user, req.params.id)
        .then(user => {
            return res.status(201).json(new MeModel(user));
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.removeFromWishlist = function(req, res) {
    return userService.removeFromWishlist(req.user, req.params.id)
        .then(user => {
            return res.status(204).json();
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.getWishlist = function(req, res) {
    return userService.getWishlist(req.user)
        .then(wishlist => {
            return res.status(200).json(wishlist);
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};