'use strict';

var mongoose = require('mongoose');
var Category = mongoose.model('Category');
var EntityValidationError = require('../../../core/errors/entityValidation.error');

exports.list = function (req, res) {
    Category.find({ parent: { $exists: false } })
        .select('_id name')
        .then(categories => {
            return res.status(200).json(categories);
        })
        .catch(error => res.status(500).json());
};

exports.children = function (req, res) {
    Category.find({ parent: req.params.id })
        .select('_id name')
        .then(categories => {
            return res.status(200).json(categories);
        })
        .catch(error => res.status(500).json());
};

exports.get = function (req, res) {
    Category.findById(req.params.id).select('_id name parent children')
        .then(category => {
            if (!category) return res.status(404).json();

            return res.status(200).json(category);
        })
        .catch(error => {
            return res.status(500).json();
        });
};
