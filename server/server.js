var express = require('express'),
    bodyParser = require('body-parser'),
    lessMiddleware = require('less-middleware'),
    autoprefixer = require('express-autoprefixer'),
    session = require('express-session'),
    superagent = require('superagent'),
    uuid = require('uuid'),
    winston = require('winston'),
    util = require('./util'),
    api = require('./api/core'),
    apiRoutes = require('./api/routes'),
    passport = require('passport'),
    Login = require('passport-oauth2').Strategy,
    app = express(),

    DISABLED_SECURITY = process.env.DISABLE_SECURITY === 'true';

app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(autoprefixer({
    browsers: 'last 2 versions',
    cascade: false
}));
app.use(lessMiddleware(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
    if (/^\/api/.test(req.path)) {
        apiRoutes.requireValidToken(req, res, next);
    } else {
        next();
    }
});
// logging middleware
app.use((req, res, next) => {
    winston.info(req.path);
    next();
});

// ==== PASSPORT
if (!DISABLED_SECURITY) {
    app.use(session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new Login({
        clientID: process.env.OAUTH_CLIENT_ID || 'foo',
        clientSecret: process.env.OAUTH_CLIENT_SECRET || 'bar',
        authorizationURL: process.env.OAUTH_AUTH_URL || 'http://localhost:3000/authorize',
        tokenURL: process.env.OAUTH_TOKEN_URL || 'http://localhost:3000/access_token',
        state: uuid.v4(),
        callbackURL: process.env.OAUTH_REDIRECT_URL || 'http://localhost:4000/auth/oauth2/callback'
    }, function(accessToken, refreshToken, profile, done) {
        superagent
        .get('http://localhost:3000/tokeninfo')
        .query({
            access_token: accessToken
        })
        .end((err, response) => {
            if (err) {
                return done(err);
            }
            done(null, response.body.uid);
        });
    }));

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    app.get('/auth/error', (req, res) => res.render('error'));
    app.get('/login', passport.authenticate('oauth2'));
    app.get('/auth/oauth2/callback',
        passport.authenticate('oauth2', {failureRedirect: '/auth/error'}),
        (req, res) => res.redirect('/uis'));
} else {
    winston.warn('You disabled security. Do not deploy this in production.');
}
// ==== END OF PASSPORT


function enforceLoggedIn(req, res, next) {
    if (!!req.user || DISABLED_SECURITY) {
        return next();
    }
    res.redirect('/login');
}
app.get('/api/uis/:ui/image', apiRoutes.getImage);
app.get('/api/uis', apiRoutes.getUIs);
app.get('/uis', enforceLoggedIn,
(req, res) => {
    api
    .getUIs()
    .then(uis => {
        uis = uis
                .sort((a,b) => a.id.toLowerCase() < b.id.toLowerCase() ?
                                -1 : b.id.toLowerCase() < a.id.toLowerCase() ?
                                  1 : 0);
        res.render('index', {
            uis
        });
    })
    .catch(util.errorHandler.bind(null, res));
});
app.get('/', (req, res) => {
    if (DISABLED_SECURITY) {
        return res.redirect('/uis');
    }
    res.render('login');
});

app.listen(process.env.PORT || 4000);