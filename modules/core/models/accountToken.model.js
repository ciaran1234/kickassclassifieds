'use strict';

var mongoose = require('mongoose'),
    crypto = require('crypto'),
    Schema = mongoose.Schema;

var AccountTokenSchema = new Schema({
    salt: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    expires: {
        type: Date       
    },
    type: {
        type: [{
            type: String,
            enum: ['email', 'phoneNumber', 'password']
        }],
        default: 'email',
        required: 'Account confirmation token required'
    }
});

AccountTokenSchema.methods.hashUserId = function (userId) {
    if (this.salt && this.token) {
        return crypto.pbkdf2Sync(userId, new Buffer(this.salt, 'base64'), 10000, 64).toString('base64');

    } else {
        return 'invalid';
    }
};

AccountTokenSchema.methods.isValid = function (userId) {
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate()); 
    let validExpiration = this.expires !== null ? currentDate.getTime() < this.expires.getTime() : true;
    return validExpiration && this.token === this.hashUserId(userId);
};

mongoose.model('AccountTokenSchema', AccountTokenSchema);