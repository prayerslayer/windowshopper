var pg = require('pg'),
    sqlt = require('sqlt'),
    DB_URL = process.env.DB_URL,
    aws = require('aws-sdk'),
    s3 = new aws.S3(),
    db = sqlt.dir('../db');

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
                //TODO cache signed urls, so that the browser can too
                var result = result.rows
                                .map(result => {
                                    result.image_url = s3.getSignedUrl('getObject',{
                                        Bucket: process.env.S3_BUCKET,
                                        Key: result.id
                                    });
                                    return result;
                                });
                resolve(result);
            });
        });
    });
};