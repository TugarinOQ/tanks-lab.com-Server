const express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    body__parser = require('body-parser'),
    app = express(),
    token__module = require('../modules/token');

let req = { id: null, ObjectId: null };

MongoClient.connect('mongodb://tankslab:TBFydy86702@136.144.28.112:27017/tankslab', (err, db) => {

    if (err) {

        return res.json({ error: 'No connect to DB' });
    }

    req.db = db;
    req.ObjectId = ObjectID;

    insertUssr();
});

//price  1 rub. = 100 silver
//sell 10 gold = 1 rub.
//practice - 1 sell tank = 1 practice
//research>boost = % a the sell price

let tanks_ussr = [
    {
        name: 'R11_MS-1',
        type: 'lt',
        level: 'I',
        nation: 'ussr',
        displayName: 'MC-1',
        availableShop: true,
        pricePractice: 0,
        price: 1500, // 15 rub
        research: {
            guns: {
                I: {
                    displayName: '37 мм Гочкис',
                    default: true
                },
                II: {
                    displayName: '45 мм обр. 1932 г.',
                    price: 750,
                    boost: 3
                }
            },
            towers: 'I',
            engines: 'I',
            tracks: 'I',
            radios: 'I'
        },
        crew: {
            commander: 50,
            driverMechanic: 50
        },
        lines: {
            'R08_BT-2': false
        }
    },
    {
        name: 'R08_BT-2',
        type: 'lt',
        level: 'II',
        nation: 'ussr',
        displayName: 'БТ-2',
        availableShop: true,
        pricePractice: 270,
        price: 3500, // 35 rub
        research: {
            guns: {
                I: {
                    displayName: '37 мм Б-3',
                    default: true
                },
                I_B: {
                    displayName: '30 мм ТНШ',
                    price: 750,
                    boost: 0.4
                },
                II: {
                    displayName: '45 мм 20К',
                    price: 265,
                    boost: 0.5
                }
            },
            towers: {
                I: {
                    displayName: 'БТ-2',
                    default: true
                },
                II: {
                    displayName: 'БТ-5',
                    price: 52,
                    boost: 0.1
                }
            },
            engines: {
                IV: {
                    displayName: 'М-5-400',
                    default: true
                },
                IV_1: {
                    displayName: 'М-17Л 1400 об/мин',
                    price: 1130,
                    boost: 2.3
                }
            },
            tracks: {
                II: {
                    displayName: 'БТ-2',
                    default: true
                },
                II_1: {
                    displayName: 'БТ-5',
                    price: 54,
                    boost: 0.1
                }
            },
            radios: 'III'
        },
        crew: {
            commander: 50,
            driverMechanic: 50
        }
    },
    {
        name: 'R03_BT-7',
        type: 'lt',
        level: 'III',
        nation: 'ussr',
        displayName: 'БТ-7',
        availableShop: true,
        pricePractice: 1500,
        price: 37000, // 370 rub
        research: {
            guns: {
                II: {
                    displayName: '45 ММ 20К',
                    default: true
                },
                II_B: {
                    displayName: '23 ММ ВЯ',
                    price: 750,
                    boost: 0.4
                },
                III: {
                    displayName: '37 ММ ЗИС-19',
                    price: 265,
                    boost: 0.5
                }
            },
            towers: {
                II: {
                    displayName: 'БТ-7 ОБР. 1935 Г.',
                    default: true
                },
                III: {
                    displayName: 'БТ-7 ОБР. 1937 Г.',
                    price: 52,
                    boost: 0.1
                }
            },
            engines: {
                IV: {
                    displayName: 'М-17Л 1400 ОБ/МИН',
                    default: true
                },
                IV_1: {
                    displayName: 'М-17Т',
                    price: 1130,
                    boost: 2.3
                },
                V: {
                    displayName: 'В-2',
                    price: 1130,
                    boost: 2.3
                }
            },
            tracks: {
                II: {
                    displayName: 'БТ-5',
                    default: true
                },
                III: {
                    displayName: 'БТ-7',
                    price: 54,
                    boost: 0.1
                }
            },
            radios: {
                III: {
                    displayName: '71-ТК-3',
                    default: true
                },
                IX: {
                    displayName: '12LL',
                    price: 54,
                    boost: 0.1
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            gunner: 50
        }
    }
];

function insertUssr() {

    tanks_ussr.map(tank => {

        req.db.collection('vehicles_ussr').findOne({ 'name': tank.name }, (err, _tank) => {

            if (!_tank) {

                req.db.collection('vehicles_ussr').insertOne( tank, { w: 1 }, (err, res) => {

                    console.log(`-- ${tank.name} -- ADD`);
                });
            } else {

                console.log(`-- ${tank.name} -- EXISTS`);
            }
        });
    });

    console.log('-- OK --');
}