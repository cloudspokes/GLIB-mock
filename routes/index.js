var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');

var fGetAccessToken = function(req, res, cb) {
    console.log('posting in for accessToken at ', config.APIURL_BASE + config.APIURL_OAUTHACCESS);
    request({
            method: 'POST',
            url: config.APIURL_BASE + config.APIURL_OAUTHACCESS,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.XAPIKEY,
            },
            body: JSON.stringify(req.body)
        },
        cb);
};

var fCreateChallenges = function(accessToken, challengePayload, cb) {
    console.log('posting challenge into ', config.APIURL_BASE + config.APIURL_CHALLENGE, challengePayload);
    request({
            url: config.APIURL_BASE + config.APIURL_CHALLENGE,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.XAPIKEY,
                'x-auth-access-token': accessToken
            },
            body: JSON.stringify(challengePayload)
        },
        cb);
};

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'GLIB mock'
    });
});

router.get('/challenges', function(req, res, next) {
    request({
        method: 'GET',
        url: config.APIURL_BASE + config.APIURL_CHALLENGE,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.XAPIKEY,
        },
    }, function(err, httpResponse, body) {
        if (err) {
            console.log(err);
            res.state(500).json(body);
        } else {
            console.log(body);
            res.json(JSON.parse(body));
        }
    });
});

router.post('/', function(req, res, next) {
    console.log('fake posting to: ', config.APIURL_BASE + config.APIURL_CHALLENGE);
    console.log(req.body);

    res.json({
        success: true,
        challengeURL: 'http://topcoder.com',
        createdDate: new Date()
    });
});

router.post('/challenges', function(req, res, next) {
    console.log('posting to: ', config.APIURL_BASE + config.APIURL_CHALLENGE);
    console.log(req.body);
    var accessToken = req.get('x-auth-access-token');
    var challengePayload = {};
    var cb = function(err, httpResponse, body) {
        if (err) {
            console.log(err);
            res.state(500).json(body);
        } else {
            console.log(body);
            res.json(body);
        }
    };

    if (accessToken) {
        console.log('I gots me an accessToken!', accessToken);
        fCreateChallenges(accessToken, challengePayload, cb);
    } else {
        console.log('no accessToken. fetching first, then creating');
        fGetAccessToken(req, res, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
                res.state(500).json(body);
            } else {
                console.log(body);
                accessToken = JSON.parse(body).x_auth_access_token;
                console.log('I gots me an accessToken!', accessToken);
                fCreateChallenges(accessToken, challengePayload, cb);
            }
        });
    }
});

router.post('/oauth/access_token', function(req, res, next) {
    console.log('sending over to ' + config.APIURL_BASE + config.APIURL_OAUTHACCESS, JSON.stringify(req.body));
    fGetAccessToken(req, res, function(err, httpResponse, body) {
        if (err) {
            console.log(err, httpResponse);
            res.state(500).json(body);
        } else {
            console.log(body);
            res.json(JSON.parse(body));
        }
    });
});


module.exports = router;
