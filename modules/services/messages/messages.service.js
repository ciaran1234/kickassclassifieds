'use strict';

var redis = require('redis');
var bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var config = require('../../../config/config');
var client = redis.createClient(config.cache);
var guid = require('guid');
var Promise = require('bluebird');
var enquiryEmail = require('../../infrastructure/email/classifiedEnquiryEmail');
var mongoose = require('mongoose');
var Classified = mongoose.model('Classified');
var EntityNotFoundError = require('../../core/errors/entityNotFound.error');

exports.get = function (key) {
    return client.lrangeAsync(key, 0, -1)
        .then(messages => {
            if (messages.length === 0) throw new EntityNotFoundError('Message not found');

            for (let i in messages) {
                messages[i] = JSON.parse(messages[i]);
            }

            return messages;
        })
        .catch(error => { throw error; });
};

exports.getSent = function (user) {
    return client.lrangeAsync('messages:sent:' + user._id, 0, -1)
        .then(messages => {
            for (let i in messages) {
                messages[i] = JSON.parse(messages[i]);
            }

            return messages;
        })
        .catch(error => {
            throw error;
        });
};

exports.getReceived = function (user) {
    return client.lrangeAsync('messages:received:' + user._id, 0, -1)
        .then(messages => {
            for (let i in messages) {
                messages[i] = JSON.parse(messages[i]);
            }

            return messages;
        })
        .catch(error => {
            throw error;
        });
};

exports.send = function (message, user, callbackUrl) {
    let key;
    let to;
    let from = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    };

    let timestamp = new Date();
    timestamp.setDate(timestamp.getDate());

    return Classified.findById(message.classifiedId)
        .then(classified => {
            if (!classified) throw new EntityNotFoundError('Classified not found');

            to = {
                _id: classified.advertiser._id,
                firstName: classified.advertiser.firstName,
                lastName: classified.advertiser.lastName,
                email: classified.advertiser.email
            };

            key = 'message:from:' + from._id + ':to:' + to._id + ':id:' + guid.raw();

            return client.lpushAsync('messages:sent:' + from._id, JSON.stringify({
                key: key,
                subject: message.subject,
                timestamp: timestamp,
                to: to
            }));
        })
        .then(res => {
            return client.lpushAsync('messages:received:' + to._id, JSON.stringify({
                key: key,
                subject: message.subject,
                timestamp: timestamp,
                from: from,
                read: false
            }));
        })
        .then(res => {
            return client.rpushAsync(key, JSON.stringify({
                subject: message.subject,
                body: message.body,
                timestamp: timestamp,
                from: from,
                to: to
            }));
        })
        .then(result => {
            message.url = message.url.replace('{key}', key);
            return enquiryEmail.send(to, message.url);
        })
        .catch(error => { throw error; });
};

exports.reply = function (message, user, callbackUrl) {
    let timestamp = new Date();
    timestamp.setDate(timestamp.getDate());

    return client.lrangeAsync(message.key, 0, -1)
        .then(messages => {
            let m;

            for (let i in messages) {
                m = JSON.parse(messages[i]);

                if (m.from._id !== user._id.toString()) {
                    break;
                }
            }

            return {
                to: m.from,
                from: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                },
                timestamp: timestamp,
                subject: m.subject,
                body: message.body,
                count: m.length
            };
        })
        .then(reply => {
            client.rpushAsync(message.key, JSON.stringify(reply));
            return reply;
        })
        .then(reply => {
            if (reply.count === 1) {
                client.lpushAsync('messages:received:' + reply.to._id, JSON.stringify({
                    key: message.key,
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

                            if (messages[i].key === message.key) {
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
                            key: message.key,
                            subject: reply.subject,
                            timestamp: timestamp,
                            from: reply.from,
                            read: false
                        }));
                    });
            }

            return reply;
        })
        .then(reply => {
            message.url = message.url.replace('{key}', message.key);
            enquiryEmail.send(reply.to, message.url);
            return reply;
        })
        .catch(error => {
            throw error;
        });
};

exports.markAsRead = function (key, user) {
    return client.lrangeAsync('messages:received:' + user._id, 0, -1)
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
                return client.lset('messages:received:' + user._id, result.index, JSON.stringify(result.message));
            }

            return null;
        })
        .then(result => {
            return result;
        })
        .catch(error => { throw error; });
};