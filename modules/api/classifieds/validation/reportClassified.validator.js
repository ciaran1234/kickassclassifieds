'use strict';

module.exports = function ClassifiedValidator(req, res, next) {
    req.checkBody({
        'id': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.report.id.required')
            },
            isValidObjectId: {
                errorMessage: req.i18n.__('validation.classified.report.id.objectId')
            }
        },
        'reason': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.report.reason.required')
            },
            isLength: {
                options: [{ max: 100 }],
                errorMessage: req.i18n.__('validation.classified.report.reason.length')
            }
        },
        'information': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.report.information.required')
            },
            isLength: {
                options: [{ max: 2000 }],
                errorMessage: req.i18n.__('validation.classified.report.information.required')
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