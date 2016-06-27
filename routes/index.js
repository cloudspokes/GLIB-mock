var _ = require('lodash');
var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');
request.debug = true;
var moment = require('moment');
var MarkdownIt = require('markdown-it');
var jwtDecode = require('jwt-decode')
var ChallengeObj = require('../model/Challenge.js')


var fMassagePayload = function(source) {
    md = new MarkdownIt();
    var title = _.get(source, 'title', '');
    var payload = {};
    payload.projectId = _.get(source, 'tc_project_id', (config.TC_ENV === 'dev') ? '6370' : '8905');
    payload.requirements = md.render(_.get(source, 'body', ''));
    payload.contestCopilotName = 'Unassigned';
    payload.prizes = [];
    payload.registrationStartDate = _.get(source, 'registrationStartDate', new Date()); //": "2016-02-16T17:53:03+00:00",
    payload.registrationStartDate = moment(payload.registrationStartDate).toISOString();
    payload.registrationEndDate = _.get(source, 'registrationEndDate', new Date()); //": "2016-02-16T17:53:03+00:00",
    payload.registrationEndDate = moment(payload.registrationEndDate).add(7, 'days').toISOString();
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

        title = title.replace(/^(\[.*\])/, '');
        /*
        DESIGN:DESIGN_FIRST_2_FINISH
        DESIGN:WEB_DESIGNS
        DESIGN:WIDGET_OR_MOBILE_SCREEN_DESIGN
        DEVELOP:CODE
        DEVELOP:FIRST_2_FINISH
        */

        if (payload.prizes.length === 1) {
            //assume f2f with only 1
            payload.track = 'DEVELOP';
            payload.subTrack = 'FIRST_2_FINISH';
        }
    } catch (e) {
        console.log(e);
    }

    payload.name = title;


    return payload;
};

var fMassageV3Payload = function(source, accessToken) {
    md = new MarkdownIt();
    var title = _.get(source, 'title', '');
    var payload = new ChallengeObj();
    payload.jwtToken = accessToken;
    var token = jwtDecode(accessToken);
    console.log(token);
    payload.userId = token.userId;
    payload.tcDirectProjectId = _.get(source, 'tc_project_id', (config.TC_ENV === 'dev') ? '10139' : '8905');
    payload.contestCopilotName = 'Unassigned';
    payload.hasMulti = false;
    payload.specReviewStartMode = "now";
    payload.projectHeader.tcDirectProjectId = payload.tcDirectProjectId;
    var reqs = _.get(source, 'body', '');
    reqs += '\n\n#### Source: [Github Issue #' + source.number + '](' + source.html_url + ')';
    payload.projectHeader.projectSpec.detailedRequirements = md.render(reqs);
    payload.projectHeader.projectSpec.finalSubmissionGuidelines = md.render(_.get(source, 'submissionGuidelies',
      payload.projectHeader.projectSpec.finalSubmissionGuidelines));
    var guides = [];

    var body = _.get(source, 'body', '');
    var submissionTag = '### Submissions:';
    var startIndex = body.indexOf(submissionTag);
    if(startIndex==-1){
        guides.push('Ensure good test coverage on all modules');
        guides.push('Upload documentation for how to run your submission');
        guides.push('Upload all your source code as a zip for review');
        guides.push('Winner will be required to submit a pull request with their winning code.');
    }else{
        var nextIndex = startIndex+submissionTag.length;
        var endIndex = body.indexOf('###', nextIndex);
        if(endIndex===-1){
            guides.push(body.substring(nextIndex));
        }else{
            guides.push(body.substring(nextIndex, endIndex));
        }
    }
    var repositoryTag = '### Repository:';
    var repositoryStartIndex = body.indexOf(repositoryTag);
    if(repositoryStartIndex!=-1){
        guides.push('The repository for this challenge can be found [here](');
        var repositoryNextIndex = repositoryStartIndex+repositoryTag.length;
        var repositoryEndIndex = body.indexOf('###', repositoryNextIndex);
        if(repositoryEndIndex===-1){
            guides.push(body.substring(repositoryNextIndex));
        }else{
            guides.push(body.substring(repositoryNextIndex, repositoryEndIndex));
        }

        guides.push(')')
    }
    payload.submission =  md.render(guides.join('\n'));
    payload.projectHeader.properties["Review Type"] = _.get(source, 'reviewType', 'COMMUNITY');
    payload.projectHeader.prizes = [];


    payload.assetDTO.productionDate = _.get(source, 'registrationStartDate', new Date());
    payload.assetDTO.productionDate = moment(payload.assetDTO.productionDate).toISOString();
    payload.endDate = _.get(source, 'registrationEndDate', new Date()); //": "2016-02-16T17:53:03+00:00",
    payload.endDate = moment(payload.endDate).add(7, 'days').toISOString();
    //CWD--

    //Get prizes from title
    try {
        var re = /(\$[0-9]+)(?=.*\])/g;
        var prizesFromTitle = [];

        prizesFromTitle = title.match(re);
        _.forEach(prizesFromTitle, function(prize, i) {
            payload.projectHeader.prizes.push({
                "place": i + 1,
                "prizeAmount": parseInt(prize.replace('$', '')),
                "prizeType": {
                    "id": 15,
                    "description": "Contest Prize"
                },
                "numberOfSubmissions": 1
            });
        });

        title = title.replace(/^(\[.*\])/, '');
        /*
        DESIGN:DESIGN_FIRST_2_FINISH
        DESIGN:WEB_DESIGNS
        DESIGN:WIDGET_OR_MOBILE_SCREEN_DESIGN
        DEVELOP:CODE
        DEVELOP:FIRST_2_FINISH
        */

        payload.projectHeader.projectCategory = {
            "id": 39, //CWD-- 38
            "name": "CODE", //CWD-- First2Finish
            "projectType": {
                "id": 2,
                "name": "Application"
            }
        };

        if (payload.projectHeader.prizes.length === 1) {
            //assume f2f with only 1
            payload.projectHeader.projectCategory = {
                "id": 38, //CWD-- 38
                "name": "First2Finish", //CWD--
                "projectType": {
                    "id": 2,
                    "name": "Application"
                }
            };
        }
    } catch (e) {
        console.log(e);
    }

    payload.projectHeader.tcDirectProjectName = payload.assetDTO.name = payload.projectHeader.properties[
        "Project Name"] = title;

    return payload;
};

