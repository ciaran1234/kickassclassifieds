'use strict';

var mongoose = require('mongoose');
var Category = mongoose.model('Category');
var _ = require('lodash');

function getError(properties, message, options) {
    options = options || {};
    options.property = options.property || properties[(properties.length - 1)];

    let error = {};
    let errorProperty = '';

    for (let option in options) {
        message = _.replace(message, '{{' + option + '}}', options[option]);
    }

    for (let i = 0; i < properties.length; i++) {
        if (i === 0) {
            errorProperty = properties[0];
        }
        else if (properties[i].length) {
            errorProperty += '[' + properties[i] + ']';
        }
    }

    error[errorProperty] = {
        param: errorProperty,
        messages: message
    };

    return error;
}

function hasValidType(value, type) {
    var isValid = false;

    switch (_.toLower(type)) {
        case 'string':
            isValid = _.isString(value);
            break;
        case 'int':
            isValid = _.isInteger(value);
            break;
        case 'decimal':
            isValid = _.isFinite(value);
            break;
        case 'date':
            isValid = _.isDate(value);
            break;      
        case 'boolean':
            isValid = _.isBoolean(value);
            break;
        default:
            break;
    }

    return isValid;
}

function hasValidOption(value, data) {
    if (!data || !_.isArray(data)) {
        return true;
    }
    else {
        return data.indexOf(value) > -1;
    }
}

function hasValidMax(value, max) {
    if (!max) return true;

    return _.lte(value, max);
}

function hasValidMin(value, min) {
    if (!min) return true;

    return _.gte(value, min);
}

function hasValidDetails(source, target, i18n, properties = ['details']) {
    if (source) {
        let errors = [];

        for (let property in source) {
            properties.push(property);

            if (source[property].max && source[property].max === 'currentYear') {
                source[property].max = new Date().getFullYear();
            }

            if (typeof source[property].type === 'object') {
                var childResult = hasValidDetails(source[property].type, target && target[property] ? target[property] : null, i18n, properties);

                if (childResult.errors) {
                    for (let i = 0; i < childResult.errors.length; i++) {
                        errors.push(childResult.errors[i]);
                    }
                }
            }
            else if (source[property].required === true && !(target && target[property])) {
                errors.push(getError(properties, i18n.__('validation.required'),
                    { property: source[property].displayName }));
            }
            else if (!hasValidType(target[property], source[property].type)) {
                errors.push(getError(properties,
                    i18n.__('validation.hasInvalidType.' + _.toLower(source[property].type)),
                    { property: source[property].displayName }));
            }
            else if (!hasValidOption(target[property], source[property].data)) {
                errors.push(getError(properties, i18n.__('validation.hasInvalidOption'),
                    { property: source[property].displayName, min: source[property].min }));
            }
            else if (!hasValidMin(target[property], source[property].min)) {
                errors.push(getError(properties, i18n.__('validation.hasInvalidMin'),
                    { property: source[property].displayName, min: source[property].min }));
            }
            else if (!hasValidMax(target[property], source[property].max)) {
                errors.push(getError(properties, i18n.__('validation.hasInvalidMax'),
                    { property: source[property].displayName, max: source[property].max }));
            }

            properties.pop(property);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    else {
        return { isValid: true };
    }
}

module.exports = function ClassifiedDetailsValidator(req, res, next) {
    let category = req.body.category;
    let target = req.body.details;

    Category.findById(category._id).select('_id details')
        .then(source => {
            if (!source) {
                return res.status(400).json(getError(['category', '_id'], req.i18n.__('validation.category.notFound')));
            }
            else {
                var validationResult = hasValidDetails(source.details, target, req.i18n);

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