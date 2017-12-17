'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var integerValidator = require('mongoose-integer');
var _ = require('lodash');

var validatePrice = function hasPrice(property) {
    if (this.price.value === undefined &&
        this.price.ccy === undefined &&
        this.price.ccyNbr === undefined) {
        return false;
    }

    let invalid = property !== undefined && property.length;
    return !invalid;
};

var ClassifiedSchema = new Schema({
    title: {
        type: String,
        required: 'validation.classified.title.required'

    },
    description: {
        type: String,
        required: 'validation.classified.description.required'
    },
    category: {
        type: { //mixed document so need to add validation manually....
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
                required: 'validation.classified.category.id.required'
            },
            name: {
                type: String,
                required: 'validation.classified.category.name.required'
            }
        }
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    country: {
        type: {
            code: {
                type: Number,
                integer: 'validation.classified.country.integer',
                required: 'validation.classified.country.required'
            },
            name: {
                type: String
            }
        }
    },
    region: {
        type: {
            name: {
                type: String,
                required: 'validation.classified.region.required'
            }
        }
    },
    state: {
        type: String
    },
    images: [{
        name: String,
        path: String,
        size: Number,
        mimetype: String
    }],
    price: {
        value: {
            type: mongoose.Schema.Types.Decimal128,
            required: [validatePrice, 'validation.classified.price.value.required']
        },
        ccy: {
            type: String,
            required: [validatePrice, 'validation.classified.price.ccy.required'],
        },
        ccyNbr: {
            type: Number,
            integer: 'validation.classified.price.ccyNbr.integer',
            required: [validatePrice, 'validation.classified.price.ccyNbr.required']
        }
    },
    hidePrice: {
        type: Boolean        
    },
    allowMessages: {
        type: Boolean
    },
    advertType: {
        type: String,
        enum: ['sell', 'buy'], //this may need some rethinking....
        default: 'sell',
        required: 'validation.classified.advertType.required'
    },
    advertiser: {
        type: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            firstName: {
                type: String,
                required: true
            },
            lastName: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            phoneNumber: {
                type: String,
                required: true
            },
            dateRegistred: {
                type: Date,
                required: true
            }
        }
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date
    },
});

ClassifiedSchema.plugin(integerValidator);
mongoose.model('Classified', ClassifiedSchema);