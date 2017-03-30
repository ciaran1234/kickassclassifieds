'use strict';

module.exports = function EntityValidationError(message, validationResult) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.validationResult = validationResult;
    this.code = 'authorization.invalidData';

    this.formatResult = function (i18n) {
        var formattedResult = {
            errors: {}
        };

        if (this.validationResult && this.validationResult.errors) {
            for (let property in this.validationResult.errors) {
                formattedResult.errors[property] = {
                    param: this.validationResult.errors[property].path,
                    message: i18n.__(this.validationResult.errors[property].message),
                    value: this.validationResult.errors[property].value
                };              
            }
        }

        return formattedResult;
    };
};

require('util').inherits(module.exports, Error);