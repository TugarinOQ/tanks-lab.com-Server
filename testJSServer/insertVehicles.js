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
                    level: 'I',
                    default: true
                },
                II: {
                    displayName: '45 мм обр. 1932 г.',
                    level: 'II'
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
                    level: 'I',
                    default: true
                },
                I_B: {
                    displayName: '30 мм ТНШ',
                    level: 'I',
                    drumGunner: true
                },
                II: {
                    displayName: '45 мм 20К',
                    level: 'II'
                }
            },
            towers: {
                I: {
                    displayName: 'БТ-2',
                    level: 'I',
                    default: true
                },
                II: {
                    displayName: 'БТ-5',
                    level: 'II'
                }
            },
            engines: {
                IV: {
                    displayName: 'М-5-400',
                    level: 'IV',
                    default: true
                },
                IV_1: {
                    displayName: 'М-17Л 1400 об/мин',
                    level: 'IV'
                }
            },
            tracks: {
                II: {
                    displayName: 'БТ-2',
                    level: 'II',
                    default: true
                },
                II_1: {
                    displayName: 'БТ-5',
                    level: 'II'
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
                    level: 'II',
                    default: true
                },
                II_B: {
                    displayName: '23 ММ ВЯ',
                    level: 'II',
                    drumGunner: true
                },
                III: {
                    displayName: '37 ММ ЗИС-19',
                    level: 'III'
                }
            },
            towers: {
                II: {
                    displayName: 'БТ-7 ОБР. 1935 Г.',
                    level: 'II',
                    default: true
                },
                III: {
                    displayName: 'БТ-7 ОБР. 1937 Г.',
                    level: 'III'
                }
            },
            engines: {
                IV: {
                    displayName: 'М-17Л 1400 ОБ/МИН',
                    level: 'IV',
                    default: true
                },
                IV_1: {
                    displayName: 'М-17Т',
                    level: 'IV'
                },
                V: {
                    displayName: 'В-2',
                    level: 'V',
                }
            },
            tracks: {
                II: {
                    displayName: 'БТ-5',
                    level: 'II',
                    default: true
                },
                III: {
                    displayName: 'БТ-7',
                    level: 'III',
                }
            },
            radios: {
                III: {
                    displayName: '71-ТК-3',
                    level: 'I',
                    default: true
                },
                IX: {
                    displayName: '12LL',
                    level: 'IX'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            gunner: 50
        }
    },
    {
        name: 'R12_A-20',
        type: 'lt',
        level: 'IV',
        nation: 'ussr',
        displayName: 'A-20',
        availableShop: true,
        pricePractice: 3200,
        price: 134000, // 1340 rub
        research: {
            guns: {
                II: {
                    displayName: '45 ММ 20К',
                    level: 'II',
                    default: true
                },
                III: {
                    displayName: '37 ММ ЗИС-19',
                    level: 'III'
                },
                IV: {
                    displayName: '45 ММ ВТ-42',
                    level: 'IV'
                },
                V_B: {
                    displayName: '37 ММ АВТОМАТ. Ш-37',
                    level: 'V',
                    drumGunner: true
                }
            },
            towers: {
                II: {
                    displayName: 'А-20 ОБР. 1938 Г.',
                    level: 'II',
                    default: true
                },
                III: {
                    displayName: 'СП-3',
                    level: 'III'
                }
            },
            engines: {
                V: {
                    displayName: 'В-2',
                    level: 'V',
                    default: true
                },
                VI: {
                    displayName: 'В-2-34',
                    level: 'VI'
                }
            },
            tracks: {
                III: {
                    displayName: 'А-20 ОБР. 1938 Г.',
                    level: 'III',
                    default: true
                },
                IV: {
                    displayName: 'А-20 ОБР. 1940 Г.',
                    level: 'IV'
                }
            },
            radios: {
                IV: {
                    displayName: '9Р',
                    level: 'IV',
                    default: true
                },
                IX: {
                    displayName: '12LL',
                    level: 'IX'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            gunner: 50,
            radioOperator: 50
        }
    },
    {
        name: 'R04_T-34',
        type: 'mt',
        level: 'V',
        nation: 'ussr',
        displayName: 'T-34',
        availableShop: true,
        pricePractice: 11500,
        price: 356700, // 3567 rub
        research: {
            guns: {
                IV: {
                    displayName: '76 ММ Л-11',
                    level: 'IV',
                    default: true
                },
                IV_1: {
                    displayName: '76 ММ Ф-34',
                    level: 'IV',
                },
                V: {
                    displayName: '57 ММ ЗИС-4',
                    level: 'V',
                },
                V_1: {
                    displayName: '76 ММ С-54',
                    level: 'V',
                }
            },
            towers: {
                IV: {
                    displayName: 'Т-34 ОБР. 1940 Г.',
                    level: 'IV',
                    default: true
                },
                V: {
                    displayName: 'Т-34 ОБР. 1942 Г.',
                    level: 'V'
                }
            },
            engines: {
                V: {
                    displayName: 'В-2',
                    level: 'V',
                    default: true
                },
                VI: {
                    displayName: 'В-2-34',
                    level: 'VI'
                }
            },
            tracks: {
                IV: {
                    displayName: 'Т-34 ОБР. 1941 Г.',
                    level: 'IV',
                    default: true
                },
                V: {
                    displayName: 'Т-34 ОБР. 1943 Г.',
                    level: 'V'
                }
            },
            radios: {
                IV: {
                    displayName: '9Р',
                    level: 'I',
                    default: true
                },
                VIII: {
                    displayName: '9РМ',
                    level: 'VIII'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            radioOperator: 50
        }
    },
    {
        name: 'R07_T-34-85',
        type: 'mt',
        level: 'VI',
        nation: 'ussr',
        displayName: 'T-34-85',
        availableShop: true,
        pricePractice: 27825,
        price: 915000, // 9150 rub
        research: {
            guns: {
                V: {
                    displayName: '76 ММ С-54',
                    level: 'V',
                    default: true
                },
                V_1: {
                    displayName: '122 ММ У-11',
                    level: 'V'
                },
                VI: {
                    displayName: '85 ММ ЗИС-С-53',
                    level: 'VI'
                },
                VII: {
                    displayName: '85 ММ Д-5Т-85БМ',
                    level: 'VII'
                }
            },
            towers: {
                VI: {
                    displayName: 'Т-34-85',
                    level: 'VI',
                    default: true
                },
                VII: {
                    displayName: 'Т-34-85 РАСШИРЕННАЯ',
                    level: 'VII'
                }
            },
            engines: {
                VI: {
                    displayName: 'В-2-34',
                    level: 'VI',
                    default: true
                },
                VI_1: {
                    displayName: 'В-2-34М',
                    level: 'VI'
                },
                VIII: {
                    displayName: 'В-54К',
                    level: 'VIII'
                }
            },
            tracks: {
                V: {
                    displayName: 'T-34-85',
                    level: 'V',
                    default: true
                },
                VI: {
                    displayName: 'Т-34-85-60',
                    level: 'VI',
                }
            },
            radios: {
                IV: {
                    displayName: '9Р',
                    level: 'IV',
                    default: true
                },
                VIII: {
                    displayName: '9РМ',
                    level: 'VIII'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            gunner: 50,
            radioOperator: 50
        }
    },
    {
        name: 'R01_IS',
        type: 'ht',
        level: 'VII',
        nation: 'ussr',
        displayName: 'ИС',
        availableShop: true,
        pricePractice: 22400,
        price: 1424000, // 14240 rub
        research: {
            guns: {
                VI: {
                    displayName: '85 ММ Д-5Т',
                    level: 'VI',
                    default: true
                },
                VII: {
                    displayName: '85 ММ Д-5Т-85БМ',
                    level: 'VII'
                },
                VII_1: {
                    displayName: '100 ММ Д-10Т',
                    level: 'VII'
                },
                VII_2: {
                    displayName: '122 ММ Д-2-5Т',
                    level: 'VII'
                },
                VIII: {
                    displayName: '122 ММ Д-25Т',
                    level: 'VIII'
                }
            },
            towers: {
                VI: {
                    displayName: 'ИС-85',
                    level: 'VI',
                    default: true
                },
                VII: {
                    displayName: 'ИС-122',
                    level: 'VII'
                }
            },
            engines: {
                VII: {
                    displayName: 'В-2ИС',
                    level: 'VII',
                    default: true
                },
                IX: {
                    displayName: 'В-2-54ИС',
                    level: 'IX',
                }
            },
            tracks: {
                VI: {
                    displayName: 'ИС-1',
                    level: 'VI',
                    default: true
                },
                VII: {
                    displayName: 'ИС-2М',
                    level: 'VII',
                }
            },
            radios: {
                VII: {
                    displayName: '10РК',
                    level: 'VII',
                    default: true
                },
                IX: {
                    displayName: '12РТ',
                    level: 'IX'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            gunner: 50
        }
    },
    {
        name: 'R19_IS-3',
        type: 'ht',
        level: 'VIII',
        nation: 'ussr',
        displayName: 'ИС-3',
        availableShop: true,
        pricePractice: 77000,
        price: 2568500, // 25685 rub
        research: {
            guns: {
                VII: {
                    displayName: '122 ММ Д-2-5Т',
                    level: 'VII',
                    default: true
                },
                VII_1: {
                    displayName: '100 ММ Д-10Т',
                    level: 'VII'
                },
                VIII: {
                    displayName: '122 ММ Д-25Т',
                    level: 'VIII'
                },
                IX: {
                    displayName: '122 ММ БЛ-9',
                    level: 'IX'
                }
            },
            towers: {
                VIII: {
                    displayName: 'КИРОВЕЦ-1',
                    level: 'VIII',
                    default: true
                },
                VIII_1: {
                    displayName: 'ИС-3',
                    level: 'VIII'
                }
            },
            engines: {
                VIII: {
                    displayName: 'В-11',
                    level: 'VIII',
                    default: true
                },
                IX: {
                    displayName: 'В-2-54ИС',
                    level: 'IX'
                }
            },
            tracks: {
                VII: {
                    displayName: 'ИС-3',
                    level: 'VII',
                    default: true
                },
                VIII: {
                    displayName: 'ИС-3М',
                    level: 'VIII',
                }
            },
            radios: {
                VII: {
                    displayName: '10РК',
                    level: 'VII',
                    default: true
                },
                IX: {
                    displayName: '12РТ',
                    level: 'IX'
                },
                X: {
                    displayName: 'Р-113',
                    level: 'X'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            gunner: 50
        }
    },
    {
        name: 'R81_T-10',
        type: 'ht',
        level: 'IX',
        nation: 'ussr',
        displayName: 'T-10',
        availableShop: true,
        pricePractice: 164700,
        price: 3531000, // 35310 rub
        research: {
            guns: {
                VIII: {
                    displayName: '122 ММ Д-25Т',
                    level: 'VIII',
                    default: true
                },
                IX: {
                    displayName: '122 ММ БЛ-9',
                    level: 'IX'
                },
                X: {
                    displayName: '122 ММ M62-T2',
                    level: 'X'
                }
            },
            towers: {
                VIII: {
                    displayName: 'Т-10',
                    level: 'VIII',
                    default: true
                },
                IX: {
                    displayName: 'Т-10М',
                    level: 'IX'
                }
            },
            engines: {
                IX: {
                    displayName: 'В-12-5',
                    level: 'IX',
                    default: true
                },
                IX_1: {
                    displayName: 'В-12-6',
                    level: 'IX'
                }
            },
            tracks: {
                VIII: {
                    displayName: 'Т-10',
                    level: 'VIII',
                    default: true
                },
                IX: {
                    displayName: 'Т-10М',
                    level: 'IX'
                }
            },
            radios: {
                VII: {
                    displayName: '10РК',
                    level: 'VII',
                    default: true
                },
                IX: {
                    displayName: '12РТ',
                    level: 'IX'
                },
                X: {
                    displayName: 'Р-113',
                    level: 'X'
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            gunner: 50
        }
    },
    {
        name: 'R45_IS-7',
        type: 'ht',
        level: 'X',
        nation: 'ussr',
        displayName: 'ИС-7',
        availableShop: true,
        pricePractice: 189200,
        price: 6100000, // 61000 rub
        research: {
            guns: {
                X: {
                    displayName: '130 ММ С-70',
                    level: 'X',
                    default: true
                }
            },
            towers: {
                X: {
                    displayName: 'ИС-7',
                    level: 'X',
                    default: true
                }
            },
            engines: {
                X: {
                    displayName: 'М-50ТИ',
                    level: 'X',
                    default: true
                }
            },
            tracks: {
                X: {
                    displayName: 'ИС-7',
                    level: 'X',
                    default: true
                }
            },
            radios: {
                X: {
                    displayName: '10РК-26',
                    level: 'X',
                    default: true
                }
            }
        },
        crew: {
            commander: 50,
            driverMechanic: 50,
            charging: 50,
            gunner: 50,
            radioOperatorCharging: 50
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