var fGetAccessToken = function(user, pass, cb) {
    console.log('posting in for accessToken at ', config.APIURL_BASE + config.APIURL_OAUTHACCESS);
    request.post({
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

    request.post({
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

router.get('/challenges-santosh', function(req, res, next) {
    request.get({
        url: config.APIURL_BASE + config.APIURL_CHALLENGE,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.XAPIKEY
        }
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

router.post('/challenges-santosh', function(req, res, next) {
    console.log('posting to: ', config.APIURL_BASE + config.APIURL_CHALLENGE);
    console.log(req.get('content-type'));
    var accessToken = req.get('x-auth-access-token');

    var challengePayload = fMassagePayload(req.body);
    var cb = function(err, httpResponse, body) {
        if (err) {
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
                accessToken = JSON.parse(body).x_auth_access_token;
                console.log('I gots me an accessToken!', accessToken);
                fCreateChallenges(accessToken, challengePayload, cb);
            }
        });
    }
});


router.post('/challenges', function(req, res, next) {
    var accessToken = req.headers.authorization;

    if (accessToken) {
        accessToken = accessToken.replace('Bearer ', '');
        console.log('I gots me an accessToken!', accessToken);
        var payload = fMassageV3Payload(req.body, accessToken);
        console.log('sending over payload:', JSON.stringify(payload, null, 3));
        request.post({
                url: config.APIURL_BASE + config.APIURL_CHALLENGE,
                headers: {
                    'cache-control': 'no-cache',
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify(payload)
            },
            function(err, httpResponse, body) {
                if (err) {
                    console.log(err);
                    res.status(500).json(JSON.parse(body));
                } else {
                    console.log('challenge created ', body);

                    var challenge = {};

                    try {
                        challenge = JSON.parse(body);
                        challenge.challengeURL = config.TC_SITE + '/challenge-details/' + challenge.projectId +
                            '/?type=develop&noncache=true'
                    } catch (e) {
                        challenge = {
                            'error': body
                        };
                    }

                    console.log(challenge);
                    res.json(challenge);
                }
            });
    } else {
        console.log('no accessToken present');
        res.status(500).json({
            err: 'no accessToken present'
        })
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
