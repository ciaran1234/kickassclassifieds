'use strict';

var mongoose = require('mongoose');
var Category = mongoose.model('Category');


function getErrorResult(req, message) {
    return {
        errors: {
            'category[_id]': {
                param: 'category[_id]',
                message: req.i18n.__(message)
            }
        }
    };
};

function hasValidDetails(source, target, targetProperty = '') {
 
    if (source) {
        let errors = [];

        for (let property in source) {

            if (typeof source[property].type === 'object') {
                var childResult = hasValidDetails(source[property].type, target && target[property] ? target[property] : null, property);

                if (childResult.errors) {
                    for (let i = 0; i < childResult.errors.length; i++) {
                        errors.push(childResult.errors[i]);
                    }
                }
            }
            else if (source[property].required === true && !(target && target[property])) {
                let error = {};
                error['details' + (targetProperty ? '[' + targetProperty +  ']' : targetProperty )  + '[' + property + ']'] = {
                    param: property,
                    messages: property + ' is required'
                }

                errors.push(error);
            }
        }

        if (errors.length) {
            return { isValid: false, errors: errors };
        }
        else {
            return { isValid: true };
        }
    }
    else {
        return { isValid: true };
    }
}

module.exports = function ClassifiedDetailsValidator(req, res, next) {
    let category = req.body.category;
    let target = req.body.details;

    if (!category && !category._id) {
        return res.status(400).json(getErrorResult(req, 'validation.category._id.required'));
    }

    Category.findById(category._id).select('_id details')
        .then(source => {

            if (!source) {
                return res.status(400).json(getErrorResult(req, 'validation.category.notFound'));
            }
            else {
                var validationResult = hasValidDetails(source.details, target);

                if (validationResult.isValid) {
                    next();
                    return null;
                }
                else {
                    return res.status(400).json(validationResult.errors);
                }
            }
        })
        .catch(error => {
            return res.status(500).json();
        });
};