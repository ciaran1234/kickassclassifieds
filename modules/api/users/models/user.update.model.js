'use strict';

//contains only the allowed properties for update. DO NOT place anything else here  
function UpdateUserModel(model) { 
    this.firstName = model.firstName;
    this.lastName = model.lastName;
}

module.exports = UpdateUserModel;