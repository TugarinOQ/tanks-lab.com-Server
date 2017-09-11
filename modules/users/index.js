const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    md5 = require('md5'),
    jwt = require('jsonwebtoken'),
    token__module = require('../token');

router.post('/register', (req, res) => {

    const email = req.body.email || "";
    const username = req.body.username || "";
    const pass = req.body.password || "";
    const confirm = req.body.confirm || "";
    const server = req.body.server || "ussr";

    const referral = (req.body.referral) ? ( req.body.referral !== username ) ? req.body.referral : 'me' : 'me';

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

                const _user = Object.assign(
                    {
                        email: email,
                        username: username,
                        password: crypt.hash,
                        regDate: Date.now(),
                        servers: {
                            ussr: {
                                silver: 0,
                                gold: 0,
                                bons: 0,
                                practice: 0
                            }
                        },
                        activate: false,
                    },
                    {
                       referral: referral
                    }
                );

                req.db.collection('users').insertOne(_user, (err, user) => {

                    if (err)
                        return res.json({ error: "Duplicate username or email" });

                    req.db.collection('vehicles_ussr').findOne({name: 'R11_MS-1'}, (err, tank) => {

                        Object.assign( tank, {
                            practice: 0,
                            buyDate: Date.now(),
                            researchedDate: Date.now()
                        } );

                        req.db.collection('hangars').insertOne({

                            user: user.insertedId,
                            server: server,
                            countSeats: 5,
                            vehicles: { 'R11_MS-1': tank }
                        }, (err, hangar) => {

                            if (err) {

                                req.logs.log({ code: 0, user: user, section: 'users', operation: 'Create Hangar', dateTime: Date.now() });

                                return res.json({ error: "Error Hangar" });
                            }

                            req.logs.log({ code: 1, user: user, section: 'users', operation: 'Create Hangar', dateTime: Date.now(), props: {
                                hangar_id: hangar._id
                            } });

                            req.db.collection('research').insertOne({

                                user: user.insertedId,
                                server: server,
                                vehicles: [ 'R11_MS-1' ]
                            }, (err, research) => {

                                if (err) {

                                    req.logs.log({ code: 0, user: user, section: 'users', operation: 'Create Research', dateTime: Date.now() });

                                    return res.json({ error: "Error Research" });
                                }

                                req.logs.log({ code: 1, user: user, section: 'users', operation: 'Create Research', dateTime: Date.now(), props: {
                                    research_id: research._id
                                } });

                                const code = md5( email + 'Hfdis$%^4523hd' + user.insertedId + md5( md5('Hfdis$%^4523hd') + md5(email) ) );

                                const hrefActivate = `https://tanks-lab.com/#/?mode=activateUser&user=${user.insertedId}&code=${code}`;

                                res.mailer.send('emailActivate', {
                                    to: email,
                                    subject: 'Подтверждение регистрации | Tanks-Lab.com',
                                    href: hrefActivate
                                }, function (err) {

                                    if (err) {

                                        console.log(err);

                                        return res.json({ error: 'Error send mail' });
                                    }

                                    return res.json({ success: "ok" });
                                });
                            });
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

        if (err) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Any error', dateTime: Date.now(), props: {
                error: err
            }});

            return res.json({ error: err });
        }

        if (!user) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Auth fail', dateTime: Date.now(), props: {
                email: emailOrLogin,
                pass: pass
            }});

            res.json({ error: 'Authentication failed. User not found.' });
        } else if (user) {

            if (user.activate === false || user.activate === undefined || user.activate === null) {

                return res.json({ error: 'Authentication failed. Account is not activated.' });
            }

            User.verifyPassword(pass, (err, success) => {
                if (err || !success) return res.json({ error: 'Authentication failed. Wrong password.' });

                const token = jwt.sign({ _: user._id, login: user.username, email: user.email, server: server }, 'yqawv8nqi5', {
                    expiresIn: '1 day' // expires in 24 hours
                });

                req.logs.log({ code: 1, user: user, section: 'users', operation: 'Auth success', dateTime: Date.now()});

                res.json({
                    success: true,
                    token: token
                });
            }, user.password);
        }

    });
});

