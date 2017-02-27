'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    multer = require('multer'),
    multerExtension = require(path.resolve('./config/library/multer')),
    mongoose = require('mongoose'),
    config = require(path.resolve('./config/config')),
    Guid = require('guid'),
    User = mongoose.model('User');

exports.update = function (req, res) {
    var user = req.user;

    // For security measurement we remove the roles from the req.body object
    delete req.body.roles;

    //remove email as it's apart of identity
    delete req.body.email;

    if (user) {
        user = _.extend(user, req.body);
        user.updated = Date.now();

        user.save(function (err) {
            if (err) {
                return res.status(400).send(err);
            } else {
                req.login(user, function (err) {
                    if (err) {
                        res.status(400).send(err);
                    } else {
                        res.json(user);
                    }
                });
            }
        });
    }
    else {
        return res.status(401).send('Unauthorized');
    }
};

exports.changeProfilePicture = function (req, res) {
    var user = req.user;
    var message = null;
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

    if (user) {
        upload(req, res, function (uploadError) {
            if (uploadError) {
                return res.status(400).send({
                    message: uploadError.message
                });
            } else {
                user.profileImageUrl = multerExtension.uniqueFileName(guid, req.file);

                if (!user.profileImageUrl) {
                    return res.status(400).send({ message: 'No Image Found' });
                }

                user.save(function (saveError) {
                    if (saveError) {
                        return res.status(400).send(saveError);
                    } else {
                        req.login(user, function (err) {
                            if (err) {
                                res.status(400).send(err);
                            } else {
                                res.json(user);
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.status(401).send('Unauthorized');
    }
};

exports.me = function (req, res) {
    res.json(req.user || null);
};