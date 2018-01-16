'use strict';

var config = require('./config/config');
var mongoose = require('./config/library/mongoose');
var express = require('./config/library/express');
var chalk = require('chalk');
var cluster = require('cluster');
const numCPUs = require('os').cpus().length;

mongoose.loadModels();

module.exports.loadModels = function loadModels() {
    mongoose.loadModels();
};

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (deadWorker, code, signal) => {
        console.log(`worker ${deadWorker.process.pid} died`);

        if (signal) {
            console.log(`worker was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker exited with error code: ${code}`);
        }

        // Restart the worker
        var worker = cluster.fork();       
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
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
}

