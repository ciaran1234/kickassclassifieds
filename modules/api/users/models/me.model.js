'use strict';

function MeModel(model) {
    this._id = model._id;
    this.firstName = model.firstName;
    this.lastName = model.lastName;
    this.email = model.email;
    this.profileImageUrl = model.profileImageUrl;
    this.created = model.created;
    this.updated = model.updated;
    this.externalLogins = model.externalLogins || [];
}

module.exports = MeModel;