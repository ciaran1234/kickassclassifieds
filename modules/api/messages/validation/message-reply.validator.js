'use strict';

module.exports = function MessageReplyValidator(req, res, next) {
    req.checkBody({
        '_id': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.id.required')
            },
            isValidObjectId: {
                errorMessage: req.i18n.__('validation.message._id.objectId')
            }
        },
        'body': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.message.body.required')
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