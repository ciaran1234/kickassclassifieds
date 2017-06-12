'use strict';

var Guid = require('guid');
var config = require('../../../config/config');
var multer = require('multer');
var path = require('path');
var NotImplementedError = require('../../core/errors/notImplementedError');
var fs = require('fs');
var _ = require('lodash');

var imageFilter = function (req, file, cb) {
    if (!file) return cb(new Error('No file was found'), false);

    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
        return cb(new Error('validation.files.invalidImageFormat'), false);
    }

    cb(null, true);
};

var generateUniqueFileName = function (file) {
    if (file && file.originalname) {
        return Guid.raw() + '.' + file.originalname.substr((~-file.originalname.lastIndexOf(".") >>> 0) + 2);
    }

    return null;
};

var getStorage = function () {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.resolve(config.uploads.profileUpload.dest));
        },
        filename: function (req, file, cb) {
            cb(null, generateUniqueFileName(file));
        }
    });
};

exports.saveFile = function (req, res, cb) {
    var upload = multer({ storage: getStorage(), fileFilter: imageFilter }).single('image');

    return upload(req, res, function (uploadError) {
        if (!uploadError && !req.file) {
            return cb(new Error('validation.files.notFound'));
        }

        let filePath = config.imageFolder + req.file.filename;

        return cb(uploadError, {
            filePath: filePath
        });
    });
};

exports.saveFiles = function (req, res, cb) {
    var upload = multer({ storage: getStorage(), fileFilter: imageFilter }).array('images');

    return upload(req, res, function (uploadError) {
        if (!uploadError && (!req.files || !req.files.length)) {
            return cb(new Error('validation.files.notFound'));
        }

        let filePaths = [];

        for (let index in req.files) {        
            filePaths.push({
                name: req.files[index].originalname,
                path: config.imageFolder + req.files[index].filename,
                mimetype: req.files[index].mimetype,
                size: req.files[index].size
            });
        }

        return cb(uploadError, {
            filePaths: filePaths
        });
    });
};

exports.deleteFile = function () {
    throw new NotImplementedError('file deletion not implemented');
};

exports.deleteImages = function (images, cb) {
    var i = images.length;

    if (!images.length) {
        return cb(null);
    }

    return images.forEach(function (image) {
        let localPath = _.replace(image.path, config.imageFolder, path.resolve(config.uploads.profileUpload.dest) + '\\');

        fs.unlink(localPath, function (err) {
            i--;
            if (err) {
                cb(err);
                return;
            } else if (i <= 0) {
                cb(null);
            }
        });
    });
};
