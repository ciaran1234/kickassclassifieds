'use strict';

var userPolicy = require('../policies/users.poclicy');
var passport = require('passport');
module.exports = function (app) {
    var users = require('../controllers/users.controller');
    var authenticate = passport.authenticate('jwt', { session: false });

    app.route('/api/users/me').get(authenticate, userPolicy.isAllowed, users.me);
    app.route('/api/users').put(authenticate, userPolicy.isAllowed, users.update);
    app.route('/api/users/picture').post(authenticate, userPolicy.isAllowed, users.changeProfilePicture);
};