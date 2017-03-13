'use strict';

var passport = require('passport'),  
    path = require('path'),
    config = require(path.resolve('./config/config'));

module.exports = function(app, db) {
    // Initialize strategies
    config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function(strategy) {
        require(path.resolve(strategy))(config);
    });

    // Add passport's middleware
    app.use(passport.initialize());
};