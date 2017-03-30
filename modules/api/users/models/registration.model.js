'use strict';

function RegistrationModel(model) {
    this.firstName = model.firstName;
    this.lastName = model.lastName;
    this.email = model.email;
    this.password = model.password;
    this.confirmationUrl = model.confirmationUrl;
}

module.exports = RegistrationModel;