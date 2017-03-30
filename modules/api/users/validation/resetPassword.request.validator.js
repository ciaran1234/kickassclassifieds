'use strict';

module.exports = function ResetPasswordRequestValidator(req, res, next) {
    req.checkBody({
        'email': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.email.required"),
            },
            isEmail: {
                errorMessage: req.i18n.__("validation.email.invalid")
            }        
        },
        'callbackUrl': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.resetPassword.callbackUrl.required"),
            },
            isValidCallbackUrl: {
                errorMessage: req.i18n.__("security.callbackUrl.resetPassword"),
            }
        }
    });

    req.getValidationResult().then(result => {
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.useFirstErrorOnly().mapped() });
        }
        else {
            next();
        }
    });
};