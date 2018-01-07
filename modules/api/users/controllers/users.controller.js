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
var ClassifiedFilter = require('../../classifieds/filters/classified.filter');

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
    let filter = new ClassifiedFilter(req);    
    filter.query._id = { $in: req.user.classifieds || [] };
    let count = Classified.find(filter.query).count();

    let data = Classified.find(filter.query)
        .limit(filter.take)
        .skip(filter.skip)
        .sort(filter.sort)
        .then(classifieds => {
            return classifieds;
        })
        .catch(error => { throw error; });

    Promise.all([count, data])
        .then(result => {
            return res.status(200).json({
                count: result[0],
                data: result[1]
            });
        })
        .catch(error => {
            res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.delete = function (req, res) {
    return userService.delete(req.user)
        .then(result => { 
            return res.status(204).json();
         })
         .catch(error => {
            res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } }); 
         });
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

exports.removeFromWishlist = function (req, res) {
    return userService.removeFromWishlist(req.user, req.params.id)
        .then(user => {
            return res.status(204).json();
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.getWishlist = function (req, res) {
    let filter = new ClassifiedFilter(req);

    return userService.getWishlist(req.user, filter)
        .then(wishlist => {
            return res.status(200).json(wishlist);
        })
        .catch(error => {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};