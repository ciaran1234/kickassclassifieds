'use strict';

var classifieds = require('../controllers/classifieds.controller');
var authenticate = require('../../core/security/authenticate');
var objectIdValidator = require('../../core/validation/objectId.validator');
var ClassifiedValidator = require('../validation/classified.validator');
var ClassifiedDetailsValidator = require('../validation/classified.details.validator');
var ReportClassifiedValidator = require('../validation/reportClassified.validator');
var getUser = require('../../core/security/getUser');

module.exports = function (app) {
    app.route('/api/classifieds')
        .get(getUser, classifieds.list)
        .post(authenticate, ClassifiedValidator, ClassifiedDetailsValidator, classifieds.insert);

    app.route('/api/classifieds/:id')
        .get(objectIdValidator, classifieds.get)
        .delete(authenticate, objectIdValidator, classifieds.delete);

    app.route('/api/classifieds/:id/images')
        .post(authenticate, objectIdValidator, classifieds.addImages)
        .delete(authenticate, objectIdValidator, classifieds.deleteImages);

    app.route('/api/classifieds')
        .put(authenticate, ClassifiedValidator, ClassifiedDetailsValidator, classifieds.update);

    app.route('/api/classifieds/report')
        .post(ReportClassifiedValidator, classifieds.report);
};