module.exports = {
    db: null,


    /*
    {
        code: 0, // fail
        user: 'id_user',
        section: 'users / shop / payments',
        operation: 'Buy tank a shop',
        dateTime: 'Date.now()',
        props: 'any variables'
    }
    */
    log: ({ code, user, section, operation, dateTime, props }) => {

        const data = Object.assign({
            code: code,
            user: user,
            section: section,
            operation: operation,
            dateTime: dateTime
        }, props);

        this.db.collection('logs').insertOne(data);
    }
};