const express = require('express'),
    MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    body__parser = require('body-parser'),
    app = express(),
    token__module = require('./modules/token'),
    config = require('./config/config');


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-access-token');
    next();
});

// Connect to the beerlocker MongoDB
//mongoose.connect('mongodb://test:test@ds121192.mlab.com:21192/oilman__test');
function connectDB(req, res, next) {

    new MongoClient.connect('mongodb://admin:TBFydy86702@node38295-tankslabserver.mircloud.host:27017/tanks-lab', (err, db) => {

        if (err) {

            console.log('DB:', err);

            return res.json({ error: 'No connect to DB' });
        }

        req.db = db;
        req.ObjectId = ObjectID;

        next();
    });
}


app.use((req, res, next) => {

    connectDB(req, res, next);
});

app.use(body__parser.json());
app.use(body__parser.urlencoded({
    extended: true
}));

// ROUTING
app.get('/token/valid', token__module.isValid, (req, res) => {

    const email = req.decoded.email;
    const server = req.decoded.server;

    req.db.collection('users').findOne({
        email: email
    }, (err, user) => {

        if (err || !user) {

            return res.json({ error: err || true });
        }

        const data = {
            username: user.username,
            bons: user.servers[server].bons,
            gold: user.servers[server].gold,
            silver: user.servers[server].silver,
            practice: user.servers[server].practice
        };

        res.json({
            user: data,
            price: config.price
        });
    });
});
app.use('/hangar', require('./modules/hangar/list'), require('./modules/hangar/slot'));
app.use('/shop', require('./modules/shop'));
app.use('/payments', require('./modules/payments/urls'), require('./modules/payments/notification.center'));
app.use('/research', require('./modules/research'));
app.use('/users', require('./modules/users'));
// END ROUTING

app.get('*', function(req, res){
    res.json('GET OUT!');
});

app.listen(8080, () => {
    console.log('TANKS-LAB.COM\nServer is started on a port 8080!')
});