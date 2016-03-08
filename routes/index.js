var _ = require('lodash');
var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');
var moment = require('moment');
var MarkdownIt = require('markdown-it');


var fMassagePayload = function(source) {
    md = new MarkdownIt();
    var title = _.get(source, 'title', '');
    var payload = {};
    payload.projectId = _.get(source, 'projectId', '8455');
    payload.requirements = md.render(_.get(source, 'body', ''));
    payload.contestCopilotName = 'Unassigned';
    payload.prizes = [];
    payload.registrationStartDate = _.get(source, 'registrationStartDate', new Date()); //": "2016-02-16T17:53:03+00:00",
    payload.registrationStartDate = moment(payload.registrationStartDate).toISOString();
    payload.reviewType = _.get(source, 'reviewType', 'COMMUNITY');

    //Get prizes from title
    try {
        var re = /(\$[0-9]+)(?=.*\])/g;
        var prizesFromTitle = [];

        prizesFromTitle = title.match(re);
        _.forEach(prizesFromTitle, function(prize, i) {
            payload.prizes.push({
                "position": i + 1,
                "amount": parseInt(prize.replace('$', '')),
                "numberOfPrizes": 1 //prizesFromTitle.length
            });
        });

        title = title.replace(/(\$[0-9]+)(?=.*\])/g, '');
    } catch (e) {
        console.log(e);
    }

    payload.name = title


    return payload;
};

var fGetAccessToken = function(user, pass, cb) {
    console.log('posting in for accessToken at ', config.APIURL_BASE + config.APIURL_OAUTHACCESS);
    request({
            method: 'POST',
            url: config.APIURL_BASE + config.APIURL_OAUTHACCESS,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.XAPIKEY,
            },
            body: JSON.stringify({
                'x_auth_username': user,
                'x_auth_password': pass
            })
        },
        cb);
};

var fCreateChallenges = function(accessToken, challengePayload, cb) {
    console.log('posting challenge into ', config.APIURL_BASE + config.APIURL_CHALLENGE, challengePayload);
    console.log('headers', {
        'Content-Type': 'application/json',
        'x-api-key': config.XAPIKEY,
        'x-auth-access-token': accessToken
    });

    request({
            method: 'POST',
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
            res.status(500).json(body);
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

    var challengePayload = fMassagePayload(req.body);

    var cb = function(err, httpResponse, body) {
        if (err) {
            console.log(err);
            res.status(500).json(body);
        } else {
            var challenge = {};

            try {
                challenge = JSON.parse(body);
                challenge.success = true;
                challenge.challengeURL = config.TC_SITE + '/challenge-details/' + challenge.id +
                    '/?type=develop&noncache=true'
            } catch (e) {
                challenge = {
                    'error': body
                };
            }

            console.log(challenge);
            res.json(challenge);
        }
    };

    if (accessToken) {
        console.log('I gots me an accessToken!', accessToken);
        fCreateChallenges(accessToken, challengePayload, cb);
    } else {
        console.log('no accessToken. fetching first, then creating');
        var user = (req.body && req.body.x_auth_username) ? req.body.x_auth_username : '';
        var pass = (req.body && req.body.x_auth_password) ? req.body.x_auth_password : '';

        fGetAccessToken(user, pass, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
                res.status(500).json(body);
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
    var user = (req.body && req.body.x_auth_username) ? req.body.x_auth_username : '';
    var pass = (req.body && req.body.x_auth_password) ? req.body.x_auth_password : '';

    fGetAccessToken(user, pass, function(err, httpResponse, body) {
        if (err) {
            console.log(err, httpResponse);
            res.status(500).json(body);
        } else {
            console.log(body);
            res.json(JSON.parse(body));
        }
    });
});


module.exports = router;
