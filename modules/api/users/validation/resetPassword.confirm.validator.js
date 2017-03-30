'use strict';

module.exports = function ResetPasswordConfirmedValidator(req, res, next) {
    req.checkBody({
        'token': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.resetPassword.token.required"),
            }
        },      
        'password': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.password.required"),
            },          
            isLength: {
                options: [{ min: 10, max: 128 }],
                errorMessage: req.i18n.__('validation.user.password.length')
            },
            isValidOwaspPassword: {
                errorMessage: req.i18n.__("validation.user.password.owasp"),
            }
        },
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