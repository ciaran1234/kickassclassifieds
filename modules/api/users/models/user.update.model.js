'use strict';

//contains only the allowed properties for update. DO NOT place anything else here  
function UpdateUserModel(model) {
    this.firstName = model.firstName;
    this.lastName = model.lastName;
    this.phoneNumber = model.phoneNumber;

    if (model.settings) {
        this.settings = model.settings;
    }
}

module.exports = UpdateUserModel;