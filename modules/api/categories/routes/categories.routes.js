'use strict';

var categories = require('../controllers/categories.controller');
var objectIdValidator = require('../../core/validation/objectId.validator');

module.exports = function (app) {
    app.route('/api/categories').get(categories.list);
    app.route('/api/categories/parents').get(categories.parents);
    app.route('/api/categories/:id/subcategories').get(objectIdValidator, categories.children);
    app.route('/api/categories/:id').get(objectIdValidator, categories.get);
};