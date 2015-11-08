var express = require('express'),
    bodyParser = require('body-parser'),
    lessMiddleware = require('less-middleware'),
    autoprefixer = require('express-autoprefixer'),
    winston = require('winston'),
    util = require('./util'),
    api = require('./api/core'),
    apiRoutes = require('./api/routes'),
    app = express();

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
app.use((req, res, next) => {
    winston.info(req.path);
    next();
});

app.get('/api/uis/:ui/image', apiRoutes.getImage);
app.get('/api/uis', apiRoutes.getUIs);
app.get('/', (req, res) => {
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

app.listen(process.env.PORT || 3000);