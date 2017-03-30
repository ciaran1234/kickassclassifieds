'use strict';

module.exports = function ConfirmAccountValidator(req, res, next) {
    req.checkBody({
        'token': {
            notEmpty: {
                errorMessage: req.i18n.__("validation.confirmAccount.token.required"),
            }          
        }      
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