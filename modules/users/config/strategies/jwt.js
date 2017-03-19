'use strict';

var config = require('../../../../config/config'),
    passport = require('passport'),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    User = require('mongoose').model('User');

module.exports = function () {
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeader(),
        secretOrKey: config.sessionSecret
    }, function (jwt_payload, done) {
        User.findOne({ _id: jwt_payload.id, emailConfirmed: true }, function (err, user) {
           
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }
        });
    }));
};