'use strict';

var passport = require('passport');

module.exports = function (app) {
    var authenticate = passport.authenticate('jwt', { session: false });

    var auth = require('../controllers/users.auth.controller');
    app.route('/api/auth/signup').post(auth.signup);
    app.route('/api/auth/signin').post(auth.signin);
    app.route('/api/auth/signout').post(auth.signout);

    //app.route('api/auth/externalProviders').get(authenticate, auth.externalProviders);
    app.route('/api/auth/externalProviders/facebook').post(authenticate, auth.addExternalLogin('facebook', { scope: ['email'] }));
    app.route('/api/auth/facebook').get(auth.openAuthCall('facebook', { scope: ['email'] }));
    app.route('/api/auth/facebook/callback').get(auth.openAuthCallback('facebook'));
    app.route('/api/auth/exchange').get(auth.exchangeAccessToken);
};