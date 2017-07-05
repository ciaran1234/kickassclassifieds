'use strict';

var nodemailer = require('nodemailer');
var config = require('../../../config/config');
var path = require('path');
var EmailTemplate = require('email-templates').EmailTemplate;
var templatesDir = path.resolve(__dirname, './', 'templates');
var template = new EmailTemplate(path.join(templatesDir, 'classifiedEnquiry'));

exports.send = function (user, callbackUrl, cb) {
    template.render({
        name: user.firstName,
        appName: config.app.title,
        callbackUrl: callbackUrl
    }, function (err, result) {
        var transporter = nodemailer.createTransport(config.email.credentials);
        transporter.sendMail({
            from: config.email.applicationAddress,
            to: user.email,
            subject: result.subject,
            text: result.text,
            html: result.html
        }, cb);
    });
};