'use strict';

module.exports = function ExternalUserAlreadyRegisteredError(message, email) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.email = email;
    this.code = 'authorization.externalUserAlreadyRegistered';
};

require('util').inherits(module.exports, Error);