'use strict';
var passport = require('passport');

module.exports = function GetUser(req, res, next) {
    return passport.authenticate('jwt', { session: false }, function (err, user, info) {        
        req.user = user;
        return next(err, user, info);
    })(req, res, next);
};