'use strict';

module.exports = function ClassifiedValidator(req, res, next) {
    req.checkBody({
        'title': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.title.required')
            },
            isLength: {
                options: [{ max: 100 }],
                errorMessage: req.i18n.__('validation.classified.title.length')
            }
        },
        'description': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.description.required')
            },
            isLength: {
                options: [{ max: 2000 }],
                errorMessage: req.i18n.__('validation.classified.description.length')
            }
        },
        'category._id': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.category._id.required')
            },
            isValidObjectId: {
                errorMessage: req.i18n.__('validation.category._id.objectId')
            }
        },
        'category.name': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.category.name.required')
            }
        },      
        'country.code': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.country.code.required')
            },
            isInt: {
                errorMessage: req.i18n.__('validation.classified.country.code.integer')
            }
        },
        'country.name': {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.country.name.required')
            },
            isLength: {
                options: [{ max: 50 }],
                errorMessage: req.i18n.__('validation.classified.country.name.length')
            }
        },
        "region.name": {
            notEmpty: {
                errorMessage: req.i18n.__('validation.classified.region.required')
            },
            isLength: {
                options: [{ max: 50 }],
                errorMessage: req.i18n.__('validation.classified.region.length')
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