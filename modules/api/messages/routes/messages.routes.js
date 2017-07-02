'use strict';

var messages = require('../controllers/messages.controller');
var authenticate = require('../../core/security/authenticate');

module.exports = function (app) {
    app.route('/api/messages').post(authenticate, messages.post);
    app.route('/api/messages/reply').post(authenticate, messages.reply);
    app.route('/api/messages/sent').get(authenticate, messages.sent);
    app.route('/api/messages/received').get(authenticate, messages.received);
    app.route('/api/messages/markasread/:id').patch(authenticate, messages.markAsRead);
    app.route('/api/messages/:id').get(authenticate, messages.get);
};