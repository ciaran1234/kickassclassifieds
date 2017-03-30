'use strict';

var config = require('../config'),
    BluebirdPromise = require('bluebird'),
    chalk = require('chalk'),
    path = require('path'),
    mongoose = require('mongoose');

mongoose.Promise = BluebirdPromise;

module.exports.loadModels = function (callback) {
    config.files.models.forEach(function (modelPath) {
        require(path.resolve(modelPath));
    });

    if (callback) callback();
};

module.exports.connect = function (cb) {   
    var db = mongoose.connect(config.db.uri, config.db.credentials, function (err) {
        // Log Error
        if (err) {
            console.error(chalk.red('Could not connect to MongoDB!'));
            console.log(err);
        } else {           
            mongoose.set('debug', config.db.debug);  // Enabling mongoose debug mode if required

            // Call callback function
            if (cb) cb(db);
        }
    });
};

module.exports.disconnect = function (cb) {
    mongoose.disconnect(function (err) {
        console.info(chalk.yellow('Disconnected from MongoDB.'));
        cb(err);
    });
};