'use strict';

var acl = require('acl');

acl = new acl(new acl.memoryBackend());

// app.route('/api/users/me').get(users.me);
//     app.route('/api/users').put(users.update);
//     app.route('/api/users/picture').post(users.changeProfilePicture);


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
        return res.status(401).json({ message: 'Unauthorized' });
    }

    var roles = (req.user.roles) ? req.user.roles : ['guest'];

    acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }
        else {
            if (isAllowed) {
                return next();
            }
            else {
                return res.status(403).json({
                    message: 'Forbidden'
                });
            }
        }
    });
};