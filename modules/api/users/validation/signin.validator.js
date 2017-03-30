'use strict';

module.exports = function SigninValidator(req, res, next) {
    req.checkBody({
        'email': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.email.required"),
            },
            isEmail: {
                errorMessage: req.i18n.__("validation.email.invalid")
            },
        },
        'password': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.password.required"),
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