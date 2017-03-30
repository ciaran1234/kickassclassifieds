'use strict';

module.exports = function UpdateUserValidator(req, res, next) {
    req.checkBody({
        'firstName': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.firstName.required"),
            },
            isLength: {
                options: [{ max: 30 }],
                errorMessage: req.i18n.__('validation.user.firstName.length')
            }
        },
        'lastName': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.lastName.required"),
            },
            isLength: {
                options: [{ max: 40 }],
                errorMessage: req.i18n.__('validation.user.lastName.length')
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