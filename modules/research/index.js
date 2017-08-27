const express = require('express'),
    router = express.Router(),
    async = require('async'),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    token__module = require('../token'),
    ussr_tree = require('../../config/trees/ussr.json');

router.get('/get', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;

    const tree = getTreeNation({ server: server });

    let count = 0;

    const tanks = Object.keys(tree.nodes);

    tanks.map((tank) => {

        req.db.collection('vehicles_' + server).findOne({ name: tank }, (err, vehicle) => {

            if (err) {

                return res.json({ error: err });
            }

            req.db.collection('research').findOne({ user: req.ObjectId(userID), server: server }, (err, research) => {

                if (err) {

                    return res.json({error: err});
                }

                req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

                    if (err) {

                        return res.json({error: err});
                    }

                    const _vehicle = (vehicle !== null) ? vehicle : {name: ""};

                    Object.assign(_vehicle, {
                        inHangar: hangar.vehicles[_vehicle.name] !== undefined,
                        researched: research.vehicles.indexOf(vehicle.name) > -1
                    });

                    let practice = 0;

                    async.mapSeries(tank.parents, (parent) => {

                        practice += tanks[parent].info.practice;
                    });

                    Object.assign( _vehicle, { practice: practice } );

                    Object.assign(tree.nodes[tank], { info: _vehicle });

                    count++;

                    if (count === tanks.length) {

                        return res.json(tree);
                    }
                });
            });
        });
    });
});

router.post('/open', token__module.isValid, (req, res) => {

    const userID = req.decoded._;
    const server = req.decoded.server;
    const email = req.decoded.email;

    const tank = req.body.tank;
    const tankParent = req.body.tankParent;

    if (!tankParent || tankParent === {}) {

        return res.json({ error: 'Not exists tankParent' });
    }

    req.db.collection('vehicles_' + server).findOne({ _id: req.ObjectId(tank) }, (err, vehicle) => {

        if (err) {

            return res.json({ error: err });
        }

        req.db.collection('research').findOne({ user: req.ObjectId(userID), server: server }, (err, research) => {

            if (err) {

                return res.json({ error: err });
            }

            if (research.vehicles.indexOf(vehicle.name) !== -1) {

                return res.json({ error: 'Tank is researched.' });
            }

            req.db.collection('hangars').findOne({ user: req.ObjectId(userID), server: server }, (err, hangar) => {

                if (err) {

                    return res.json({ error: err });
                }

                const infoTanks = getTanks({ nodes: hangar.vehicles, tank: tankParent });

                req.db.collection('users').findOne({ _id: req.ObjectId(userID), }, (err, user) => {

                    if (err) {

                        return res.json({ error: err });
                    }

                    const updServers = user.servers;

                    const PVMAP = vehicle.pricePractice - infoTanks.practice;
                    const APMPV = infoTanks.practice - vehicle.pricePractice;

                    if ( ((PVMAP) >= 0 && APMPV < 0) && ((updServers[server].practice - Math.abs(APMPV)) < 0) ) {

                        return res.json({ error: 'low practice' });
                    }

                    updServers[server].practice -= ((vehicle.pricePractice - infoTanks.practice) < 0) ? 0 : (vehicle.pricePractice - infoTanks.practice);

                    req.db.collection('users').updateOne(
                        { _id: req.ObjectId(userID) },
                        {
                            $set: {
                                servers: updServers
                            }
                        },
                        (err, updUser) => {

                            if (err) {

                                return res.json({ error: err });
                            }

                            const updVehicles = hangar.vehicles;
                            let ost = 0;

                            if ((vehicle.pricePractice - infoTanks.practice) < 0) {

                                ost = infoTanks.practice - vehicle.pricePractice;
                            }

                            async.mapSeries(infoTanks.allPractice, (tank) => {

                                updVehicles[tank.name].practice = parseInt(ost / infoTanks.allPractice.length);
                            });

                            req.db.collection('hangars').updateOne(
                                { user: req.ObjectId(userID), server: server },
                                {
                                    $set: {
                                        vehicles: updVehicles
                                    }
                                },
                                (err, updHangar) => {

                                    if (err) {

                                        return res.json({ error: err });
                                    }

                                    const updResearchVehicle = research.vehicles;

                                    updResearchVehicle.push(vehicle.name);

                                    req.db.collection('research').updateOne(
                                        { user: req.ObjectId(userID), server: server },
                                        {
                                            $set: {
                                                vehicles: updResearchVehicle
                                            }
                                        },
                                        (err, updResearch) => {

                                            if (err) {

                                                return res.json({ error: err });
                                            }

                                            return res.json({ success: true });
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        });
    });
});

function getTanks({ nodes, tank }) {

    let count = 0;
    let practices = 0;
    const allPractice = [];

    async.mapSeries(Object.keys(nodes), (node) => {

        if (nodes[node].name === tank.info.name) {

            count++;

            practices += nodes[node].practice;

            allPractice.push({ name: node, practice: nodes[node].practice });
        }
    });

    return { count: count, practice: practices, allPractice: allPractice };
}

function getTreeNation({ server }) {

    switch (server) {
        case "ussr": {
            return Object.assign( {}, ussr_tree );
        }
    }
}

module.exports = router;