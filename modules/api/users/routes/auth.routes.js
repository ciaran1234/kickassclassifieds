'use strict';

var authenticate = require('../../core/security/authenticate'),
    externalSigninValidator = require('../validation/externalSigin.validator'),
    confirmAccountValidator = require('../validation/confirmAccount.validator'),
    registrationValidator = require('../validation/registration.validator'),
    resetPasswordConfirmedValidator = require('../validation/resetPassword.confirm.validator'),
    resetPasswordRequestValidator = require('../validation/resetPassword.request.validator'),
    signinValidator = require('../validation/signin.validator'),
    config = require('../../../../config/config');

module.exports = function (app) {
    var auth = require('../controllers/users.auth.controller');

    app.route('/api/auth/signup').post(registrationValidator, auth.signup);
    app.route('/api/auth/signin').post(signinValidator, auth.signin);
    app.route('/api/auth/signout').post(auth.signout);
   
    app.route('/api/auth/facebook').get(externalSigninValidator, auth.openAuthCall('facebook', config.facebook.scope));
    app.route('/api/auth/facebook/callback').get(auth.openAuthCallback('facebook'));
   
    app.route('/api/auth/google').get(externalSigninValidator, auth.openAuthCall('google', config.google.scope));
    app.route('/api/auth/google/callback').get(auth.openAuthCallback('google'));

    app.route('/api/auth/exchange').get(auth.exchangeAccessToken);

    app.route('/api/auth/resetPassword').post(resetPasswordRequestValidator, auth.resetPasswordRequest);
    app.route('/api/auth/confirmResetPassword').post(resetPasswordConfirmedValidator, auth.resetPasswordConfirmed);
    app.route('/api/auth/confirm').post(confirmAccountValidator, auth.confirmAccount);  
};