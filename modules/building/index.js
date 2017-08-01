const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.get('/list', token__module.isValid, (req, res) => {

    req.db.collection('building').find().toArray((err, item) => {

        res.json({ data: item });
    });
});

router.post('/info', token__module.isValid, (req, res) => {

    const itemID = req.body.id;

    if (!/^[a-z0-9]/.test(itemID))
        return res.json({ error: 'error itemID' });

    req.db.collection('building').findOne({ '_id': req.ObjectId(itemID) }, (err, item) => {

        res.json({ title: item.title, price: item.price, income: item.income, incomePercent: item.incomePercent });
    });
});

router.post('/pay', token__module.isValid, (req, res) => {

    const itemID = req.body.id;

    if (!/^[a-z0-9]/.test(itemID))
        return res.json({ error: 'error itemID' });

    req.db.collection('building').findOne({ '_id': req.ObjectId(itemID) }, (err, factory) => {

        const price = factory.price;
        const email = req.decoded.email;

        req.db.collection('users').findOne({
            email: email
        }, (err, user) => {

            if (err) {

                return res.json({ error: err });
            }

            const balance = user.balance || 0;

            if (balance < price) {

                return res.json({ error: 'There is no money on the balance sheet' });
            }

            const newbalance = balance - price;

            req.db.collection('users').updateOne({
                '_id': req.ObjectId(user._id),
            }, {$set: { balance: newbalance }}, (err, user) => {

                if (err) {

                    return res.json({ error: err });
                }

                const _factory = Object.assign({ level: 1 }, factory);

                req.db.collection('business').insertOne({
                    user: email,
                    factory: _factory,
                    payDate: Date.now()
                }, (err, item) => {

                    if (err) {

                        console.log(err);
                        return res.json({error: err.message});
                    }

                    res.json({ success: true, balance: newbalance });
                });
            });
        });
    });
});

module.exports = router;