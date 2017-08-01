const express = require('express'),
    router = express.Router(),
    User = require('../../models/user'),
    jwt = require('jsonwebtoken'),
    token__module = require('../token'),
    urls = require('./urls');

module.exports = router;