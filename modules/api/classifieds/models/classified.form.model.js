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

    this.state = model.state;

    this.price = model.price && model.price.value ? {
        value: model.price.value.toString(),
        ccy: model.price.ccy,
        ccyNbr: model.price.ccyNbr
    } : undefined;


    this.hidePrice = model.hidePrice || false;
    this.allowMessages = model.allowMessages || true;

    this.advertiser = {
        _id: user._id,
        firstName: model.advertiser.firstName,
        lastName: model.advertiser.lastName,
        email: model.advertiser.email,
        phoneNumber: model.advertiser.phoneNumber,
        dateRegistered: user.created
    };
     
    this.details = model.details;
}

module.exports = ClassifiedForm;