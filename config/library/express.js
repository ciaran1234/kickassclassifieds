'use strict';

var config = require('../config'),
    express = require('express'),
    expressValidator = require('express-validator'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    helmet = require('helmet'),
    flash = require('connect-flash'),
    compress = require('compression'),
    path = require('path'),
    chalk = require('chalk'),
    i18n = require('i18n-2'),
    owasp = require('owasp-password-strength-test');

/**
* Initialize local variables
*/
module.exports.initLocalVariables = function (app) {
    // Setting application local variables
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    if (config.secure && config.secure.ssl === true) {
        app.locals.secure = config.secure.ssl;
    }
    app.locals.keywords = config.app.keywords;
    app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
    app.locals.facebookAppId = config.facebook.clientID;
    app.locals.livereload = config.livereload;

    // Passing the request url to environment locals
    app.use(function (req, res, next) {
        res.locals.host = req.protocol + '://' + req.hostname;
        res.locals.url = req.protocol + '://' + req.headers.host + req.originalUrl;
        next();
    });
};

/**
 * Initialize application middleware
 */
module.exports.initMiddleware = function (app) {
    // Showing stack errors
    app.set('showStackError', true);

    // Enable jsonp
    app.enable('jsonp callback');

    // Should be placed before express.static
    app.use(compress({
        filter: function (req, res) {
            return (/json|text|javascript|css|font|svg/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    //setup local file dump for local development
    if (process.env.NODE_ENV === 'development') {
        app.use('/images', express.static('./tmp/images'));
    }

    // Environment dependent middleware
    if (process.env.NODE_ENV === 'development') {
        // Disable views cache
        app.set('view cache', false);
    } else if (process.env.NODE_ENV === 'production') {
        app.locals.cache = 'memory';
    }

    // Request body parsing middleware should be above methodOverride
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(expressValidator({
        errorFormatter: function (param, msg, value) {
            var namespace = param.split('.'), root = namespace.shift(), formParam = root;

            while (namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                param: formParam,
                message: msg,
                value: value
            };
        },
        customValidators: {
            isValidOwaspPassword: function (value) {
                if (!value) return false;

                var result = owasp.test(value); //he password may not contain sequences of three or more repeated characters.
                return result.errors && result.errors.length === 0;
            },
            isValidCallbackUrl: function (value) {
                var isValid = false;
                var whitelist = config.whitelistUrls || [];

                if (value) {
                    for (let i = 0; i < whitelist.length; i++) {
                        if (value.length >= whitelist[i].length && value.substring(0, whitelist[i].length) === whitelist[i]) {
                            isValid = true;
                            break;
                        }
                    }
                }

                return isValid;
            },
            isValidObjectId: function (value) {
                
                if(value && value.match(/^[0-9a-fA-F]{24}$/)) {
                    return true;
                }

                return false;              
            }
        }
    }));

    app.use(methodOverride());

    // Add the cookie parser and flash middleware
    app.use(cookieParser());
    app.use(flash());

    //internationalisation
    i18n.expressBind(app, {
        locales: ['en', 'en-GB', 'en-US', 'fr', 'ar'],
        cookieName: 'locale',
        extension: '.json',
        devMode: false
    });

    app.use(function (req, res, next) {
        req.i18n.setLocaleFromCookie();
        next();
    });
};

/**
 * Configure Cors
 */
module.exports.initCors = function (app) {
    if (config.cors && config.cors.enabled) {
        app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", config.cors.allowedOrigins);
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, ORIGIN");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
    }
};

/**
 * Invoke modules configuration
 */
module.exports.initModulesConfiguration = function (app, db) {
    config.files.configs.forEach(function (configPath) {
        require(path.resolve(configPath))(app, db);
    });
};

/**
 * Configure Helmet headers configuration
 */
module.exports.initHelmetHeaders = function (app) {
    // Use helmet to secure Express headers
    var SIX_MONTHS = 15778476000;
    app.use(helmet.frameguard());
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.ieNoOpen());
    app.use(helmet.hsts({
        maxAge: SIX_MONTHS,
        includeSubdomains: true,
        force: true
    }));
    app.disable('x-powered-by');
};

/**
 * Configure the modules ACL policies
 */
module.exports.initModulesServerPolicies = function (app) {
    // Globbing policy files
    config.files.policies.forEach(function (policyPath) {
        require(path.resolve(policyPath)).invokeRolesPolicies();
    });
};

/**
 * Configure the modules server routes
 */
module.exports.initModulesServerRoutes = function (app) {
    // Globbing routing files
    config.files.routes.forEach(function (routePath) {
        require(path.resolve(routePath))(app);
    });
};

/**
 * Configure error handling
 */
module.exports.initErrorRoutes = function (app) {
    app.use(function (err, req, res, next) {
        // If the error object doesn't exists
        if (!err) {
            return next();
        }

        // Log it
        console.error(chalk.red(err.stack));

        if (process.env.NODE_ENV === 'development') {
            res.status(500).json({ errors: { message: 'Internal Server Error', stack: err.stack } });
        }
        else {
            res.status(500).json({ errors: { message: 'Internal Server Error' } });
        }
    });
};

/**
 * Initialize the Express application
 */
module.exports.init = function (db) {
    // Initialize express app
    var app = express();

    // Initialize local variables
    this.initLocalVariables(app);

    // Initialize Express middleware
    this.initMiddleware(app);

    // Initialize Express session
    //this.initSession(app, db);

    // Initialize Modules configuration
    this.initModulesConfiguration(app);

    // Initialize Helmet security headers
    this.initHelmetHeaders(app);

    // Initialize CORS policies
    this.initCors(app);

    // Initialize modules server authorization policies
    this.initModulesServerPolicies(app);

    // Initialize modules server routes
    this.initModulesServerRoutes(app);

    // Initialize error routes
    this.initErrorRoutes(app);

    return app;
};