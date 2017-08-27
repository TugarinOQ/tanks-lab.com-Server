const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.get('/list', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server || 'ussr';

    req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

        if (err) {

            return res.json({ error: err });
        }

        const countSeats = hangar.countSeats || 5;

        res.json({ countSeats: countSeats, tanks: hangar.vehicles });
    });
});

router.post('/info', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server || 'ussr';
    const tankID = req.body.tankID;

    req.db.collection('vehicles_' + server).findOne({ _id: req.ObjectId(tankID) }, (err, tank) => {

        if (err) {

            return res.json({ error: err });
        }

        res.json(tank);
    });
});

module.exports = router;