const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token'),
    config = require('../../config/config');

router.get('/slot', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server || 'ussr';

    req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

        if (err) {

            return res.json({ error: err });
        }

        const countSeats = hangar.countSeats || 5;

        req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {

            if (err) {

                return res.json({ error: err });
            }

            if (user.silver < config.price.slot) {

                return res.json({ error: 'low money' });
            }

            req.db.collection('users').updateOne(
                { _id: req.ObjectId(userID) },
                { $set: { silver: user.silver - config.price.slot } },
                (err, update) => {

                    if (err) {

                        return res.json({ error: err });
                    }

                    req.db.collection('hangars').updateOne(
                        { user: req.ObjectId(userID), server: server },
                        { $set: { countSeats: countSeats + 1 } },
                        (err, update) => {

                            if (err) {

                                return res.json({ error: err });
                            }

                            res.json({ countSeats: countSeats + 1 });
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;