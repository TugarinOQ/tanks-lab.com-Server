const md5 = require('md5');

module.exports = {

    shop_id: 1916,
    secretKey: 'b3afe9b9bfd89bbb',
    minUpValueAmount: 2,
    versionAPI: '1.1',
    language: 'ru',
    ipServer: '5.196.121.217',

    urls: {
        merchant: 'https://megakassa.ru/merchant/',
        api: `https://api.megakassa.ru/v${this.versionAPI}`,
        methods: {
            getAvailablePaymentMethod: '/payment_methods_list/',
            getBalance: '/shop_balance/',
            withdraw_create: '/withdraw_create/',
            getWithdraw: '/get_withdraw/',
            getListWithdraw: '/withdraws_list/'
        }
    },

    genSignature: {
        merchant: function({ params }) {

            const signature = [
                this.shop_id,
                params.amount,
                params.currency,
                params.description,
                params.order_id,
                '', // method_id
                '', // client_email
                params.debug,
                this.secretKey
            ];

            return md5( `${this.secretKey}${ md5(signature.join(':')) }` );
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
                this.secretKey
            ];

            return (!checkObjValIsUndefined(signature)) ? false : md5( signature.join(':') );
        },

        withdraw: function({ props }) {

            const params = Object.assign({
                currency_from: 'RUB',
                shop_id: this.shop_id
            }, props);

            const values = [];

            const sortedKeys = Object.keys(params).sort();

            sortedKeys.map(key => {

                values.push(params[key]);
            });

            values.push(this.secretKey);

            return md5(values.join(':'));
        }
    },

    init: function({ shop_id, secret_key, versionAPI = '1.1', language = 'ru' }) {

        this.shop_id = shop_id;
        this.secretKey = secret_key;
        this.versionAPI = versionAPI;
    },
    merchant: function({ order_id, amount, currency = 'RUB', description, debug = '0', props = {} }) {

        let params = Object.assign({
            shop_id: this.shop_id,
            order_id: order_id,
            amount: amount,
            currency: currency,
            description: description,
            debug: debug,
            language: this.language
        }, props);

        const signature = this.genSignature.merchant({ params: params });

        params = Object.assign(params, { signature: signature });

        return this.urls.merchant + ObjectInURL(params);
    },

    check: {
        ip: function({ req }) {

            return (req.headers['x-real-ip']) ? (req.headers['x-real-ip'] === this.ipServer) : false;
        }
    }
};

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