'use strict';

var mongoose = require('mongoose');
var Currency = mongoose.model('Currency');
var EntityValidationError = require('../../../core/errors/entityValidation.error');

exports.list = function (req, res) {
    Currency.find({ 'ccy': { $exists: true } }, {
        '_id': 0,
        'ccy': 1,
        'ccyNbr': 1,
        'symbol': 1,
        'symbolNative': 1
    }).sort('ccy')
        .then(currencies => {
            return res.status(200).json(currencies);
        })
        .catch(error => {
            return res.status(500).json(req.i18n.__('http.codes.internalServerError'));
        });
};

exports.get = function (req, res) {
    Currency.findById(req.params.id).select('ccy ccyNbr symbol symbolNative')
        .then(currency => {
            if (!currency) return res.status(404).json();

            return res.status(200).json(currency);
        })
        .catch(error => {
            return res.status(500).json(req.i18n.__('http.codes.internalServerError'));
        });
};
