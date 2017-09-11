const express = require('express'),
    router = express.Router(),
    token__module = require('../token'),
    config = require('../../config/config'),
    megaKassaAPI = require('../../libs/payments/megakassa');

router.post('/genURL', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const userEMAIL = req.decoded.email;

    const method = req.body.method;
    const ruble = parseFloat(req.body.ruble);
    const silver = parseInt(req.body.silver);

    if (method === undefined || method === '' || method === null)
        return res.json({ error: 'Argument method is not exists' });

    if (ruble === undefined || ruble === '' || ruble === null)
        return res.json({ error: 'Argument ruble is not exists' });

    if (silver === undefined || silver === '' || silver === null)
        return res.json({ error: 'Argument silver is not exists' });

    if ((silver <= 0) || (silver !== parseFloat(ruble * config.course.silver))) {

        return res.json({ error: 'Error in value of money' });
    }

    if (ruble < 2) {

        return res.json({ error: 'Min value = 2 RUB' });
    }

    if (ruble > 14000) {

        return res.json({ error: 'Max value = 14.000 RUB' });
    }

    const genOrderID = `${(Date.now().toString(36).substr(2, 4) + Math.random().toString(36).substr(2, 4)).toUpperCase()}`;

    const dbVar = {
        user: userID,
        mode: 'payments',
        order_id: genOrderID,
        amount: ruble,
        creation_time: Date.now(),
    };

    req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {

        req.db.collection('payments').insertOne(dbVar, (err) => {

            if (err) {

                req.logs.log({ code: 0, user: user, section: 'payments', operation: 'Create payments', dateTime: Date.now(), props: {
                    order_id: genOrderID,
                    amount: ruble
                } });

                return res.json({ error: err });
            }

            req.logs.log({ code: 1, user: user, section: 'payments', operation: 'Create payments', dateTime: Date.now(), props: {
                order_id: genOrderID,
                amount: ruble
            } });

            return res.json({
                url: megaKassaAPI.merchant({
                    order_id: genOrderID,
                    amount: ruble,
                    description: `Пополнение баланса (${userEMAIL}) | Tanks-Lab.com`,
                    debug: 1,
                    props: {
                        token: req.body.token || req.query.token || req.headers['x-access-token']
                    }
                })
            });

        });
    });
});

module.exports = router;