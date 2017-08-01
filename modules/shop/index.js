const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.post('/list', token__module.isValid, (req, res) => {

    const email = req.decoded.email;
    const server = req.decoded.server;
    const filters = req.body.filters;

    req.db.collection('vehicles_' + server).find({ availableShop: true }).toArray((err, tanks) => {

        if (err) {

            return res.json({ error: err });
        }

        const _filterTanks = tanks.filter((tank) => {

            const filterType = (typeof filters.types[0] === 'undefined') ? true : filters.types.indexOf(tank.type) !== -1;
            const filterLevel = (typeof filters.levels[0] === 'undefined') ? true : filters.levels.indexOf(tank.level) !== -1;

            return filterType && filterLevel;
        });

        req.db.collection('users').findOne({ email: email }, (err, user) => {

            let tanks = [];

            _filterTanks.map((tank) => {

                tank.visibleToSell = tank.price > user.silver;

                tanks.push(tank);
            });

            res.json(tanks);
        });
    });
});

module.exports = router;