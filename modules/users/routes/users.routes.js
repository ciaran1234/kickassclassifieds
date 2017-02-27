'use strict';

var userPolicy = require('../policies/users.poclicy');

module.exports = function (app) {
    var users = require('../controllers/users.controller');

    app.route('/api/users/me').get(userPolicy.isAllowed, users.me);
    app.route('/api/users').put(userPolicy.isAllowed, users.update);
    app.route('/api/users/picture').post(userPolicy.isAllowed, users.changeProfilePicture);
};