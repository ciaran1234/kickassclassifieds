'use strict';

module.exports = function RemovExternalLoginValidator(req, res, next) {
    req.checkBody({
        'loginProvider': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.externalLogin.loginProvider"),
            }
        },      
        'providerKey': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.externalLogin.providerKey"),
            }
        },
    });

    req.getValidationResult().then(result => {
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.useFirstErrorOnly().mapped() });
        }
        else {
            next();
        }
    });
};