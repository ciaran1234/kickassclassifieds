'use strict';

var config = require('../../../../config/config'),
    https = require('https'),
    InvalidExternalTokenError = require('../../../core/errors/invalidExternalToken.error');

var verifyFacebook = function (accessToken, cb) {
    let url = config.facebook.verificationUrl.replace('#{appToken}', config.facebook.appToken).replace('#{clientAccessToken}', accessToken);

    return https.request(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            try {
                var result = JSON.parse(body);               
                let verified = result.data.is_valid && result.data.app_id === config.facebook.clientID;

                if (!verified) {
                    throw new InvalidExternalTokenError('invalid external token');
                }
                else {
                    return cb(null, {
                        verified: verified,
                        providerKey: result.data.user_id,
                        loginProvider: 'facebook'
                    });
                }
            }
            catch (ex) {
                return cb(ex, false);
            }
        });

        res.on('error', function (err) {
            return cb(err, false);
        });
    }).end();
};

var verifyGoogle = function (accessToken, cb) {
    let url = config.google.verificationUrl.replace('#{clientAccessToken}', accessToken);
    return https.request(url, function (res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            try {
                var result = JSON.parse(body);
                let verified = result.expires_in > 0 && result.verified_email && result.issued_to === config.google.clientID;

                if (!verified) {
                    throw new InvalidExternalTokenError('invalid external token');
                }
                else {
                    return cb(null, {
                        verified: result.expires_in > 0 && result.verified_email && result.issued_to === config.google.clientID,
                        providerKey: result.user_id,
                        loginProvider: 'google'
                    });
                }
            }
            catch (ex) {
                return cb(ex, false);
            }
        });

        res.on('error', function (err) {
            return cb(err, false);
        });
    }).end();
};

module.exports = {
    verifyExternalLogin: function (provider, accessToken, cb) {
        switch (provider) {
            case 'facebook':
                return verifyFacebook(accessToken, cb);
            case 'google':
                return verifyGoogle(accessToken, cb);
            default:
                throw new Error('invalid provider specified');
        }
    }
};


