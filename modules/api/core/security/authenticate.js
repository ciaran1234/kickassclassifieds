'use strict';

var passport = require('passport');

module.exports = function Authenticate(req, res, next) {
    return passport.authenticate('jwt', { session: false }, function (err, user, info) {
        if (!user) {
            return res.status(401).json({
                errors: {
                    message: req.i18n.__("http.codes.unauthorized")
                }
            });
        }
        else {
            req.user = user;
        }

        return next(err, user, info);
    })(req, res, next);
};