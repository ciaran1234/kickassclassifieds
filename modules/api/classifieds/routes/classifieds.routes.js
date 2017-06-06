'use strict';

var classifieds = require('../controllers/classifieds.controller');
var authenticate = require('../../core/security/authenticate');
var objectIdValidator = require('../../core/validation/objectId.validator');
var ClassifiedValidator = require('../validation/classified.validator');
var ClassifiedDetailsValidator = require('../validation/classified.details.validator');

module.exports = function (app) {
    app.route('/api/classifieds')
        .get(classifieds.list)
        .post(authenticate, ClassifiedValidator, ClassifiedDetailsValidator, classifieds.insert);

    app.route('/api/classifieds/:id')
    .get(objectIdValidator, classifieds.get);

    app.route('/api/classifieds/:id/uploadImages')
    .post(authenticate, objectIdValidator, classifieds.uploadImages);
};