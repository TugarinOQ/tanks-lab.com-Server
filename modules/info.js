const express = require('express'),
    router = express.Router(),
    async = require('async'),
    config = require('../config/config'),
    momentjs = require('moment');

router.get('/get', (req, res) => {

    req.db.collection('users').find().toArray((err, users) => {

        if (err) {

            return res.json({error: err});
        }

        const countUsers = users.length;
        let countPayments = 0.00;

        req.db.collection('payments').find({ mode: 'outGold' }).toArray((err, payments) => {

            if (err) {

                return res.json({error: err});
            }

            async.mapSeries(payments, (payment) => {

                countPayments += payment.amount.gold.toFixed(2);
            });

            const startDate = momentjs(new Date(config.common.startDateProject));

            const nowDate = momentjs(Date.now());

            const countDays = nowDate.diff(startDate, 'days');

            res.json({ users: countUsers, payments: countPayments, days: countDays });
        });
    });
});

module.exports = router;