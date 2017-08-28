const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt-nodejs'),
    token__module = require('../token'),
    md5 = require('md5'),
    config = require('../../config/config');

router.post('/genURL', token__module.isValid, (req, res) => {

    const userID = req.decoded._;

    const method = req.body.method;
    const ruble = parseInt(req.body.ruble);
    const silver = parseInt(req.body.silver);

    if (method === undefined || method === '' || method === null)
        return res.json({ error: 'Argument method is not exists' });

    if (ruble === undefined || ruble === '' || ruble === null)
        return res.json({ error: 'Argument ruble is not exists' });

    if (silver === undefined || silver === '' || silver === null)
        return res.json({ error: 'Argument silver is not exists' });

    if ((ruble <= 0 || silver <= 0) || (silver !== (ruble * config.course.silver))) {

        return res.json({ error: 'Error in value of money' });
    }

    const merchant = 'https://megakassa.ru/merchant/';
    const shopSecret = 'b3afe9b9bfd89bbb';

    let params = {
        shop_id: 1916,
        amount: ruble,
        currency: 'RUB',
        description: 'Пополнение баланса | Tanks-Lab.com',
        debug: 1
    };

    req.db.collection('payments').count({}, (err, count) => {

        const paramsSign = [
            params.shop_id,
            params.amount,
            params.currency,
            params.description,
            count,
            '',
            '',
            params.debug,
            shopSecret
        ];

        const signature = md5( `${shopSecret}${ md5(paramsSign.join(':')) }` );

        params = Object.assign(params, { signature: signature });

        const dbVar = {
            user: userID,
            order_id: count,
            amount: params.amount,
            creation_time: Date.now(),
            signature: signature
        };

        req.db.collection('payments').insertOne(dbVar, (err, status) => {

            if (err) {

                return res.json({ error: err });
            }

            return res.json({ url: merchant, params: params });
        });
    });
});

module.exports = router;