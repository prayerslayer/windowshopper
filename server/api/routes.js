var TOKENINFO_URL = process.env.OAUTH_TOKENINFO_URL,
    winston = require('winston'),
    api = require('./core'),
    util = require('../util'),
    superagent = require('superagent');


module.exports.tokenMiddleware = (req, res, next) => {
    var header = req.header('Authorization');
    if (!/Bearer [0-9a-f-]+$/.test(header)) {
        return res.status(401).send();
    }

    superagent
    .get(TOKENINFO_URL)
    .query({
        access_token: header.split(' ')[1]
    })
    .end((err, result) => {
        if (err) {
            return res.status(403).send(err.message);
        }
        next();
    });
};

module.exports.getUIs = (req, res) => {
    api
    .getUIs()
    .then(uis => res.status(200).send(uis))
    .catch(util.errorHandler.bind(null, res));
};

module.exports.getImage = (req, res) => {
    api
    .getImage(req.params.ui)
    .then(image => res.status(200).send(image))
    .catch(util.errorHandler.bind(null, res));
};
