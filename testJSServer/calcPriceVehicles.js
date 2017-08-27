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

    insertUssr();
});

//price  1 rub. = 100 silver
//sell 10 gold = 1 rub.
//practice - 1 sell tank = 1 practice
//research>boost = % a the sell price

let tanks_ussr = [
    {
        name: 'R11_MS-1',
        type: 'lt',
        level: 'I',
        nation: 'ussr',
        displayName: 'MC-1',
        availableShop: true,
        price: 1500, // 15 rub
        sell: 80,
        research: {
            guns: {
                I: {
                    practice: 0,
                    price: 0,
                    boost: 0
                },
                II: {
                    practice: 10,
                    price: 50,
                    boost: 1
                }
            }
        },
        crew: {
            commander: 0,
            driverMechanic: 0
        }
    }
];

function insertUssr() {

    tanks_ussr.map(tank => {

        // 1 rub -> 100 silver
        // 1 rub <- 10 gold

        const price = tank.price;
        const payBack = 5;

        

        // req.db.collection('vehicles_ussr').findOne({ 'name': tank.name }, (err, _tank) => {
        //
        //     if (!_tank) {
        //
        //         req.db.collection('vehicles_ussr').insertOne( tank, { w: 1 }, (err, res) => {
        //
        //             console.log(`-- ${tank.name} -- ADD`);
        //         });
        //     } else {
        //
        //         console.log(`-- ${tank.name} -- EXISTS`);
        //     }
        // });
    });

    console.log('-- OK --');
}