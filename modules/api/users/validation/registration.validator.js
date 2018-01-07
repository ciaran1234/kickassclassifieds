'use strict';

module.exports = function RegistrationValidator(req, res, next) {
    req.checkBody({
        'email': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.email.required"),
            },
            isEmail: {
                errorMessage: req.i18n.__("validation.email.invalid")
            },
            isLength: {
                options: [{ max: 256 }],
                errorMessage: req.i18n.__('validation.email.length')
            },
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
        'firstName': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.firstName.required"),
            },
            isLength: {
                options: [{ max: 30 }],
                errorMessage: req.i18n.__('validation.user.firstName.length')
            }
        },
        'phoneNumber': {          
            isLength: {
                options: [{ max: 15 }],
                errorMessage: req.i18n.__('validation.user.phoneNumber.length')
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
        },
        'confirmationUrl': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.user.confirmationUrl.required"),
            },
            isValidCallbackUrl: {
                errorMessage: req.i18n.__("security.callbackUrl.accountConfirmation"),
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