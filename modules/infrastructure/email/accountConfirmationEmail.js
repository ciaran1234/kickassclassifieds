'use strict';

var nodemailer = require('nodemailer'),
    config = require('../../../config/config'),
    path = require('path'),
    EmailTemplate = require('email-templates').EmailTemplate,
    templatesDir = path.resolve(__dirname, './', 'templates'),
    template = new EmailTemplate(path.join(templatesDir, 'accountConfirmation'));

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
