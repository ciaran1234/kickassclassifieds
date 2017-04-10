'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var integerValidator = require('mongoose-integer');

var CountrySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    alpha2: {
        type: String,
        requierd: true
    },
    alpha3: {
        type: String,
        required: true
    },
    countryCode: {
        type: Number,
        integer: true,
        required: true
    },
    regions: {
        type: [{
            name: {
                type: String,
                required: true                
            },
            shortCode: {
                type: String,
                required: true
            },
            states: {
                type: [{
                   name: {
                       type: String,
                       required: true
                   }
                }]
            }
        }]
    }
});

CountrySchema.plugin(integerValidator);
mongoose.model('Country', CountrySchema);



