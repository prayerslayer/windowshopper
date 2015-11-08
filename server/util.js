var winston = require('winston');

module.exports.errorHandler = function errorHandler(res, error) {
    winston.error(error);
    return res.status(500).send(error.message);
};