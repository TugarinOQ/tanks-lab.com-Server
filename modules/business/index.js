const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.get('/list', token__module.isValid, (req, res) => {

    const email = req.decoded.email;

    req.db.collection('business').find({ user: email }).toArray((err, item) => {

        if (err) {

            return res.json({ error: err });
        }

        let factorys = [];
        item.map(item => factorys.push(item.factory));

        res.json(factorys);
    });
});

router.get('/info', token__module.isValid, (req, res) => {

    const email = req.decoded.email;

    req.db.collection('business').find({ user: email }).toArray((err, item) => {

        if (err) {

            return res.json({ error: err });
        }

        let income = 0;

        item.map(item => {

            income += (item.factory.income / 30); //(item.factory.income * 1.00) / ( 30 * (100 / item.factory.incomePercent) );
        });

        console.log(income);

        res.json({ income: parseFloat(income).toFixed(5) });
    });
});

module.exports = router;