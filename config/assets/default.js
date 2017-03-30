'use strict';

module.exports = {    
    gruntConfig: 'gruntfile.js',
    allJS: ['app.js', 'config/**/*.js', 'modules/*/**/*.js'],
    models: 'modules/core/models/**/*.js',
    routes: ['modules/api/!(core)/routes/**/*.js', 'modules/core/routes/**/*.js'],
    configs: 'modules/api/*/config/**/*.js',
    policies: 'modules/api/*/policies/*.js'
};