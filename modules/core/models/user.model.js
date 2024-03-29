'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validator = require('validator'),
    uniqueValidator = require('mongoose-unique-validator'),
    crypto = require('crypto'),
    generatePassword = require('generate-password'),
    owasp = require('owasp-password-strength-test');

var validateLocalStrategyProperty = function (property) {
    return this.provider !== 'jwt' || property.length;
    // return ((this.provider !== 'jwt' && !this.updated) || property.length);
};

var validateLocalStrategyEmail = function (email) {
    return ((this.provider !== 'jwt' && !this.updated) || validator.isEmail(email));
};

var UserSchema = new Schema({
    firstName: {
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'validation.user.firstName.required']
    },
    lastName: {
        type: String,
        trim: true,
        default: '',
        validate: [validateLocalStrategyProperty, 'validation.user.lastName.required']
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: 'validation.email.required',
        validate: [validateLocalStrategyEmail, 'validation.user.email.invalid']
    },
    phoneNumber: {
        type: String
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        default: '',
        validate: [validateLocalStrategyProperty, 'validation.user.password.required']
    },
    salt: {
        type: String
    },
    profileImageUrl: {
        type: String,
        default: ''
    },
    provider: {
        type: String,
        required: 'validation.user.provider.required'
    },
    providerData: {},
    externalLogins: [{
        type: mongoose.Schema.Types.Mixed,
        ref: 'ExternalLogin'
    }],
    roles: {
        type: [{
            type: String,
            enum: ['user', 'admin']
        }],
        default: 'user',
        required: 'validation.user.roles.required'
    },
    updated: {
        type: Date
    },
    created: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    settings: {
        type: {
            publicProfilePicture: {
                type: Boolean,
                default: true
            },
            receiveNewsletter: {
                type: Boolean,
                default: false
            },
            receiveEmailNotifications: {
                type: Boolean,
                default: true
            }
        }
    },
    classifieds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classified' }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classified' }]
});

UserSchema.pre('save', function (next) {
    if (this.password && this.isModified('password')) {
        this.salt = crypto.randomBytes(16).toString('base64');
        this.password = this.hashPassword(this.password);
    }

    next();
});

UserSchema.pre('validate', function (next, err, a) {
    if (this.provider === 'jwt' && this.password && this.isModified('password')) {
        var result = owasp.test(this.password);
        if (result.errors.length) {
            var error = result.errors.join(' ');
            this.invalidate('password', error);
        }
    }

    next({ something: 'is fucky' });
});

UserSchema.methods.hashPassword = function (password) {
    if (this.salt && password) {
        return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'sha1').toString('base64');
    } else {
        return password;
    }
};

UserSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password) && this.emailConfirmed;
};

UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
    var _this = this;
    var possibleUsername = username.toLowerCase() + (suffix || '');

    _this.findOne({
        username: possibleUsername
    }, function (err, user) {
        if (!err) {
            if (!user) {
                callback(possibleUsername);
            } else {
                return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
        } else {
            callback(null);
        }
    });
};

/**
* Generates a random passphrase that passes the owasp test.
* Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
* NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
*/
UserSchema.statics.generateRandomPassphrase = function () {
    return new Promise(function (resolve, reject) {
        var password = '';
        var repeatingCharacters = new RegExp('(.)\\1{2,}', 'g');

        // iterate until the we have a valid passphrase. 
        // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present.
        while (password.length < 20 || repeatingCharacters.test(password)) {
            // build the random password
            password = generatePassword.generate({
                length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
                numbers: true,
                symbols: false,
                uppercase: true,
                excludeSimilarCharacters: true,
            });

            // check if we need to remove any repeating characters.
            password = password.replace(repeatingCharacters, '');
        }

        // Send the rejection back if the passphrase fails to pass the strength test
        if (owasp.test(password).errors.length) {
            reject(new Error('An unexpected problem occured while generating the random passphrase'));
        } else {
            // resolve with the validated passphrase
            resolve(password);
        }
    });
};

UserSchema.plugin(uniqueValidator, { message: 'validation.email.alreadyExists' });
mongoose.model('User', UserSchema);
