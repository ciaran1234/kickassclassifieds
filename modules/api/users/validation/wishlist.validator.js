'use strict';

module.exports = function WishlistValidator(req, res, next) {
    req.checkParams('id', req.i18n.__('validation.message.classifiedId.objectId')).isValidObjectId();
    req.checkParams('id', req.i18n.__('validation.user.wishlistItemAlreadyExists')).isNonExistingWishlistItem(req.user);     

    req.getValidationResult().then(result => {
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.useFirstErrorOnly().mapped() });
        }
        else {
            next();
        }
    });
};