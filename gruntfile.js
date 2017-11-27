'use strict';

var _ = require('lodash'),
    defaultAssets = require('./config/assets/default');

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        env: {
            dev: {
                NODE_ENV: 'development'
            },
            prod: {
                NODE_ENV: 'production'
            }
        },
        watch: {
            server: {
                files: _.union(defaultAssets.gruntConfig, defaultAssets.allJS),
                tasks: ['jshint'],
                options: {
                    livereload: true
                }
            }
        },
        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    nodeArgs: ['--inspect'],
                    ext: 'js',
                    watch: _.union(defaultAssets.gruntConfig, defaultAssets.allJS)
                }
            }
        },
        concurrent: {
            default: {
                tasks: ['nodemon', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        jshint: {
            all: {
                src: _.union(defaultAssets.gruntConfig, defaultAssets.allJS),
                options: {
                    jshintrc: true,
                    node: true,
                    mocha: true,
                    jasmine: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-nodemon');
    
    grunt.registerTask('default', ['env:dev', 'concurrent:default']);
    grunt.registerTask('prod', ['env:prod', 'concurrent:default']);
}