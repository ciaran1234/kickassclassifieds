'use strict';

module.exports = {
    secure: {
        ssl: true,
        privateKey: './config/sslcerts/key.pem',
        certificate: './config/sslcerts/cert.pem'
    },
    db: {
        uri: 'mongodb://ciaran_admin:Elecmag1!@cluster0-shard-00-00-6fvrq.mongodb.net:27017,cluster0-shard-00-01-6fvrq.mongodb.net:27017,cluster0-shard-00-02-6fvrq.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin',
        credentials: {
            user: '',
            password: ''
        },
        debug: false
    },
    port: 80,
    cache: {
        host: 'classified-redis.rzimio.0001.use1.cache.amazonaws.com',
        port: '6379'
    },
    app: {
        title: 'Kick Ass Classifieds'
    },
    sessionSecret: 'sdkflskfkl;234!!x_sjksdklkj+(xx',
    facebook: {
        clientID: process.env.FACEBOOK_ID || '431431603869202',
        clientSecret: process.env.FACEBOOK_SECRET || '124031dacc0f40ebf6b5119514eba438',
        callbackURL: '/api/auth/facebook/callback',
        scope: { scope: ['email'] },
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
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
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
    cors: {
        enabled: true,
        allowedOrigins: ['http://localhost:4200']
    },
    whitelistUrls: ['http://localhost:4200']
};