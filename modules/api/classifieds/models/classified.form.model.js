'use strict';

function ClassifiedForm(model, user) {

    this.title = model.title;
    this.description = model.description;   
    this.advertType = model.advertType;

    this.category = {
        _id: model.category._id,
        name: model.category.name
    };

    this.country = {
        code: model.country.code || model.country.countryCode,
        name: model.country.name
    };

    this.region = {
        name: model.region.name
    };

    this.states = model.states;

    this.price = model.price && model.price.value ? {
        value: model.price.value.toString(),
        ccy: model.price.ccy,
        ccyNbr: model.price.ccyNbr
    } : undefined;

    this.advertiser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateRegistered: user.created
    };
     
    this.details = model.details;
}

module.exports = ClassifiedForm;