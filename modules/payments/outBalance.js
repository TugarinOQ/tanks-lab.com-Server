const express = require('express'),
    router = express.Router(),
    token__module = require('../token'),
    wallet = require('../../config/wallets'),
    megaKassaAPI = require('../../libs/payments/megakassa');


router.post('/withdrawCreate', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const userEmail = req.decoded.email;
    const server = req.decoded.server;

    const method = req.body.method;
    const ruble = parseFloat(req.body.gold);
    const wallet = req.body.wallet;

    if (method === undefined || method === '' || method === null)
        return res.json({ error: 'Argument method is not exists' });

    if (wallet === undefined || wallet === '' || wallet === null)
        return res.json({ error: 'Argument wallet is not exists' });

    if (ruble === undefined || ruble === '' || ruble === null)
        return res.json({ error: 'Argument ruble is not exists' });

    if (ruble < 2) {

        return res.json({ error: 'Min value = 2 RUB' });
    }

    if (ruble > 10000) {

        return res.json({ error: 'Max value = 10.000 RUB' });
    }

    const genOrderID = `${(Date.now().toString(36).substr(2, 4) + Math.random().toString(36).substr(2, 4)).toUpperCase()}`;

    const props = { amount: ruble, method: method, wallet: wallet, currency_from: 'RUB', debug: 1, order_id: genOrderID, comment: userEmail };

    req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {
        megaKassaAPI.withdraw(props, (data) => {

            req.db.collection('withdraw').insertOne( Object.assign(props, { user: user, status: data }) );

            const updServers = user.servers;
            updServers[server].gold -= ruble;

            req.db.collection('users').updateOne(
            {
                _id: req.ObjectId(userID)
            },
            {
                $set: {
                    servers: updServers
                }
            }, (err, user) => {

                if (data.status === 'manual') {

                    return res.json({ error: 'manual' });
                }

                return res.json( (data.status !== 'ok') ? { error: data.data } : { success: true } );
            });
        });
    });
});

module.exports = router;