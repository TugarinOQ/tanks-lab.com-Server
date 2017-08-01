const bcrypt = require('bcrypt-nodejs');

cryptPassword = function(password, cb) {

    bcrypt.genSalt(5, (err, salt) => {
        if (err) cb({ error: err });

        bcrypt.hash(password, salt, null, (err, hash) => {
            if (err) cb({ error: err });

            cb({ hash: hash });
        });
    });
};

verifyPassword = function(password, cb, _thisPassword) {
    bcrypt.compare(password, _thisPassword, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = { cryptPassword: cryptPassword, verifyPassword: verifyPassword };