const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt-nodejs'),
    token__module = require('../token'),
    getURLYAMoney = require('../../libs/payments/yandexMoney'),
    getFreeKassa = require('../../libs/payments/freeKassa'),
    md5 = require('md5');

router.post('/genURL', token__module.isValid, (req, res) => {

    const method = req.body.method;
    const amount = req.body.amount;

    if (method === undefined || method === '' || method === null)
        return res.json({ error: 'Argument method is not exists' });

    if (amount === undefined || amount === '' || amount === null)
        return res.json({ error: 'Argument amount is not exists' });

    req.body.targets = req.body.targets || `Пополнение баланса игрока ${req.decoded.login} ## OILMAN.IO`;
    req.body.formcomment = req.body.formcomment || `OILMAN.IO`;
    req.body.shortDest = req.body.shortDest || `OILMAN.IO ## Пополнение счета`;

    req.body.label = md5(req.decoded.login + '::' + req.decoded.email + '::' + Date.now());

    //req.body.successURL = `https://oilman.io/payments/success`;
    req.body.successURL = `http://localhost:4200/cabinet/finance`;
    req.body.needEmail = req.decoded.email;

    switch (method) {
        case 'mastercard':
            getURLYAMoney('mastercard', req, res);
            break;

        case 'visa':
            getURLYAMoney('VISA', req, res);
            break;

        case 'yandexmoney':
            getURLYAMoney('yandexmoney', req, res);
            break;

        default:
            getFreeKassa(req, res);
            break;
            //return res.json({ error: 'Payment is not exists' });
    }
});

module.exports = router;