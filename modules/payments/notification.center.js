const express = require('express'),
    router = express.Router(),
    token__module = require('../token'),
    md5 = require('md5'),
    config = require('../../config/config'),
    megaKassaAPI = require('../../libs/payments/megakassa');

router.post('/notification', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const order_id = req.body.order_id;
    const amount = req.body.amount;
    const signature = req.body.signature;

    req.db.collection('payments').findOne(
        {
            user: userID,
            order_id: order_id
        },
        (err, response) => {

            if (err) {

                req.logs.log({ code: 0, user: userID, section: 'payments', operation: 'Payments notification', dateTime: Date.now(), props: {
                    order_id: order_id,
                    amount: amount,
                    server: server
                } });

                return res.json({ error: err });
            }

            const respSignature = megaKassaAPI.signature.merchantNotify({ req: req, res: response });

            if (megaKassaAPI.checkIP({ req: req }) || (amount !== `${response.amount}`) || (signature !== respSignature)) {

                req.logs.log({ code: 0, user: userID, section: 'payments', operation: 'Payments notification / Check signature', dateTime: Date.now(), props: {
                    order_id: order_id,
                    amount: amount,
                    server: server,
                    signature: Object.assign(req.body, { respSign: respSignature })
                } });

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

                        req.logs.log({ code: 0, user: userID, section: 'payments', operation: 'Payments notification / Update payments', dateTime: Date.now(), props: {
                            order_id: order_id,
                            amount: amount,
                            server: server,
                            signature: Object.assign(req.body, { respSign: respSignature })
                        } });

                        return res.json({ error: err });
                    }

                    if (req.body.status === 'fail') {

                        return res.json({ error: 'payment is fail' });
                    }

                    req.db.collection('users').findOne({ _id: req.ObjectId(userID), }, (err, user) => {

                        if (err || !user) {

                            req.logs.log({ code: 0, user: user || userID, section: 'payments', operation: 'Payments notification / Update payments', dateTime: Date.now(), props: {
                                server: server
                            } });

                            return res.json({ error: err });
                        }

                        updBalance({ req: req, res: res, user: user._id, amount: amount, cb: (referral) => {

                            if (referral) {

                                updBalance({ req: req, res: res, user: referral, referral: true, amount: amount, cb: () => {

                                    req.logs.log({ code: 1, user: user, section: 'payments', operation: 'Payments notification / Success', dateTime: Date.now(), props: {
                                        referral: referral,
                                        order_id: order_id,
                                        amount: amount,
                                        server: server,
                                        signature: Object.assign(req.body, { respSign: respSignature })
                                    } });

                                    return res.send('ok');
                                } });
                            }

                            req.logs.log({ code: 1, user: user, section: 'payments', operation: 'Payments notification / Success', dateTime: Date.now(), props: {
                                referral: referral,
                                order_id: order_id,
                                amount: amount,
                                server: server,
                                signature: Object.assign(req.body, { respSign: respSignature })
                            } });

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

    if (referral) {
        updServers[server].gold += amount / (config.referral.firstLevel);
    } else {
        updServers[server].silver += amount * config.course.silver;
        updServers[server].practice += parseInt(amount / 5);
    }

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

                req.logs.log({ code: 0, user: user, section: 'payments', operation: 'Payments notification / Update balance', dateTime: Date.now(), props: {
                    amount: amount,
                    referral: referral,
                    signature: Object.assign(req.body)
                } });

                return res.json({error: err});
            }

            if (!referral) {

                return cb(undefined);
            }

            return cb(user.referral !== 'me' ? user.referral : undefined);
        }
    );
}

module.exports = router;