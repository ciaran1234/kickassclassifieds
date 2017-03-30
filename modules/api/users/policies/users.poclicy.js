'use strict';

var acl = require('acl');
acl = new acl(new acl.memoryBackend());

exports.invokeRolesPolicies = function () {
    acl.allow([{
        roles: 'user',
        allows: [{
            resources: '/api/users/me',
            permissions: 'get'
        }, {
            resources: '/api/users',
            permissions: 'put'
        }, {
            resources: '/api/users/picture',
            permissions: 'post'
        }]
    }]);
};

exports.isAllowed = function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ errors: { message: req.i18n.__("http.codes.unauthorized") } });
    }

    var roles = (req.user && req.user.roles) ? req.user.roles : ['guest'];

    acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
        if (err) {
            return res.status(500).json({ errors: { message: req.i18n.__("http.codes.internalServerError") } });
        }
        else {
            if (isAllowed) {
                return next();
            }
            else {
                return res.status(403).json({ errors: { message: req.i18n.__("http.codes.forbidden") } });
            }
        }
    });
};