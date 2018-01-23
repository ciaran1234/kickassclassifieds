var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    subject: {
        type: String,
        required: 'validation.message.title.required'
    },
    sender: {
        type: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: 'validation.message.sender.required'
            },
            firstName: {
                type: String,
                required: 'validation.message.recipient.sender.required'
            },
            lastName: {
                type: String,
                required: 'validation.message.recipient.sender.required'
            },
            email: {
                type: String,
                required: 'validation.message.sender.email.required'
            },
            profileImageUrl: {
                type: String,
                default: ''
            }
        }
    },
    recipient: {
        type: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: 'validation.message.recipient.required'
            },
            firstName: {
                type: String,
                required: 'validation.message.recipient.firstName.required'
            },
            lastName: {
                type: String,
                required: 'validation.message.recipient.lastName.required'
            },
            email: {
                type: String,
                required: 'validation.message.recipient.email.required'
            },
            profileImageUrl: {
                type: String,
                default: ''
            }
        }
    },
    classifiedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: 'validation.message.classifiedId.required'
    },
    messages: [{
        body: {
            type: String,
            required: 'validation.message.messages.body.required'
        },
        sender: {
            type: {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: 'validation.message.sender.required'
                },
                firstName: {
                    type: String,
                    required: 'validation.message.recipient.sender.required'
                },
                lastName: {
                    type: String,
                    required: 'validation.message.recipient.sender.required'
                },
                email: {
                    type: String,
                    required: 'validation.message.sender.email.required'
                },
                profileImageUrl: {
                    type: String,
                    default: ''
                }
            }
        },
        recipient: {
            type: {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: 'validation.message.recipient.required'
                },
                firstName: {
                    type: String,
                    required: 'validation.message.recipient.firstName.required'
                },
                lastName: {
                    type: String,
                    required: 'validation.message.recipient.lastName.required'
                },
                email: {
                    type: String,
                    required: 'validation.message.recipient.email.required'
                },
                profileImageUrl: {
                    type: String,
                    default: ''
                }
            }
        },
        read: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now
        }
    }]
});


mongoose.model('Message', MessageSchema);