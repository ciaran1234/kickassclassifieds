'use strict';

function ClassifiedForm(model) {
    this.title = model.title;
    this.description = model.description;
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
        value: model.price.value,
        ccy: model.price.ccy,
        ccyNbr: model.price.ccyNbr
    } : undefined;
}

module.exports = ClassifiedForm;