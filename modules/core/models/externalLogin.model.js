'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ExternalLoginSchema = new Schema({
    _id: {
        loginProvider: {
            type: String,
            required: true
        },
        providerKey: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }  
});

mongoose.model('ExternalLogin', ExternalLoginSchema);