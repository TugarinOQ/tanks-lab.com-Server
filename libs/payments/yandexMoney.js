const wallets = require('../../config/wallets');

function getURLYAMoney(method, req, res) {

    const url = 'https://money.yandex.ru/quickpay/confirm.xml';

    let paymentType = '';

    switch(method) {
        case 'mastercard':
        case 'VISA':
            paymentType = 'AC';
            break;

        case 'yandexmoney':
            paymentType = 'PC';
            break;
    }

    const data = {
        receiver: wallets.yaMoney,
        sum: req.body.amount,
        'quickpay-form': 'donate',
        targets: req.body.targets,
        formcomment: req.body.formcomment,
        'short-dest': req.body.shortDest,
        paymentType: paymentType,
        label: req.body.label,
        successURL: req.body.successURL
    };

    return res.json({ url: url, data: data });
}

module.exports = getURLYAMoney;