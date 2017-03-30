'use strict';

module.exports = function InvalidExternalTokenError(message, user) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.user = user;
    this.code = 'authorization.invalidExternalAccessToken';
};

require('util').inherits(module.exports, Error);