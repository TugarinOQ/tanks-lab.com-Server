const wallets = require('../../config/wallets');
const md5 = require('md5');

function getFreeKassa(req, res) {

    const url = 'http://www.free-kassa.ru/merchant/cash.php';
    const secretWord = 'uv5abvgs';

    const sign = md5(`${wallets.freeKassa}:${req.body.amount}:${secretWord}:${req.body.formcomment}`);

    const data = {
        m: wallets.freeKassa,
        oa: req.body.amount,
        o: req.body.formcomment,
        em: req.body.needEmail,
        s: sign
    };

    return res.json({ url: url, data: data });
}

module.exports = getFreeKassa;