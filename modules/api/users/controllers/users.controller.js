'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    fileManager = Promise.promisifyAll(require('../../../infrastructure/files/file.manager')),
    MeModel = require('../models/me.model'),
    UpdateUserModel = require('../models/user.update.model'),
    EntityValidationError = require('../../../core/errors/entityValidation.error'),
    userService = require('../../../services/users/users.service');

exports.update = function (req, res) {
    var user = _.extend(req.user, new UpdateUserModel(req.body));

    userService.update(user)
        .then(user => { return res.status(200).json(new MeModel(user)); })
        .catch(EntityValidationError, error => { return res.status(400).json(error.formatResult(req.i18n)); })
        .catch(error => { return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } }); });
};

exports.changeProfilePicture = function (req, res) {
    var user = req.user;

    fileManager.saveFileAsync(req, res)
        .then(result => {
            user.profileImageUrl = result.filePath;
            return userService.update(user);
        })
        .then(user => res.json(new MeModel(user)))
        .catch(EntityValidationError, error => res.status(400).json(error.formatResult(req.i18n)))
        .catch(error => res.status(400).json({ errors: { message: req.i18n.__(error.message) } }));
};

exports.me = function (req, res) {
    res.json(req.user ? new MeModel(req.user) : null);
};