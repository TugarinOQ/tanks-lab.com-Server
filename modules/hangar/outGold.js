const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    momentjs = require('moment'),
    config = require('../../config/config'),
    token__module = require('../token');

router.post('/getGold', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const tankID = req.body.tankID;

    req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

        if (err) {

            return res.json({ error: err });
        }

        const vehicles = hangar.vehicles;

        calcTank({ tank: vehicles[tankID], cb: (status) => {

            if (status === 'fail') {

                return res.json({ error: 'fail' });
            }

            return res.json({ outGold: status });
        } });
    });
});

router.post('/outGold', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const tankID = req.body.tankID;

    req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

        if (err) {

            return res.json({ error: err });
        }

        const vehicles = hangar.vehicles;

        calcTank({ tank: vehicles[tankID], cb: (status) => {

            if (status === 'fail') {

                return res.json({error: 'fail'});
            }

            const outGold = status;

            if (outGold === 0) {

                return res.json({ error: 'gold = 0' });
            }

            const updVehicles = vehicles;
            vehicles[tankID].researchedDate = Date.now();
            vehicles[tankID].practice = (outGold * 100);

            req.db.collection('hangars').updateOne(
                {user: req.ObjectId(userID), server: server},
                {
                    $set: {
                        vehicles: updVehicles
                    }
                },
                (err, updHangar) => {

                    if (err) {

                        return res.json({error: err});
                    }

                    req.db.collection('users').findOne({
                        _id: req.ObjectId(userID)
                    },
                    (err, user) => {

                        const amount = { gold: outGold / 2, silver: (outGold / 2) * 100 };

                        const updServers = user.servers;
                        updServers[server].gold += amount.gold;
                        updServers[server].silver += amount.silver;

                        req.db.collection('users').updateOne(
                            {_id: req.ObjectId(userID)},
                            {
                                $set: {
                                    servers: updServers
                                }
                            },
                            (err, updUser) => {

                                if (err) {

                                    return res.json({error: err});
                                }

                                return res.json({success: true});
                            }
                        );
                    });
                }
            );
        } });
    });
});

function calcTank({ tank, cb }) {

    const startCalcDate = momentjs(tank.researchedDate);
    const nowDate = momentjs(Date.now());

    const goldInMonth = (tank.price / 100) * (config.income.default / config.income.countMonth);
    const goldInDay = goldInMonth / nowDate.daysInMonth();

    const countDayWithMomentBuyTank = nowDate.diff(startCalcDate, 'days');

    cb( goldInDay * countDayWithMomentBuyTank );
}

module.exports = router;