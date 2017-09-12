const md5 = require('md5'),
    async = require('async'),
    request = require('request');

const config = {
    shop_id: 1916,
    secretKey: 'b3afe9b9bfd89bbb',
    withdrawKey: 'f7b3425bd567a463f6ff32c7fc3785d8',
    minUpValueAmount: 2,
    versionAPI: '1.0',
    language: 'ru',
    ipServer: '5.196.121.217',

    urls: {
        merchant: 'https://megakassa.ru/merchant/',
        api: `https://api.megakassa.ru/v1.0`,

        methods: {
            getAvailablePaymentMethod: '/payment_methods_list/',
            getBalance: '/shop_balance/',
            withdraw_create: '/withdraw_create/',
            getWithdraw: '/get_withdraw/',
            getListWithdraw: '/withdraws_list/'
        }
    }
};

const signature = {

    merchant: function({ params }) {

        const signature = [
            config.shop_id,
            params.amount,
            params.currency,
            params.description,
            params.order_id,
            '', // method_id
            '', // client_email
            params.debug,
            config.secretKey
        ];

        return md5( `${config.secretKey}${ md5(signature.join(':')) }` );
    },
    merchantNotify: function({ req, res }) {

        const signature = [
            req.body.uid,
            res.amount,
            req.body.amount_shop,
            req.body.amount_client,
            req.body.currency,
            res.order_id,
            req.body.payment_method_id,
            req.body.payment_method_title,
            req.body.creation_time,
            req.body.payment_time,
            req.body.client_email,
            req.body.status,
            req.body.debug,
            config.secretKey
        ];

        return (!checkObjValIsUndefined(signature)) ? false : md5( signature.join(':') );
    },

    withdraw: function(props) {

        const params = Object.assign({
            shop_id: config.shop_id
        }, props);

        const values = [];

        const sortedKeys = Object.keys(params).sort();

        sortedKeys.map(key => {

            values.push(params[key]);
        });


        values.push(config.withdrawKey);

        return md5(values.join(':'));
    }
};

const helpFunction = {
    getListMethods: function({ prms }) {

        request({
            method: 'GET',
            url: config.urls.api + config.urls.methods.getAvailablePaymentMethod + ObjectInURL(prms)
        }, (err, res, body) => {

            const _body = JSON.parse(body);

            console.log(_body);
        });
    },
    getBalance: function({ prms, cb }) {

        request({
            method: 'GET',
            url: config.urls.api + config.urls.methods.getBalance + ObjectInURL(prms)
        }, (err, res, body) => {

            const _body = JSON.parse(body);

            if (_body.status !== 'ok') {

                cb ( 0 );
            }

            cb ( _body.data.currencies_list[0].balance_in_rub );
        });
    },

    checkIP: function({ req }) {

        return !(req.headers['x-real-ip']) ? (req.headers['x-real-ip'] === config.ipServer) : false;
    }
};

function merchant ({ order_id, amount, currency = 'RUB', description, debug = '', props = {} }) {

    let params = Object.assign({
        shop_id: config.shop_id,
        order_id: order_id,
        amount: amount,
        currency: currency,
        description: description,
        debug: debug
    }, props);

    const signature = this.signature.merchant({ params: params });

    params = Object.assign(params, { signature: signature });

    return config.urls.merchant + ObjectInURL(params);
}

function withdraw(props, cb) {

    let tmpSign = signature.withdraw({});

    // helpFunction.getListMethods({
    //     prms: {
    //         shop_id: config.shop_id,
    //         sign: tmpSign
    //     }
    // });

    helpFunction.getBalance({
        prms: {
            shop_id: config.shop_id,
            sign: tmpSign
        },

        cb: (balance) => {

            if (balance < props.amount || props.amount > 2000) {

                return cb({ status: 'manual' });
            }

            tmpSign = signature.withdraw({
                method_id: parseInt(props.method),
                amount: parseFloat(props.amount),
                currency_from: props.currency_from,
                wallet: props.wallet,
                debug: props.debug,
                comment: props.comment,
                order_id: props.order_id,
            });

            const prms = {
                shop_id: config.shop_id,
                method_id: parseInt(props.method),
                amount: parseFloat(props.amount),
                currency_from: props.currency_from,
                wallet: props.wallet,
                debug: props.debug,
                comment: props.comment,
                order_id: props.order_id,
                sign: tmpSign
            };

            request({
                method: 'GET',
                url: config.urls.api + config.urls.methods.withdraw_create + ObjectInURL(prms)
            }, (err, res, body) => {

                const _body = JSON.parse(body);

                if (_body.status === 'ok') {

                    return cb({ status: 'ok' });
                } else {

                    return cb( _body );
                }
            });
        }
    });
}

module.exports = { merchant: merchant, withdraw: withdraw, checkIP: helpFunction.checkIP, signature: signature };

function checkObjValIsUndefined(obj) {

    obj.map((value) => {

        if ( typeof value === "undefined" ) {

            return false;
        }
    });

    return true;
}

/**
 * @return {string}
 */
function ObjectInURL(obj) {

    let url = '?';

    Object.keys(obj).map(key => {

        const value = obj[key];

        url += `${key}=${value}${ (Object.keys(obj).indexOf(key) !== (Object.keys(obj).length - 1)) ? '&' : '' }`;
    });

    return encodeURI(url);
}