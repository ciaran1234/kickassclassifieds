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
    errorCodes: {
        authorization: {
            invalidUsernamOrPassword: { code: 1000, message: 'Invalid email or password' },
            invalidExternalAccessToken: { code: 1001, message: 'Invalid Provider or External Access Token' },
            userAlreadySignedIn: { code: 1002, message: 'User already signed in' },
            externalUserAlreadyRegistered: { code: 1003, message: 'External user is already registered' }
        },
        validation: {
            emailAlreadyTaken: { code: 4000, message: 'email already taken'}
        }
    }
};
