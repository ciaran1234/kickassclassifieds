var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var integerValidator = require('mongoose-integer');

var CurrencySchema = new Schema({
    ccy: {
        type: String,
        required: 'validation.currency.ccy.required'
    },
    ccyMnrUnts: {
        type: Number,
        required: 'validation.currency.ccyMnrUnts.required',
        integer: 'validation.currency.ccyMnrUnts.integer'
    },
    ccyNbr: {
        type: Number,
        required: 'validation.currency.ccyNbr.required',
        integer: 'validation.currency.ccyNbr.integer'
    },
    ccyNm: {
        type: String,
        required: 'validation.currency.ccyNm.required'
    },
    ctryNm: {
        type: String,
        required: 'validation.currency.ctryNm.required'
    },
    symbol: {
        type: String,
    },
    symbolNative: {
        type: String
    }
});

CurrencySchema.plugin(integerValidator);
mongoose.model('Currency', CurrencySchema);