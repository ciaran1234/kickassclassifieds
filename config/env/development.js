'use strict';

var defaultEnvConfig = require('./default');

module.exports = {
    db: {
        uri: 'mongodb://localhost/kickassclassifieds',
        credentials: {
            user: '',
            password: ''
        },
        debug: false
    },
    app: {
        title: defaultEnvConfig.app.title + ' - Development Environment'
    },
    facebook: {
        clientID: process.env.FACEBOOK_ID || '431431603869202',
        clientSecret: process.env.FACEBOOK_SECRET || '124031dacc0f40ebf6b5119514eba438',
        callbackURL: '/api/auth/facebook/callback',
        appToken: '431431603869202|89vVaoi1TOX4sKG3yLKgpK9xt-8',
        verificationUrl: 'https://graph.facebook.com/debug_token?input_token=#{clientAccessToken}&access_token=#{appToken}'
    },
    twitter: {
        clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
        clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
        callbackURL: '/api/auth/twitter/callback'
    },
    google: {
        clientID: process.env.GOOGLE_ID || '449715294481-peuaa6413388nfn0utf1uosv1lleu3ti.apps.googleusercontent.com',
        clientSecret: process.env.GOOGLE_SECRET || 'nR0DxFfoFsugzxA-l84tWZpd',
        callbackURL: '/api/auth/google/callback',
         verificationUrl: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=#{clientAccessToken}'
    },    
    linkedin: {
        clientID: process.env.LINKEDIN_ID || 'APP_ID',
        clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
        callbackURL: '/api/auth/linkedin/callback'
    },
    github: {
        clientID: process.env.GITHUB_ID || 'APP_ID',
        clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
        callbackURL: '/api/auth/github/callback'
    },
    paypal: {
        clientID: process.env.PAYPAL_ID || 'CLIENT_ID',
        clientSecret: process.env.PAYPAL_SECRET || 'CLIENT_SECRET',
        callbackURL: '/api/auth/paypal/callback',
        sandbox: true
    },
    livereload: true,
    cors: {
        enabled: true,
        allowedOrigins: ['*']
    }
};