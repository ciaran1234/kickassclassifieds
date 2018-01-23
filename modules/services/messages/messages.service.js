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
var SendEmailToSelfError = require('../../core/errors/sendEmailToSelf.error');
var User = mongoose.model('User');
var Message = mongoose.model('Message');
var MessageSendingDisabledError = require('../../core/errors/messageSendingDisabled.error');

exports.get = function (id) {
    return Message.findById(id)
        .then(message => {
            if (!message) throw new EntityNotFoundError('Message not found');
            return message;
        })
        .catch(error => { throw error; });
};

exports.getSent = function (user) {
    return Message.aggregate()
        .match({ 'sender._id': user._id })
        .sort({ id: 1, 'messages.timestamp': -1 })
        .project({
            '_id': 1,
            'subject': 1,
            'sender': 1,
            'recipient': 1,
            'classifiedId': 1,
            'timestamp': { $arrayElemAt: ["$messages.timestamp", -1] }
        })
        .then(messages => messages)
        .catch(error => { throw error; });
};

exports.getReceived = function (user) {
    return Message.aggregate()
        .match({ 'recipient._id': user._id })
        .sort({ id: 1, 'messages.timestamp': -1 })
        .project({
            '_id': 1,
            'subject': 1,
            'sender': 1,
            'recipient': 1,
            'classifiedId': 1,
            'read': { $anyElementTrue: ["$messages.read"] },
            'timestamp': { $arrayElemAt: ["$messages.timestamp", -1] }
        })
        .then(messages => messages)
        .catch(error => { throw error; });
};

exports.send = function (message, user) {
    let id;
    let msg;

    return Classified.findById(message.classifiedId)
        .then(classified => {

            if (!classified) throw new EntityNotFoundError('Classified not found');

            if (classified.allowMessages === false) throw new MessageSendingDisabledError('Classified does not allow message sending');

            if (classified.advertiser._id.toString() === user._id.toString()) {
                throw new SendEmailToSelfError('Cannot send message to yourself');
            }

            let messages = [];
            messages.push({
                body: message.body,
                sender: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImageUrl: user.settings.publicProfilePicture ? user.profileImageUrl : ''
                },
                recipient: {
                    _id: classified.advertiser._id,
                    firstName: classified.advertiser.firstName,
                    lastName: classified.advertiser.lastName,
                    email: classified.advertiser.email,
                    profileImageUrl: classified.advertiser.profileImageUrl
                },
                read: false,
                timestamp: Date.now()
            });

            return {
                subject: message.subject,
                sender: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImageUrl: user.settings.publicProfilePicture ? user.profileImageUrl : ''
                },
                recipient: {
                    _id: classified.advertiser._id,
                    firstName: classified.advertiser.firstName,
                    lastName: classified.advertiser.lastName,
                    email: classified.advertiser.email,
                    profileImageUrl: classified.advertiser.profileImageUrl
                },
                classifiedId: classified._id,
                messages: messages
            };
        })
        .then(message => {
            msg = new Message(message).save();
            return msg;
        })
        .then(message => {
            id = message._id;
            return User.findById(message.recipient);
        })
        .then(advertiser => {
            if (!advertiser || !advertiser.settings) return false;

            message.url = message.url.replace('{key}', id);

            if (advertiser.settings.receiveEmailNotifications === true) {
                enquiryEmail.send(advertiser, message.url);
                return msg;
            }
            else {
                return msg;
            }
        })
        .catch(error => { throw error; });
};

exports.reply = function (message, user) {
    let recipient;

    return Message.findById(message._id)
        .then(msg => {
            if (!msg) throw new EntityNotFoundError('Message not found');

            recipient = msg.recipient._id !== user._id ? msg.recipient : msg.sender;

            msg.messages.push({
                body: message.body,
                sender: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    profileImageUrl: user.settings.publicProfilePicture ? user.profileImageUrl : ''
                },
                recipient: recipient,
                timestamp: Date.now(),
                read: false
            });

            return msg;
        })
        .then(msg => msg.save())
        .then(msg => {
            return User.findById(recipient._id)
                .then(user => {
                    return {
                        reply: msg,
                        recipient: user
                    };
                })
                .catch(error => { throw error; });
        })
        .then(result => {
            message.url = message.url.replace('{key}', message._id);

            if (result.recipient.settings.receiveEmailNotifications === true && result.recipient._id !== user._id) {
                enquiryEmail.send(result.recipient, message.url);
            }

            return result.reply;
        })
        .catch(error => { throw error; });
};

exports.markAsRead = function (id, user) {
    return Message.findOneAndUpdate({ _id: id, 'messages.recipient._id': user._id, 'messages.sender._id': user._id }, {
        $set: { 'messages.$.read': true }
    })
        .then(message => message)
        .catch(error => { throw error; });
};