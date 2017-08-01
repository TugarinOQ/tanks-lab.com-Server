const express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    body__parser = require('body-parser'),
    app = express(),
    token__module = require('./modules/token');


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-access-token');
    next();
});

// Connect to the beerlocker MongoDB
//mongoose.connect('mongodb://test:test@ds121192.mlab.com:21192/oilman__test');
app.use((req, res, next) => {

    MongoClient.connect('mongodb://test:test@oilman-shard-00-00-slnmp.mongodb.net:27017,oilman-shard-00-01-slnmp.mongodb.net:27017,oilman-shard-00-02-slnmp.mongodb.net:27017/tankslab?ssl=true&replicaSet=oilman-shard-0&authSource=admin', (err, db) => {

        if (err) {

            return res.json({ error: 'No connect to DB' });
        }

        req.db = db;
        req.ObjectId = ObjectID;

        next();
    });
});

app.use(body__parser.json());
app.use(body__parser.urlencoded({
    extended: true
}));

// ROUTING
app.get('/token/valid', token__module.isValid, (req, res) => {

    const email = req.decoded.email;

    req.db.collection('users').findOne({
        email: email
    }, (err, user) => {

        if (err || !user) {

            return res.json({ error: err || true });
        }

        const data = {
            username: user.username,
            bons: user.bons,
            gold: user.gold,
            silver: user.silver,
            practice: user.practice
        };

        res.json(data);
    });
});
app.use('/hangar', require('./modules/hangar'));
app.use('/shop', require('./modules/shop'));
app.use('/payments', require('./modules/payments'), require('./modules/payments/urls'));
app.use('/users', require('./modules/users'));
// END ROUTING

app.get('*', function(req, res){
    res.json('GET OUT!');
});

app.listen(8080, () => {
    console.log('TANKS-LAB.COM\nServer is started on a port 8080!')
});