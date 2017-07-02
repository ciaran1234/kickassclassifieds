'use strict';

var mongoose = require('mongoose');
var Classified = mongoose.model('Classified');
var redis = require('redis');
var bluebird = require('bluebird');
var config = require('../../../../config/config');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var client = redis.createClient(config.cache);
var guid = require('guid');

exports.post = function (req, res) {
    let message = req.body;

    return Classified.findById(message.classifiedId)
        .then(classified => {
            let key = 'message:from:' + req.user._id + ':to:' + classified.advertiser._id + ':id:' + guid.raw();
            let timestamp = new Date();
            timestamp.setDate(timestamp.getDate());

            client.lpushAsync('messages:sent:' + req.user._id, JSON.stringify({
                key: key,
                subject: message.subject,
                timestamp: timestamp,
                to: {
                    _id: classified.advertiser._id,
                    firstName: classified.advertiser.firstName,
                    lastName: classified.advertiser.lastName,
                    email: classified.advertiser.email
                }
            }));

            client.lpushAsync('messages:received:' + classified.advertiser._id, JSON.stringify({
                key: key,
                subject: message.subject,
                timestamp: timestamp,
                from: {
                    _id: req.user._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email
                },
                read: false
            }));

            return client.rpushAsync(key, JSON.stringify({
                subject: message.subject,
                body: message.body,
                timestamp: timestamp,
                from: {
                    _id: req.user._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email
                },
                to: {
                    _id: classified.advertiser._id,
                    firstName: classified.advertiser.firstName,
                    lastName: classified.advertiser.lastName,
                    email: classified.advertiser.email
                }
            }))
                .then(result => {
                    return res.status(200).json();
                })
                .catch(error => {
                    return res.status(500).json();
                });
        });
};

exports.reply = function (req, res) {
    let key = req.body.key;
    let timestamp = new Date();
    timestamp.setDate(timestamp.getDate());

    return client.lrangeAsync(key, 0, -1)
        .then(messages => {
            let message;

            for (let i in messages) {
                message = JSON.parse(messages[i]);

                if (message.from._id !== req.user._id.toString()) {
                    break;
                }
            }

            return {
                to: message.from,
                from: {
                    _id: req.user._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email
                },
                timestamp: timestamp,
                subject: message.subject,
                body: req.body.body,
                count: messages.length
            };
        })
        .then(reply => {
            client.rpushAsync(key, JSON.stringify(reply));
            return reply;
        })
        .then(reply => {
            if (reply.count === 1) {
                client.lpushAsync('messages:received:' + reply.to._id, JSON.stringify({
                    key: key,
                    subject: reply.subject,
                    timestamp: timestamp,
                    from: reply.from,
                    read: false
                }));
            }
            else {
                //move the message in messages:received to top of list and mark it as unread
                client.lrangeAsync('messages:received:' + reply.to._id, 0, -1)
                    .then(messages => {
                        let index = 0;

                        for (let i in messages) {
                            messages[i] = JSON.parse(messages[i]);

                            if (messages[i].key === key) {
                                index = i;
                                break;
                            }
                        }

                        return index;
                    })
                    .then(index => {
                        return client.lsetAsync('messages:received:' + reply.to._id, index, '_deleted_');
                    })
                    .then(response => {
                        return client.lremAsync('messages:received:' + reply.to._id, 1, '_deleted_');
                    })
                    .then(response => {
                        return client.lpushAsync('messages:received:' + reply.to._id, JSON.stringify({
                            key: key,
                            subject: reply.subject,
                            timestamp: timestamp,
                            from: reply.from,
                            read: false
                        }));
                    });
            }

            return reply;
        })
        .then(reply => res.status(200).json(reply))
        .catch(error => res.status(500).json());
};

exports.received = function (req, res) {
    return client.lrangeAsync('messages:received:' + req.user._id, 0, -1)
        .then(response => {
            for (let i in response) {
                response[i] = JSON.parse(response[i]);
            }

            return res.status(200).json(response);
        })
        .catch(error => {
            return res.status(500).json();
        });
};

exports.sent = function (req, res) {
    return client.lrangeAsync('messages:sent:' + req.user._id, 0, -1)
        .then(response => {
            for (let i in response) {
                response[i] = JSON.parse(response[i]);
            }

            return res.status(200).json(response);
        })
        .catch(error => {
            return res.status(500).json();
        });
};

exports.get = function (req, res) {
    return client.lrangeAsync(req.params.id, 0, -1)
        .then(messages => {
            if (messages.length === 0) return res.status(404).json();

            for (let i in messages) {
                messages[i] = JSON.parse(messages[i]);
            }

            return res.status(200).json(messages);
        })
        .catch(error => res.status(500).json());
};

exports.markAsRead = function (req, res) {
    let key = req.params.id;

    return client.lrangeAsync('messages:received:' + req.user._id, 0, -1)
        .then(messages => {
            for (let i in messages) {
                messages[i] = JSON.parse(messages[i]);

                if (messages[i].key === key) {
                    messages[i].read = true;
                    return { message: messages[i], index: i };
                }
            }
        })
        .then(result => {
            if (result) {
                return client.lset('messages:received:' + req.user._id, result.index, JSON.stringify(result.message));
            }

            return null;
        })
        .then(result => res.status(200).json())
        .catch(error => res.status(500).json());
};

