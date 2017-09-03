const express = require('express'),
    router = express.Router(),
    jwt = require('jsonwebtoken'),
    token__module = require('../token'),
    config = require('../../config/config');

router.post('/list', token__module.isValid, (req, res) => {

    const email = req.decoded.email;
    const server = req.decoded.server;
    const filters = req.body.filters;

    req.db.collection('vehicles_' + server).find({ availableShop: true }).toArray((err, tanks) => {

        if (err) {

            return res.json({ error: err });
        }

        const _filterTanks = tanks.filter((tank) => {

            const filterType = (typeof filters.types[0] === 'undefined') ? true : filters.types.indexOf(tank.type) !== -1;
            const filterLevel = (typeof filters.levels[0] === 'undefined') ? true : filters.levels.indexOf(tank.level) !== -1;

            return filterType && filterLevel;
        });

        req.db.collection('users').findOne({ email: email }, (err, user) => {

            if (err) {

                return res.json({ error: err });
            }

            req.db.collection('research').findOne({ user: req.ObjectId(user._id), server: server }, (err, research) => {

                if (err) {

                    return res.json({ error: err });
                }

                let tanks = [];

                _filterTanks.map((tank) => {

                    tank.visibleToSell = research.vehicles.indexOf(tank.name) > -1;
                    tank.availableSell = (tank.price <= (user.servers[server].silver || 0));

                    tank.sell = parseInt(((tank.price / 100)  * 0.70) / 5);

                    tanks.push(tank);
                });

                res.json(tanks);
            });
        });
    });
});

router.post('/buyTank', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const tankID = req.body.tankID;
    const additionSlot = req.body.slot;
    const fastResearch = req.body.fastResearch;

    req.db.collection('vehicles_' + server).findOne({ _id: req.ObjectId(tankID) }, (err, tank) => {

        if (err) {

            return res.json({ error: err });
        }

        req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

            if (err) {

                return res.json({ error: err });
            }

            req.db.collection('research').findOne({ user: req.ObjectId(userID), server: server }, (err, research) => {

                if (err) {

                    return res.json({ error: err });
                }

                if (research.vehicles.indexOf(tank.name) === -1) {

                    return res.json({ error: 'Tank is not a researched.' });
                }

                req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {

                    if (err) {

                        return res.json({error: err});
                    }

                    const silver = user.servers[server].silver;
                    const totalPrice = tank.price + ( (additionSlot) ? config.price.slot : 0 ) + ( (fastResearch) ? (tank.price * config.price.fastResearch) : 0 );

                    if (totalPrice > silver) {

                        return res.json({error: 'low money'});
                    }

                    if ((Object.keys(hangar.vehicles).length - hangar.countSeats) > 0) {

                        return res.json({error: 'Not exists a free slot'});
                    }

                    const updVehicles = hangar.vehicles;

                    Object.assign( tank, {
                        practice: 0,
                        buyDate: Date.now(),
                        researchedDate: getResearchTime( getLevel(tank.level) * config.time.research )
                    } );

                    updVehicles[ (updVehicles[tank.name]) ? tank.name + `_${Object.keys(hangar.vehicles).length}` : tank.name ] = tank;

                    const updServers = user.servers;
                    updServers[server].silver -= totalPrice;

                    req.db.collection('users').updateOne(
                        { _id: req.ObjectId(userID) },
                        {
                            $set: {
                                servers: updServers
                            }
                        },
                        (err, user) => {

                            if (err) {

                                req.logger.log({ code: 0, user: user._id, operation: 'Update user', dateTime: Date.now(), props: {
                                    research_id: research._id
                                } });

                                return res.json({error: err});
                            }

                            req.db.collection('hangars').updateOne(
                                { user: req.ObjectId(userID), server: server },
                                {
                                    $set: {
                                        countSeats: (additionSlot) ? hangar.countSeats + 1 : hangar.countSeats,
                                        vehicles: updVehicles
                                    }
                                },
                                (err, updHangar) => {

                                    if (err) {

                                        return res.json({error: err});
                                    }

                                    return res.json({success: true});
                                }
                            );
                        }
                    );
                });
            });
        });
    });
});

function getResearchTime(timeResearch) {

    const time = new Date();

    time.setTime(Date.now());

    const hours = Math.floor(timeResearch / 60);
    const minutes = timeResearch - hours * 60;

    time.setHours(time.getHours() + hours);
    time.setMinutes(time.getMinutes() + minutes);

    return time.getTime();
}

function getLevel(level) {

    switch (level) {
        case 'I': return 1;
        case 'II': return 2;
        case 'III': return 3;
        case 'IV': return 4;
        case 'V': return 5;
        case 'VI': return 6;
        case 'VII': return 7;
        case 'VIII': return 8;
        case 'IX': return 9;
        case 'X': return 10;
    }
}

module.exports = router;