'use strict';

var _ = require('lodash'),
    chalk = require('chalk'),
    glob = require('glob'),
    fs = require('fs'),
    path = require('path');

var getGlobbedPaths = function (globPatterns, excludes) {
    // Url paths Regex
    var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

    var output = [];

    if (_.isArray(globPatterns)) {
        globPatterns.forEach(function (globPatterns) {
            output = _.union(output, getGlobbedPaths(globPatterns, excludes));
        });
    }
    else if (_.isString(globPatterns)) {
        if (urlRegex.test(globPatterns)) {
            output.push(globPatterns);
        }
        else {
            var files = glob.sync(globPatterns);

            if (excludes) {
                files = files.map(function (file) {
                    if (_.isArray(excludes)) {
                        for (var i in excludes) {
                            file = file.replace(excludes[i], '');
                        }
                    }
                    else {
                        file = file.replace(excludes, '');
                    }
                    return file;
                });
            }
            output = _.union(output, files);
        }
    }

    return output;
};

var validateEnvironmentVariable = function () {
    var environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
    console.log();
    if (!environmentFiles.length) {

        if (process.env.NODE_ENV) {
            console.error(chalk.red('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead'));
        } else {
            console.error(chalk.red('+ Error: NODE_ENV is not defined! Using default development environment'));
        }

        process.env.NODE_ENV = 'development';
    }
    // Reset console color
    console.log(chalk.white(''));
};

/**
 * Validate Session Secret parameter is not set to default in production
 */
var validateSessionSecret = function (config, testing) {

    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    if (config.sessionSecret === 'MEAN') {
        if (!testing) {
            console.log(chalk.red('+ WARNING: It is strongly recommended that you change sessionSecret config while running in production!'));
            console.log(chalk.red('  Please add `sessionSecret: process.env.SESSION_SECRET || \'super amazing secret\'` to '));
            console.log(chalk.red('  `config/env/production.js` or `config/env/local.js`'));
            console.log();
        }
        return false;
    } else {
        return true;
    }
};

var initGlobalConfigFolders = function (config, assets) {
    config.folders = {};
};

var initGlobalConfigFiles = function (config, assets) {
    config.files = {};
    config.files.models = getGlobbedPaths(assets.models);
    config.files.routes = getGlobbedPaths(assets.routes);
    config.files.configs = getGlobbedPaths(assets.configs);
    config.files.policies = getGlobbedPaths(assets.policies);
};

var initGlobalConfig = function () {
    validateEnvironmentVariable();

    var defaultAssets = require(path.join(process.cwd(), 'config/assets/default'));
    var environmentAssets = require(path.join(process.cwd(), 'config/assets/', process.env.NODE_ENV)) || {};
    var assets = _.merge(defaultAssets, environmentAssets);

    var defaultConfig = require(path.join(process.cwd(), 'config/env/default'));
    var environmentConfig = require(path.join(process.cwd(), 'config/env/', process.env.NODE_ENV));
    var config = _.merge(defaultConfig, environmentConfig);


    initGlobalConfigFiles(config, assets);
    initGlobalConfigFolders(config, assets);
    
    validateSessionSecret(config);

    config.utils = {
        getGlobbedPaths: getGlobbedPaths
    };

    return config;
};

module.exports = initGlobalConfig();

