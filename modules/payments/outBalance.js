const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt-nodejs'),
    token__module = require('../token'),
    md5 = require('md5'),
    async = require('async'),
    config = require('../../config/config'),
    megaKassaAPI = require('../../libs/payments/megakassa');


router.get('/getListPaymentMethod', token__module.isValid, (req, res) => {

    const userID = req.decoded._;

    const sign = megaKassaAPI.genSignature.withdraw({ amount: 10.0, debug: 1, comment: 'asd' });

    res.json({ test: sign });
});

router.post('/outBalance', token__module.isValid, (req, res) => {

    const userID = req.decoded._;

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

    const merchant = 'https://megakassa.ru/merchant/';
    const shopSecret = 'b3afe9b9bfd89bbb';

    const genOrderID = `${(Date.now().toString(36).substr(2, 4) + Math.random().toString(36).substr(2, 4)).toUpperCase()}`;

    let params = {
        shop_id: 1916,
        order_id: genOrderID,
        amount: ruble,
        currency: 'RUB',
        description: `Пополнение баланса | Tanks-Lab.com`,
        debug: 1
    };

    const paramsSign = [
        params.shop_id,
        params.amount,
        params.currency,
        params.description,
        params.order_id,
        '',
        '',
        params.debug,
        shopSecret
    ];

    const signature = md5( `${shopSecret}${ md5(paramsSign.join(':')) }` );

    params = Object.assign(params, { signature: signature });

    const dbVar = {
        user: userID,
        order_id: genOrderID,
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

module.exports = router;