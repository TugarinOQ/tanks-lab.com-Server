const express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    body__parser = require('body-parser'),
    app = express(),
    token__module = require('../modules/token');

let req = { id: null, ObjectId: null };

MongoClient.connect('mongodb://tankslab:TBFydy86702@136.144.28.112:27017/tankslab', (err, db) => {

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