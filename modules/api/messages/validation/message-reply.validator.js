'use strict';

module.exports = function MessageReplyValidator(req, res, next) {
    req.checkBody({
        'key': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.key.required')
            }
        },
        'body': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.body.required')
            }
        },
        'url': {
            notEmpty: {
                errorMessage: req.i18n.__("message.url.required"),
            },
            isValidCallbackUrl: {
                errorMessage: req.i18n.__("message.url.valid"),
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