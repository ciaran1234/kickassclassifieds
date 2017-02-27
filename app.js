'use strict';

var config = require('./config/config'),
    mongoose = require('./config/library/mongoose'),
    express = require('./config/library/express'),
    chalk = require('chalk');

mongoose.loadModels();

module.exports.loadModels = function loadModels() {
    mongoose.loadModels();
};

mongoose.connect(function (db) {
    var app = express.init(db);

    app.listen(config.port, function () {     
        console.log('--');
        console.log(chalk.green(config.app.title));
        console.log(chalk.green('Environment:\t\t\t' + process.env.NODE_ENV));
        console.log(chalk.green('Port:\t\t\t\t' + config.port));
        console.log(chalk.green('Database:\t\t\t\t' + config.db.uri));
        if (process.env.NODE_ENV === 'secure') {
            console.log(chalk.green('HTTPs:\t\t\t\ton'));
        }     
        console.log('--');
    });
});