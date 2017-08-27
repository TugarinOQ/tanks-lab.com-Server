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

    const order_id = res.body.order_id;
    const amount = req.body.amount;
    const signature = req.body.signature;

    const IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    req.db.collection('payments').findOne(
        {
            user: userID,
            order_id: order_id
        },
        (err, response) => {

            if (err) {

                return res.json({ error: err });
            }

            if (IP !== '5.196.121.217' || (amount !== response.amount) || (signature !== response.signature)) {

                return res.json({ error: 'Invalid signature' });
            }

            const params = {
                amount_shop: response.amount_shop,
                amount_client: response.amount_client,
                payment_method_id: response.payment_method_id,
                payment_time: response.payment_time,
                client_email: response.client_email,
                status: response.status,
                debug: response.debug
            };

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

                    req.db.collection('users').findOne({ _id: req.ObjectId(userID), }, (err, user) => {

                        const updServers = user.servers;
                        updServers[server].silver += (amount * config.course.silver);

                        req.db.collection('users').updateOne(
                            {
                                _id: req.ObjectId(userID)
                            },
                            {
                                $set: {
                                    servers: updServers
                                }
                            },
                            (err, user) => {

                                if (err) {

                                    return res.json({ error: err });
                                }

                                return res.send('ok');
                            });
                    });
                }
            );
        }
    );

});

module.exports = router;