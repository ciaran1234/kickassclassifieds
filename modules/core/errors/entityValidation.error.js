'use strict';

module.exports = function EntityValidationError(message, errors) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.errors = errors || {};
    this.code = 'authorization.invalidData';

    this.i18n = function (i18n) {
        var formattedResult = {
            errors: {}
        };

        if (this.errors) {
            for (let property in this.errors) {
                formattedResult.errors[property] = {
                    param: this.errors[property].path,
                    message: i18n.__(this.errors[property].message),
                    value: this.errors[property].value
                };              
            }
        }

        return formattedResult;
    };
};

require('util').inherits(module.exports, Error);