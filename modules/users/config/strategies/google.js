'use strict';

var config = require('../../../../config/config'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    users = require('../../controllers/users.auth.controller');

module.exports = function () {
    // Use google strategy
    passport.use(new GoogleStrategy({
        clientID: config.google.clientID,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackURL,
        passReqToCallback: true
    },
        function (req, accessToken, refreshToken, profile, done) {    
            // Set the provider data and include tokens
            var providerData = profile._json;
            providerData.accessToken = accessToken;
            providerData.refreshToken = refreshToken;

            // Create the user OAuth profile
            var providerUserProfile = {
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                displayName: profile.displayName,
                email: profile.emails[0].value,
                username: profile.username,
                profileImageURL: (providerData.picture) ? providerData.picture : undefined,
                provider: 'google',
                providerIdentifierField: 'id',
                providerData: providerData
            };

            users.findOrCreateOAuthProfile(req, providerUserProfile, done);
        }));
};
