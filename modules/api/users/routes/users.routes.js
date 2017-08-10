'use strict';

var userPolicy = require('../policies/users.poclicy');
var authenticate = require('../../core/security/authenticate');
var UpdateUserValidator = require('../validation/user.update.validator');
var WishlistValidator = require('../validation/wishlist.validator');

module.exports = function (app) {
    var users = require('../controllers/users.controller');
    app.route('/api/users/me').get(authenticate, userPolicy.isAllowed, users.me);
    app.route('/api/users/me/classifieds').get(authenticate, userPolicy.isAllowed, users.classifieds);
    app.route('/api/users').put(authenticate, userPolicy.isAllowed, UpdateUserValidator, users.update);
    app.route('/api/users/picture').post(authenticate, userPolicy.isAllowed, users.changeProfilePicture);

    app.route('/api/users/wishlist').get(authenticate, users.getWishlist);

    app.route('/api/users/wishlist/:id')
        .post(authenticate, WishlistValidator, users.addToWishlist)
        .delete(authenticate, users.removeFromWishlist);
};