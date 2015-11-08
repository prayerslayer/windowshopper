var shell = require('shelljs'),
    pg = require('pg'),
    superagent = require('superagent'),
    winston = require('winston'),
    aws = require('aws-sdk'),
    sqlt = require('sqlt'),
    fs = require('fs'),
    db = sqlt.dir('db'),
    KIO_URL = process.env.KIO_URL,
    DB_URL = process.env.DB_URL,
    S3_BUCKET = process.env.S3_BUCKET,
    s3 = new aws.S3();

pg.on('error', err => winston.error.err);
process.on('error', err => winston.error(err));

function obtainToken() {
    if (process.env.NODE_ENV !== 'PRODUCTION') {
        // for testing
        return Promise.resolve(shell.exec('zign token uid').output);
    }
}

function getApps(token) {
    return new Promise((resolve, reject) => {
        superagent
            .get(KIO_URL)
            .set('Authorization', 'Bearer ' + token)
            .end((err, result) => {
                if (err) {
                    return reject(err);
                }
                winston.info('Got', result.body.length, 'apps');
                resolve(result.body);
            });
    });
}

function intoDB(app, url) {
    return new Promise((resolve, reject) => {
        pg.connect(DB_URL, (err, client, done) => {
            if (err) {
                winston.error('Could not get DB connection from pool.', err);
                return reject(err);
            }
            db.saveUI(client, [app, url], (err2, result) => {
                done(client);
                if (err2) {
                    winston.error(err2);
                    return reject(err2);
                }
                winston.info('Added', app, 'to DB');
                resolve(result);
            });
        });
    });
}

function intoStorage(app) {
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: S3_BUCKET,
            Key: app,
            Body: fs.readFileSync(`images/${app}/${app}.png`)
        };
        s3.putObject(params, (err, data) => {
            if (err) {
                winston.error('Could not upload ' + app, err);
                return reject(err);
            }
            winston.info('Uploaded', app);
            resolve(data);
        });
    });
}

function persistImages(app, url) {
    intoStorage(app)
    .then(() => intoDB(app, url));
}

function saveScreenshot(app) {
    var id = app[0],
        url = app[1];

    superagent
    .get(url)
    .end((err, res) => {
        if (err) {
            winston.info('Could not read', url);
            return;
        }
        // we lose ASCII art UIs here, but well...
        if (/text\/html/.test(res.headers['content-type'])) {
            shell.exec('./node_modules/phantomjs2/bin/phantomjs save.js ' + id + ' ' + url);
            winston.info('Downloaded', id);
            persistImages(id, url);
        } else {
            winston.info('No HTML header for', url);
        }
    });
}

function job() {
    obtainToken()
    .then(token =>
        getApps(token)
        .then(apps =>
            apps
            .filter(app => app.active)
            .map(app => [app.id, app.service_url])
            .filter(app => !!app[1])
            .forEach(saveScreenshot)
        )
        .catch(err => winston.error(err)));
}

// RUN NAO
job();

// run once every half hour
setInterval(job, 1000 * 60 * 30);
