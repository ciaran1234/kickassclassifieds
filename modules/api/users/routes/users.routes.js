'use strict';

var userPolicy = require('../policies/users.poclicy'),
    authenticate = require('../../core/security/authenticate'),
    UpdateUserValidator = require('../validation/user.update.validator');

module.exports = function (app) {
    var users = require('../controllers/users.controller');   
    app.route('/api/users/me').get(authenticate, userPolicy.isAllowed, users.me);   
    app.route('/api/users/me/classifieds').get(authenticate, userPolicy.isAllowed, users.classifieds);
    app.route('/api/users').put(authenticate, userPolicy.isAllowed, UpdateUserValidator, users.update);
    app.route('/api/users/picture').post(authenticate, userPolicy.isAllowed, users.changeProfilePicture);    
};