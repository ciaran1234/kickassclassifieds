'use strict';

module.exports = function ExternalSigninValidator(req, res, next) {
    req.checkQuery({      
        'redirectUrl': {
            notEmpty: {
                errorMessage: req.i18n.__("security.callbackUrl.oauthSigninRequired"),
            },
            isValidCallbackUrl: {
                errorMessage: req.i18n.__("security.callbackUrl.oauthSignin"),
            }
        }
    });

    req.getValidationResult().then(result => {
        if (!result.isEmpty()) {
            return res.status(400).send({ errors: result.useFirstErrorOnly().mapped() });
        }
        else {
            next();
        }
    });
};