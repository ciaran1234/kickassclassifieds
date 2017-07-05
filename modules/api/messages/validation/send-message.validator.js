'use strict';

module.exports = function SendMessageValidator(req, res, next) {
    req.checkBody({
        'subject': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.subject.required')
            }
        },
        'body': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.body.required')
            }
        },
        'classifiedId': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.classifiedId.required')
            },
            isValidObjectId: {
                errorMessage: req.i18n.__('validation.message.classifiedId.objectId')
            }
        },
        'url': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.message.url.required"),
            },
            isValidCallbackUrl: {
                errorMessage: req.i18n.__("validation.message.url.valid"),
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