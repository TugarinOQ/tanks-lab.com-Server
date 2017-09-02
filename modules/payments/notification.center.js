const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    bcrypt = require('bcrypt-nodejs'),
    token__module = require('../token'),
    md5 = require('md5'),
    config = require('../../config/config');

router.post('/notification', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const order_id = req.body.order_id;
    const amount = req.body.amount;
    const signature = req.body.signature;

    const IP = req.headers['x-real-ip'];

    const shopSecret = 'b3afe9b9bfd89bbb';

    req.db.collection('payments').findOne(
        {
            user: userID,
            order_id: order_id
        },
        (err, response) => {

            if (err) {

                return res.json({ error: err });
            }

            const respSignature = md5([
                req.body.uid,
                response.amount,
                req.body.amount_shop,
                req.body.amount_client,
                req.body.currency,
                response.order_id,
                req.body.payment_method_id,
                req.body.payment_method_title,
                req.body.creation_time,
                req.body.payment_time,
                req.body.client_email,
                req.body.status,
                req.body.debug,
                shopSecret
            ].join(':'));

            if (IP !== '5.196.121.217' || (amount !== `${response.amount}`) || (signature !== respSignature)) {

                return res.json({ error: 'Invalid signature' });
            }

            const params = Object.assign(response, {
                amount_shop: req.body.amount_shop,
                amount_client: req.body.amount_client,
                payment_method_id: req.body.payment_method_id,
                payment_time: req.body.payment_time,
                client_email: req.body.client_email,
                status: req.body.status,
                debug: req.body.debug
            });

            req.db.collection('payments').updateOne(
                {
                    user: userID,
                    order_id: order_id
                },
                {
                    $set: params
                },
                (err, status) => {

                    if (err) {

                        return res.json({ error: err });
                    }

                    if (req.body.status === 'fail') {

                        return res.json({ error: 'payment is fail' });
                    }

                    req.db.collection('users').findOne({ _id: req.ObjectId(userID), }, (err, user) => {

                        updBalance({ req: req, res: res, user: user, amount: amount, cb: (referral) => {

                            if (referral) {

                                updBalance({ req: req, res: res, user: referral, referral: true, amount: amount, cb: () => {

                                    return res.send('ok');
                                } });
                            }

                            return res.send('ok');
                        } });
                    });
                }
            );
        }
    );

});

function updBalance({ req, res, user, referral = false, amount, cb }) {

    const server = req.decoded.server;

    const updServers = user.servers;
    updServers[server].silver += (referral) ? ((amount * config.course.silver) / (config.referral.firstLevel)) : (amount * config.course.silver);

    req.db.collection('users').updateOne(
        {
            _id: req.ObjectId(user)
        },
        {
            $set: {
                servers: updServers
            }
        },
        (err, user) => {

            if (err) {

                return res.json({error: err});
            }

            if (user) {

                return cb(undefined);
            }

            cb(user.referral !== 'me' ? user.referral : undefined);
        }
    );
}

module.exports = router;