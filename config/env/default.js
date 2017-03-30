'use strict';

module.exports = {
    app: {
        title: 'Kick Ass Classifieds',
        description: 'Kicking Ass',
        keywords: 'mongodb, express, angularjs, node.js, mongoose, passport',
        googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
    },
    port: process.env.PORT || 3000,
    // Session Cookie settings
    sessionCookie: {
        // session expiration is set by default to 24 hours
        maxAge: 24 * (60 * 60 * 1000),
        // httpOnly flag makes sure the cookie is only accessed
        // through the HTTP protocol and not JS/browser
        httpOnly: true,
        // secure cookie should be turned to true to provide additional
        // layer of security so that the cookie is set only when working
        // in HTTPS mode.
        secure: false
    },
    jwt: {
        expiration: 24 * (60 * 60) // expires in 24 hours
    },
    // sessionSecret should be changed for security measures and concerns
    sessionSecret: process.env.SESSION_SECRET || 'MEAN',
    // sessionKey is set to the generic sessionId key used by PHP applications
    // for obsecurity reasons
    sessionKey: 'sessionId',
    sessionCollection: 'sessions',
    oauthProviderSecret: process.env.OAUTH_PROVIDER_SECRET || 'MEAN',
    accountTokenSecret: process.env.ACCOUNT_CONFIRMATION_SECRET || 'MEAN',
    resetPasswordSecret: process.env.RESET_PASSWORD_SECRET || 'MEAN',
    logo: 'modules/core/client/img/brand/logo.png',
    favicon: 'modules/core/client/img/brand/favicon.ico',
    uploads: {
        profileUpload: {
            //./modules/users/client/img/profile/uploads/
            dest: './tmp/images', // Profile upload destination path
            limits: {
                fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
            }
        }
    },
    email: {
        credentials: {
            service: 'gmail',
            auth: {
                user: 'ciaran.mcdonald4@gmail.com',
                pass: 'electromagnetism'
            }
        },
        applicationAddress: '"Kick Ass Classifieds" <ciaran.mcdonald4@gmail.com>'
    },
    errorCodes: {
        authorization: {        
            userAlreadySignedIn: { code: 1002, message: 'User already signed in' },              
        }      
    }
};
