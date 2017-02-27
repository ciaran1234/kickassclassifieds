'use strict';

module.exports = function (app) {
    var auth = require('../controllers/users.auth.controller');
    app.route('/api/auth/signup').post(auth.signup);
    app.route('/api/auth/signin').post(auth.signin);
    app.route('/api/auth/signout').post(auth.signout);
};