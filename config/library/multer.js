'use strict';

var config = require('../config');

module.exports.imageFilter = function (req, file, cb) {

    if (!file) {
        return cb(new Error('No file was found'), false);
    }

    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
        return cb(new Error('validation.files.invalidImageFormat'), false);
    }

    cb(null, true);
};

module.exports.uniqueFileName = function (guid, file) {

    if (guid && file && file.originalname) {
        return guid + '.' + file.originalname.substr((~-file.originalname.lastIndexOf(".") >>> 0) + 2);
    }

    return null;
};

module.exports.uniqueFilePath = function (guid, file) {
    let fileName = this.uniqueFileName(guid, file);

    if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:' + config.port + '/images/' + fileName;
    }
    //if production use cdn/aws

    return fileName;
};