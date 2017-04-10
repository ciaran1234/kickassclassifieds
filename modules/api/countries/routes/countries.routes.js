'use strict';

var countries = require('../controllers/countries.controller');
var objectIdValidator = require('../../core/validation/objectId.validator');

module.exports = function (app) {
    app.route('/api/countries').get(countries.list);
    app.route('/api/countries/:id').get(objectIdValidator, countries.get);   
};