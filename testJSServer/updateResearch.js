const express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    body__parser = require('body-parser'),
    app = express(),
    token__module = require('../modules/token');

let req = { id: null, ObjectId: null };

MongoClient.connect('mongodb://test:test@oilman-shard-00-00-slnmp.mongodb.net:27017,oilman-shard-00-01-slnmp.mongodb.net:27017,oilman-shard-00-02-slnmp.mongodb.net:27017/tankslab?ssl=true&replicaSet=oilman-shard-0&authSource=admin', (err, db) => {

    if (err) {

        return res.json({ error: 'No connect to DB' });
    }

    req.db = db;
    req.ObjectId = ObjectID;

    updateUser();
});

function updateUser() {

    req.db.collection('research').updateOne(
        { server: 'ussr' },
        {
            $set: {
                vehicles: [
                    'R11_MS-1'
                ]
            }
        },
        (err, user) => {

            if (err) {

                return console.log('ERR', err);
            }

            console.log('-- OK --');
        });
}