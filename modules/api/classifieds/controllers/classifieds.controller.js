'use strict';

var mongoose = require('mongoose');
var Classified = mongoose.model('Classified');
var EntityNotFoundError = require('../../../core/errors/entityNotFound.error');
var EntityValidationError = require('../../../core/errors/entityValidation.error');
var ClassifiedForm = require('../models/classified.form.model');
var fileManager = require('../../../infrastructure/files/file.manager');
var ClassifiedFilter = require('../filters/classified.filter');

exports.list = function (req, res) {
    Classified.find(new ClassifiedFilter(req)).limit(30).sort({ 'created': -1 })
        .then(classifieds => {
            return res.status(200).json(classifieds);
        })
        .catch(error => res.status(500).json());
};

exports.get = function (req, res) {
    Classified.findById(req.params.id)
        .then(classified => {
            if (!classified) return res.status(404).json();
            return res.status(200).json(classified);
        })
        .catch(error => {
            return res.status(500).json();
        });
};

exports.insert = function (req, res) {
    var form = new ClassifiedForm(req.body, req.user);
    var classified = new Classified(form);
    var user = req.user;  

    return classified.save()
        .then(c => {
            classified = c;
            return c;      
        })
        .then(c => {
            user.classifieds = user.classifieds || [];
            user.classifieds.push(c._id);       
            return user;
        })
        .then(user => user.save())
        .then(user => {
            return res.status(201).json(classified).json;
        })
        .catch(mongoose.Error.ValidationError, error => {           
            let errorResult = new EntityValidationError('user validation failed', error.errors);
            return res.status(400).json(errorResult.i18n(req.i18n));
        })
        .catch(error => {       
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        });
};

exports.uploadImages = function (req, res) {
    var classified;

    return Classified.findById(req.params.id)
        .then(c => {
            if (!c) throw new EntityNotFoundError('classified not found');

            classified = c;
            return fileManager.saveFilesAsync(req, res);
        })
        .then(result => {
            for (let i in result.filePaths) {
                classified.images.push(result.filePaths[i]);
            }

            return classified;
        })
        .then(classified => classified.save())
        .then(result => res.json(result))
        .catch(EntityNotFoundError, error => {
            return res.status(404).json();
        })
        .catch(EntityValidationError, error => {
            return res.status(400).json(error.i18n(req.i18n));
        })
        .catch(error => {
            return res.status(400).json({ errors: { message: req.i18n.__(error.message) } });
        });
};
