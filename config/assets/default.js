'use strict';

module.exports = {    
    gruntConfig: 'gruntfile.js',
    allJS: ['app.js', 'config/**/*.js', 'modules/*/**/*.js'],
    models: 'modules/*/models/**/*.js',
    routes: ['modules/!(core)/routes/**/*.js', 'modules/core/routes/**/*.js'],
    configs: 'modules/*/config/**/*.js',
    policies: 'modules/*/policies/*.js'
};