const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.get('/list', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server || 'ussr';

    req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, _tanks) => {

        if (err) {

            return res.json({ error: err });
        }

        let tanks = [];

        const countSeats = _tanks.countSeats || 5;

        _tanks.vehicles.map( tank => tanks.push(tank) );

        res.json({ countSeats: countSeats, tanks: tanks });
    });
});

module.exports = router;