router.post('/activate', (req, res) => {

    const userID = req.body.user;
    const code = req.body.code;

    if (!userID || !code) {

        return res.json({ error: 'Get out!' });
    }

    req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {

        if (err || !user || !code) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Error activate', dateTime: Date.now(), props: {
                code: code,
                error: err
            }});

            return res.json({ error: err });
        }

        const controlCode = md5( user.email + 'Hfdis$%^4523hd' + userID + md5( md5('Hfdis$%^4523hd') + md5(user.email) ) );

        if (controlCode !== code) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Invalid code', dateTime: Date.now(), props: {
                code: code,
                error: err
            }});

            return res.json({ error: 'Invalid code' });
        }

        req.db.collection('users').updateOne({ _id: req.ObjectId(userID) }, {
            $set: {
                activate: true
            }
        }, (err, activate) => {

            return res.json({ success: true });
        });
    });

});

router.post('/forgot', (req, res) => {

    const login = req.body.login;
    const email = req.body.email;

    if (!login || !email) {

        return res.json({ error: 'Get out!' });
    }

    req.db.collection('users').findOne({
        $and: [
            { email: email },
            { username: login }
        ]
    }, (err, user) => {

        if (err || !user) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Error forgot password', dateTime: Date.now(), props: {
                code: code,
                error: err
            }});

            return res.json({ error: err });
        }

        const pass = `${(Date.now().toString(36).substr(2, 5) + Math.random().toString(36).substr(2, 5))}`;

        User.cryptPassword(pass, (crypt) => {

            if (crypt.error) {

                return res.json('Error in generate password!');
            }

            req.db.collection('users').updateOne({_id: req.ObjectId(user._id)}, {
                $set: {
                    password: crypt.hash
                }
            }, (err) => {

                if (err) {

                    return res.json({ error: err });
                }

                res.mailer.send('resetPassword', {
                    to: email,
                    subject: 'Сброс пароля | Tanks-Lab.com',
                    pass: pass
                }, function (err) {

                    if (err) {

                        console.log(err);

                        return res.json({error: 'Error send mail'});
                    }

                    return res.json({success: "ok"});
                });
            });
        });
    });
});

router.post('/changePassword', token__module.isValid, (req, res) => {

    const userID = req.decoded._;

    const oldPass = req.body.oldPass;
    const newPass = req.body.newPass;
    const confirm = req.body.confirmPass;

    if (!userID || !oldPass || !newPass || !confirm) {

        return res.json({ error: 'Get out!' });
    }

    req.db.collection('users').findOne({ _id: req.ObjectId(userID) }, (err, user) => {

        if (err || !user || !oldPass || !newPass || !confirm) {

            req.logs.log({ code: 0, user: user, section: 'users', operation: 'Error change password', dateTime: Date.now(), props: {
                error: err
            }});

            return res.json({ error: err });
        }

        User.verifyPassword(oldPass, (err, success) => {
            if (err || !success) return res.json({ error: 'Authentication failed. Wrong old password.' });


            if (newPass !== confirm) {

                return res.json({ error: 'Authentication failed. Wrong new password.' });
            }

            User.cryptPassword(newPass, (crypt) => {

                if (crypt.error) {

                    return res.json('Error in password!');
                }

                req.db.collection('users').updateOne({ _id: req.ObjectId(userID) },{ $set: { password: crypt.hash } }, (err, user) => {

                    if (err) {

                        return res.json({ error: err });
                    }

                    req.logs.log({ code: 1, user: user, section: 'users', operation: 'Change password', dateTime: Date.now(), props: {
                        error: err
                    }});

                    return res.json({ success: true });
                });
            });

        }, user.password);
    });
});

router.get('/info', token__module.isValid, (req, res) => {

    const email = req.decoded.email;

    if (!email) {

        return res.json({ error: 'Get out!' });
    }

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

        let data = Object.assign(user, {
            email: censorEmail(user.email),
            dayOnProject: dayOnProject
        });

        delete data._id;
        delete data.password;

        res.json(data);
    });
});

router.get('/balance', token__module.isValid, (req, res) => {

    const email = req.decoded.email;
    const server = req.decoded.server;

    if (!email, !server) {

        return res.json({ error: 'Get out!' });
    }

    req.db.collection('users').findOne({
        email: email
    }, (err, user) => {

        if (err) throw err;

        const data = {
            bons: user.servers[server].bons,
            silver: user.servers[server].silver,
            gold: user.servers[server].gold,
            practice: user.servers[server].practice
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