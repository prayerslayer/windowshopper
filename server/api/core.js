var pg = require('pg'),
    sqlt = require('sqlt'),
    DB_URL = process.env.DB_URL,
    aws = require('aws-sdk'),
    s3 = new aws.S3(),
    db = sqlt.dir('../db'),
    URL_CACHE = {};

function getImageUrl(ui) {
    if (!URL_CACHE[ui] || URL_CACHE[ui].expires < Date.now()) {
        // CACHE MISS
        // HULK SMASH
        var url = s3.getSignedUrl('getObject',{
            Bucket: process.env.S3_BUCKET,
            Key: ui,
            Expires: 3600 // keep for an hour
        });
        URL_CACHE[ui] = {
            url: url,
            expires: Date.now() + 1000 * 60 * 60
        };
        return url;
    }
    return URL_CACHE[ui].url;
}

module.exports.getImage = (app) => {
    // TODO cache
    return new Promise((resolve, reject) => {
        var params = {
            Bucket: process.env.S3_BUCKET,
            Key: app
        };
        s3.getObject(params, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        });
    });
};

module.exports.getUIs = () => {
    return new Promise((resolve, reject) => {
        pg.connect(DB_URL, (err, client, done) => {
            if (err) {
                return reject(err);
            }
            db.readUIs(client, [], (err2, result) => {
                done();
                if (err2) {
                    return reject(err2);
                }
                var result = result
                                .rows
                                .map(row => {
                                    row.image_url = getImageUrl(row.id);
                                    return row;
                                });
                resolve(result);
            });
        });
    });
};