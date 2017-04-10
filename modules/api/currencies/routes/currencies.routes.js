'use strict';

var currencies = require('../controllers/currencies.controller');
var objectIdValidator = require('../../core/validation/objectId.validator');

module.exports = function (app) {
    app.route('/api/currencies').get(currencies.list);
    app.route('/api/currencies/:id').get(objectIdValidator, currencies.get);   
};