'use strict';

var Guid = require('guid'),
    config = require('../../../config/config'),
    multer = require('multer'),
    path = require('path'),
    multerExtension = require(path.resolve('./config/library/multer')),
    NotImplementedError = require('../../core/errors/notImplementedError');

module.exports = {
    saveFile(req, res, cb) {
        var guid = Guid.raw();

        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, path.resolve(config.uploads.profileUpload.dest));
            },
            filename: function (req, file, cb) {
                cb(null, multerExtension.uniqueFileName(guid, file));
            }
        });

        var upload = multer({ storage: storage, fileFilter: multerExtension.imageFilter }).single('image');

        return upload(req, res, function (uploadError) {
            if (!uploadError && !req.file) {
                return cb(new Error('validation.files.notFound'));
            }

            var filePath = multerExtension.uniqueFilePath(guid, req.file);
            return cb(uploadError, {
                filePath: filePath
            });
        });
    },
    deleteFile() {
        throw new NotImplementedError('file deletion not implemented');
    }
};