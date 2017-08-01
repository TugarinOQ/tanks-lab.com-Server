const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.post('/register', (req, res) => {

    const email = req.body.email || "";
    const username = req.body.username || "";
    const pass = req.body.password || "";
    const confirm = req.body.confirm || "";
    const server = req.body.server || "ussr";

    if (!checkRegExEmail(email)) return res.json({ error: "Incorrect email" });
    if (!checkRegExLogin(username)) return res.json({ error: "Incorrect login" });
    if (pass.length < 8 || (pass !== confirm)) return res.json({ error: "Incorrect password" });

    req.db.collection('users').findOne({

        $or: [
            { email: email },
            { username: username }
        ]
    }, (err, user) => {

        if (err) {

            return res.json({ error: err });
        }

        if (!user) {

            User.cryptPassword(pass, (crypt) => {

                if (crypt.error) {

                    return res.json('Error in generate password!');
                }

                req.db.collection('users').insertOne({
                    email: email,
                    username: username,
                    password: crypt.hash,
                    regDate: Date.now(),
                    silver: 0,
                    gold: 0,
                    bons: 0,
                    practice: 0
                }, (err, user) => {

                    if (err)
                        return res.json({ error: "Duplicate username or email" });

                    req.db.collection('vehicles_ussr').findOne({name: 'R11_MS-1'}, (err, tank) => {

                        req.db.collection('hangars').insertOne({

                            user: user.insertedId,
                            server: server,
                            countSeats: 5,
                            vehicles: [ tank ]
                        }, (err, item) => {

                            if (err)
                                return res.json({ error: "Error Hangar" });

                            return res.json({ success: "ok" });
                        });
                    });
                });
            });
        } else {

            res.json({ error: 'Username or Email already exists.' })
        }
    });
});

router.post('/login', (req, res) => {

    const server = req.body.server || 'ussr';
    const emailOrLogin = req.body.email || "";
    const pass = req.body.password || "";

    if (!checkRegExEmail(emailOrLogin)) return res.json({ error: "Incorrect email" });
    if (pass.length < 8) return res.json({ error: "Incorrect password" });

    req.db.collection('users').findOne({
        email: emailOrLogin
    }, (err, user) => {

        if (err) throw err;

        if (!user) {
            res.json({ error: 'Authentication failed. User not found.' });
        } else if (user) {

            User.verifyPassword(pass, (err, success) => {
                if (err || !success) return res.json({ error: 'Authentication failed. Wrong password.' });

                const token = jwt.sign({ _: user._id, login: user.username, email: user.email, server: server }, 'yqawv8nqi5', {
                    expiresIn: '1 day' // expires in 24 hours
                });

                res.json({
                    success: true,
                    token: token
                });
            }, user.password);
        }

    });
});

router.post('/forgot', (req, res) => {

    //
});

router.get('/info', token__module.isValid, (req, res) => {

    const email = req.decoded.email;

    req.db.collection('users').findOne({
        email: email
    }, (err, user) => {

        if (err) throw err;

        let dayOnProject = new Date().getDaysBetween(new Date(user.regDate));

        let censorWord = function (str) {
            return str[0] + "*".repeat(str.length - 2) + str.slice(-1);
        };

        let censorEmail = function (email){
            let arr = email.split("@");
            return censorWord(arr[0]) + "@" + arr[1];
        };

        const data = {
            name: user.name,
            username: user.username,
            email: censorEmail(user.email),
            balance: user.balance || 0.00,
            balanceOut: user.balanceOut || 0.00,
            dayOnProject: dayOnProject
        };

        res.json(data);
    });
});

// CUSTOM FUNCTIONS
Date.prototype.msPERDAY = 1000 * 60 * 60 * 24;
Date.prototype.getDaysBetween = function(d) {

    d.setHours(this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());

    let diff = this.getTime() - d.getTime();
    return (diff)/this.msPERDAY + 1;
};
function checkRegExLogin(login)
{
    return /^[a-zA-Z1-9]+$/.test(login) && login.length > 3 && login.length < 15;
}
function checkRegExEmail(email)
{
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}
//

module.exports = router;