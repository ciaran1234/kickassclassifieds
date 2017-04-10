'use strict';

var mongoose = require('mongoose');
var Country = mongoose.model('Country');

exports.list = function (req, res) {
    Country.find().sort('name')
        .then(countries => {
            return res.status(200).json(countries);
        })
        .catch(error => {
            return res.status(500).json(req.i18n.__('http.codes.internalServerError'));
        });
};

exports.get = function (req, res) {
    Country.findById(req.params.id)
        .then(country => {
            if (!country) return res.status(404).json();

            return res.status(200).json(country);
        })
        .catch(error => {
            return res.status(500).json(req.i18n.__('http.codes.internalServerError'));
        });
};
