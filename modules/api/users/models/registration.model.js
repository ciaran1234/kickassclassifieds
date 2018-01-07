'use strict';

function RegistrationModel(model) {
    this.firstName = model.firstName;
    this.lastName = model.lastName;
    this.email = model.email;
    this.phoneNumber = model.phoneNumber;
    this.password = model.password;
    this.confirmationUrl = model.confirmationUrl;
    this.settings = {
        publicProfilePicture: true,
        receiveNewsletter: false,
        receiveEmailNotifications: true
    };
}

module.exports = RegistrationModel;