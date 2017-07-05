'use strict';

var mongoose = require('mongoose');
var Classified = mongoose.model('Classified');
var redis = require('redis');
var bluebird = require('bluebird');
var config = require('../../../../config/config');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var client = redis.createClient(config.cache);
var messageService = require('../../../services/messages/messages.service');
var EntityNotFound = require('../../../core/errors/entityNotFound.error');

exports.post = function (req, res) {
    return messageService.send(req.body, req.user, req.headers.origin)
        .then(result => res.status(200).json())
        .catch(EntityNotFound => res.status(404).json())
        .catch(error => res.status(500).json());
};

exports.reply = function (req, res) {
    return messageService.reply(req.body, req.user, req.headers.origin)
        .then(reply => res.status(200).json(reply))
        .catch(error => res.status(500).json());
};

exports.received = function (req, res) {
    return messageService.getReceived(req.user)
        .then(messages => res.status(200).json(messages))
        .catch(error => res.status(500).json());
};

exports.sent = function (req, res) {
    return messageService.getSent(req.user)
        .then(messages => res.status(200).json(messages))
        .catch(error => {
            return res.status(500).json();
        });
};

exports.get = function (req, res) {
    return messageService.get(req.params.id)
        .then(messages => res.status(200).json(messages))
        .catch(EntityNotFound => res.status(404).json())
        .catch(error => res.status(500).json());
};

exports.markAsRead = function (req, res) {
    let key = req.params.id;

    return messageService.markAsRead(key, req.user)
        .then(result => res.status(200).json())
        .catch(error => res.status(500).json());
};

