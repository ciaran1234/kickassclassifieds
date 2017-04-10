'use strict';

module.exports = function ObjectIdValidator(req, res, next) {
    req.checkParams({
        'id': {
            isValidObjectId: {
                errorMessage: req.i18n.__('http.codes.unprocessableEntity')
            }
        }
    });

    req.getValidationResult().then(result => {
        if (!result.isEmpty()) {
            return res.status(422).json({ errors: result.useFirstErrorOnly().mapped() });
        }
        else {
            next();
        }
    });
};