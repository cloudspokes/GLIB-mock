/**
 * App routes and related code.
 * 
 * @author TCSDEVELOPER
 * @version 1.0
 * @copyright Copyright (C) 2017, TopCoder, Inc. All rights reserved.
 */

'use strict';

var _ = require('lodash');
var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');
var moment = require('moment');
var MarkdownIt = require('markdown-it');
var TopcoderApi = require('../helpers/topcoder-api.js');
var ChallengeObj = require('../model/Challenge.js');


/**
 * Get the TopCoder challenge submission guidelines from the GitHub issue body.
 * This code was copied and refactored from the old `fMassageV3Payload` function.
 * 
 * @param {string} body - GitHub issue body
 * @returns {string} Guidelines Markdown
 */
var fGetGuidelines = function(body) {
    var guides = [];
    
    // If the 'Submissions' tag exists in the GitHub issue body, then
    // include everything under it into the TopCoder challenge guidelines.
    // Otherwise, include a few custom general guidelines instead.
    var submissionTag = '### Submissions:';
    var startIndex = body.indexOf(submissionTag);
    if (startIndex === -1) {
        guides.push('Ensure good test coverage on all modules');
        guides.push('Upload documentation for how to run your submission');
        guides.push('Upload all your source code as a zip for review');
        guides.push('Winner will be required to submit a pull request with their winning code.');
    } else {
        var nextIndex = startIndex + submissionTag.length;
        var endIndex = body.indexOf('###', nextIndex);
        if (endIndex === -1) {
            guides.push(body.substring(nextIndex));
        } else {
            guides.push(body.substring(nextIndex, endIndex));
        }
    }
    
    // If the 'Repository' tag exists in the GitHub issue body, then
    // include everything under it into the TopCoder challenge guidelines
    var repositoryTag = '### Repository:';
    var repositoryStartIndex = body.indexOf(repositoryTag);
    if (repositoryStartIndex !== -1) {
        guides.push('The repository for this challenge can be found [here](');
        var repositoryNextIndex = repositoryStartIndex + repositoryTag.length;
        var repositoryEndIndex = body.indexOf('###', repositoryNextIndex);
        if (repositoryEndIndex === -1) {
            guides.push(body.substring(repositoryNextIndex));
        } else {
            guides.push(body.substring(repositoryNextIndex, repositoryEndIndex));
        }
        
        guides.push(')');
    }
    
    // Concatenate the guidelines into a single string and return it
    return guides.join('\n');
};


/**
 * Parse the prizes from the GitHub issue title and also return what's left of the title.
 * This code was copied from the old `fMassageV3Payload` function and updated for the new API.
 * 
 * @param {string} title - GitHub issue title
 * @returns {Object} Contains two properties: `title` (string) and `prizes` (array of integers)
 */
var fParseTitle = function(title) {
    var prizes = [];
    
    // Get prizes from title, e.g., "[$100, $50] Issue Title Here"
    try {
        var re = /(\$[0-9]+)(?=.*\])/g;
        var prizesFromTitle = [];
        
        // Capture the prize values
        prizesFromTitle = title.match(re);
        
        // Add the prize values as integers to the prizes array
        _.forEach(prizesFromTitle, function(prize) {
            var prizeInt = parseInt(prize.replace('$', ''), 10);
            prizes.push(prizeInt);
        });
        
        // Remove the prize values from the title
        title = title.replace(/^(\[.*\])/, '').trim();
        /*
        DESIGN:DESIGN_FIRST_2_FINISH
        DESIGN:WEB_DESIGNS
        DESIGN:WIDGET_OR_MOBILE_SCREEN_DESIGN
        DEVELOP:CODE
        DEVELOP:FIRST_2_FINISH
        */
    } catch (e) {
        console.log(e);
    }
    
    // Return both the prizes array and the modified title
    return {
        title: title,
        prizes: prizes
    };
};


/**
 * Convert the GitHub issue object into a format expected by the TopCoder API.
 * 
 * @param {Object} source - GitHub issue object
 * @returns {Object} Payload in the format expected by the TopCoder API:
 *     https://github.com/cwdcwd/topcoder-api-challenges/blob/master/docs/DefaultApi.md#saveDraftContest
 */
var fMassagePayload = function(source) {
    // Markdown-to-HTML converter
    var md = new MarkdownIt();
    
    // Empty challenge object with preset default values
    var challenge = new ChallengeObj();
    
    // Not sure what '10139' and '8905' mean... They're from the original `fMassageV3Payload` function.
    challenge.projectId = _.get(source, 'tc_project_id', (config.TC_ENV === 'dev') ? '10139' : '8905');
    
    // Set the review type
    challenge.reviewType = _.get(source, 'reviewType', challenge.reviewType);
    
    // The TopCoder API says the milestone ID is optional, but returns an error if it's omitted...
    challenge.milestoneId = _.get(source, 'milestone.id', 1);
    
    // Set the registration start date
    var registrationStartDate = _.get(source, 'registrationStartDate', new Date()); //": "2016-02-16T17:53:03+00:00",
    challenge.registrationStartsAt = moment(registrationStartDate).toISOString();
    
    // If the registration end date is given, then use it. Otherwise, set the
    // registration end date to 7 days after the registration start date.
    var registrationEndDate = _.get(source, 'registrationEndDate', null);
    challenge.registrationEndsAt = ( registrationEndDate ?
            moment(registrationEndDate) :
            moment(registrationStartDate).add(7, 'days') ).toISOString();
    
    // The TopCoder API requires the submission end date,
    // so just set it to the same as the registration end date
    challenge.submissionEndsAt = challenge.registrationEndsAt;
    
    // Get the challenge requirements and guidelines from the GitHub issue body
    var body = _.get(source, 'body', '');
    var requirements = body + '\n\n#### Source: [Github Issue #' +
            source.number + '](' + source.html_url + ')';
    var guidelines = fGetGuidelines(body);
    
    // Convert GitHub Markdown to HTML strings
    challenge.detailedRequirements = md.render(requirements);
    challenge.submissionGuidelines = md.render(guidelines);
    
    // Parse the prizes from the title and also get the modified title
    var data = fParseTitle(_.get(source, 'title', ''));
    
    challenge.name = data.title;
    challenge.prizes = data.prizes;
    
    // Assume F2F if there's only 1 prize
    if (challenge.prizes.length === 1) {
        challenge.subTrack = 'FIRST_2_FINISH';
    }
    
    // The TopCoder API actually expects the challenge under the "param" property
    var payload = { "param": challenge };
    
    return payload;
};


/**
 * Get a TopCoder OAuth accessToken from the specified TopCoder credentials.
 * 
 * @param {string} username - TopCoder username
 * @param {string} password - TopCoder password
 * @param {Function} callback - Callback to be called on completion.
 *     On failure, it will be called with:  callback(new Error('ERROR MESSAGE'));
 *     On success, it will be called with:  callback(null, { accessToken: 'YOUR TOKEN' });
 */
var fGetAccessToken = function(username, password, callback) {
    // Send a POST request to get a v2 accessToken from the TopCoder API
    request.post({
        url: config.TC_V2_AUTH_URL,
        headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "username": username,
            "password": password,
            "client_id": config.TC_OAUTH_CLIENT_ID,
            "sso": false,
            "scope": "openid profile offline_access",
            "response_type": "token",
            "connection": "TC-User-Database",
            "grant_type": "password",
            "device": "Browser"
        })
    }, v2TokenCallback);
    
    /**
     * Callback called by the 'request' module with the v2 accessToken.
     */
    function v2TokenCallback(error, httpResponse, body) {
        var customError = null;
        var v2Token = {};
        
        // Log any errors and forward them to the callback
        if (error) {
            customError = new Error('Failed to get v2 accessToken.');
            console.error(customError, error);
            callback(customError);
            return;
        }
        
        // Try to parse the v2 accessToken data from the response body
        try {
            v2Token = JSON.parse(body);
        } catch (e) {
            customError = new Error('Failed to parse v2 accessToken.');
            console.error(customError, e);
            callback(customError);
            return;
        }
        
        // Send a POST request to upgrade the v2 accessToken to a v3 accessToken
        request.post({
            url: config.TC_V3_AUTH_URL,
            headers: {
                "Authorization": "Bearer " + v2Token["id_token"],
                "Cache-Control": "no-cache",
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: JSON.stringify({
                "param": {
                    "externalToken": v2Token["id_token"],
                    "refreshToken": v2Token["refresh_token"]
                }
            })
        }, v3TokenCallback);
    }
    
    /**
     * Callback called by the 'request' module with the v3 accessToken.
     */
    function v3TokenCallback(error, httpResponse, body) {
        var customError = null;
        var v3Token = {};
        
        // Log any errors and forward them to the callback
        if (error) {
            customError = new Error('Failed to upgrade v2 accessToken to v3.');
            console.error(customError, error);
            callback(customError);
            return;
        }
        
        // Try to parse the v3 accessToken data from the response body
        try {
            v3Token = JSON.parse(body);
        } catch (e) {
            customError = new Error('Failed to parse v3 accessToken.');
            console.error(customError, e);
            callback(customError);
            return;
        }
        
        // The accessToken value is actually at `v3Token.result.content.token`,
        // so get the value and pass it to the callback in a simpler format
        callback(null, {
            accessToken: _.get(v3Token, 'result.content.token', '')
        });
    }
};


/**
 * Call the TopCoder API to get the list of challenges.
 * 
 * @param {string} accessToken - TopCoder OAuth accessToken
 * @param {Object} options - Options object containing 'filter', 'offset', and 'limit'
 *     properties in the same format expected by the TopCoder API (optional):
 *     https://github.com/cwdcwd/topcoder-api-challenges/blob/master/docs/DefaultApi.md#challengesGet
 * @param {Function} callback - Callback to be called on completion.
 *     On failure, it will be called with:  callback(new Error('ERROR MESSAGE'));
 *     On success, it will be called with:  callback(null, challengesArray);
 */
var fGetChallenges = function(accessToken, options, callback) {
    // Set options to empty object if it was omitted
    options = options || {};
    
    // Call the TopCoder API to get the list of challenges
    TopcoderApi.call('challengesGet', accessToken, options, requestCallback);
    
    /**
     * Callback called when the API responds.
     */
    function requestCallback(error, data, response) {
        var customError = null;
        var challenges = [];
        
        // Log any errors and forward them to the callback
        if (error) {
            customError = new Error('Failed to get list of challenges.');
            console.error(customError, error);
            callback(customError);
            return;
        }
        
        // The challenges array is actually at `data.result.content`
        challenges = _.get(data, 'result.content', []);
        
        // Pass the challenges array to the callback
        callback(null, challenges);
    }
};


/**
 * Call the TopCoder API to create and activate a new challenge.
 * 
 * @param {string} accessToken - TopCoder OAuth accessToken
 * @param {Object} payload - Challenge data in the same format expected by the TopCoder API:
 *     https://github.com/cwdcwd/topcoder-api-challenges/blob/master/docs/DefaultApi.md#saveDraftContest
 * @param {Function} callback - Callback to be called on completion.
 *     On failure, it will be called with:  callback(new Error('ERROR MESSAGE'));
 *     On success, it will be called with:  callback(null, challengeObject);
 */
var fPostChallenge = function(accessToken, payload, callback) {
    // Call the TopCoder API to create the new challenge
    TopcoderApi.call('saveDraftContest', accessToken, payload, creationCallback);
    
    /**
     * Callback called when the API responds to the challenge creation request.
     */
    function creationCallback(error, data, response) {
        var status = 0;
        var reason = '';
        var customError = null;
        var challenge = {};
        
        // Log any errors and forward them to the callback
        if (error) {
            // Get the status code
            status = _.get(response, 'statusCode', 500);
            
            // At this point, `data` would be `null`, so get the body from
            // the response object. Here, `response.body.result.content`
            // should give us the reason for the error (e.g., "jwt expired")
            reason = _.get(response, 'body.result.content', 'no reason given');
            
            // Create a custom error
            customError = new Error('Failed to create new challenge because: ' + reason);
            customError.status = status;
            
            // Log the custom error and pass it to the callback
            console.error(customError, error);
            callback(customError);
            
            // Nothing else can be done
            return;
        }
        
        // Normally, `data.result.content` should give us the challenge object
        challenge = _.get(data, 'result.content', {});
        
        console.log('Succeeded in creating new challenge, ID is: ' + challenge.id);
        
        // Call the TopCoder API to activate the new challenge
        if (challenge.id) {
            console.log('Preparing to activate newly-created challenge.');
            
            TopcoderApi.call('activateChallenge', accessToken, challenge.id, activationCallback);
        }
        
        // Pass the challenge object to the callback
        callback(null, challenge);
    }
    
    /**
     * Callback called when the API responds to the challenge activation request.
     */
    function activationCallback(error, data, response) {
        var status = 0;
        var reason = '';
        var challenge = {};
        
        // Just log any errors. As long as the challenge was created successfully,
        // failing to activate it doesn't really matter, so no need to tell the callback.
        if (error) {
            // Get the status code
            status = _.get(response, 'statusCode', null);
            
            // At this point, `data` would be `null`, so get the body from
            // the response object. Here, `response.body.result.content`
            // should give us the reason for the error (e.g., "jwt expired")
            reason = _.get(response, 'body.result.content', 'no reason given');
            
            // Just log the error
            console.error('Failed to activate new challenge because: ' + reason +
                    ' (status code: ' + status + ')');
            
            // Nothing else can be done
            return;
        }
        
        // Normally, `data.result.content` should give us the challenge object
        challenge = _.get(data, 'result.content', {});
        
        console.log('Succeeded in activating new challenge with ID: ' + challenge.id);
    }
};


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'GLIB mock'
    });
});


/**
 * POST /oauth/access_token - Gets an OAuth accessToken using your TopCoder credentials.
 * 
 * INPUTS:
 * - Request body containing the credentials in the following JSON format (required):
 *   { "username": "YOUR USERNAME HERE", "password": "YOUR PASSWORD HERE" }
 * 
 * OUTPUT: Object in the response body in the following JSON format:
 *         { "accessToken": "YOUR ACCESS TOKEN WILL BE HERE" }
 */
router.post('/oauth/access_token', function(req, res, next) {
    // Get the username and password from the request body
    var body = req.body || {};
    var username = body.username;
    var password = body.password;
    
    // Both username and password are required
    if (!username || !password) {
        res.status(400).json({
            error: 'No username and/or password found in request body.'
        });
        return;
    }
    
    // POST the credentials to the TopCoder API and get an accessToken in return
    fGetAccessToken(username, password, function(error, accessToken) {
        if (error) {
            res.status(500).json({
                error: error.message
            });
            return;
        }
        
        // Send back the accessToken JSON
        res.status(201).json(accessToken);
    });
});


/**
 * GET /challenges - Gets the list of challenges.
 * 
 * INPUTS:
 * - Authorization header with Bearer accessToken (required)
 * - Query parameters in the same format expected by the TopCoder API (optional):
 *   https://github.com/cwdcwd/topcoder-api-challenges/blob/master/docs/DefaultApi.md#challengesGet
 * 
 * OUTPUT: Array of challenges in JSON format in the response body
 */
router.get('/challenges', function(req, res, next) {
    // Get the accessToken from the Authorization header
    var accessToken = req.headers.authorization;
    
    // The accessToken is required
    if (!accessToken) {
        res.status(401).json({
            error: 'No accessToken found in request header.'
        });
        return;
    }
    
    // Remove the 'Bearer ' prefix
    accessToken = accessToken.replace('Bearer ', '');
    
    // Get the options from the query parameters
    var options = req.query || {};
    
    // Call the TopCoder API to get the list of challenges
    fGetChallenges(accessToken, options, function(error, challenges) {
        if (error) {
            res.status(500).json({
                error: error.message
            });
            return;
        }
        
        // Send back the challenge list JSON
        res.status(200).json(challenges);
    });
});


/**
 * POST /challenges - Creates and activates a new challenge.
 * 
 * INPUTS:
 * - Authorization header with Bearer accessToken (required)
 * - Request body containing GitHub issue in JSON format (required):
 *   https://developer.github.com/v3/issues/#get-a-single-issue
 * 
 * OUTPUT: New challenge object in JSON format in the response body
 */
router.post('/challenges', function(req, res, next) {
    // Get the accessToken from the Authorization header
    var accessToken = req.headers.authorization;
    
    // The accessToken is required
    if (!accessToken) {
        res.status(401).json({
            error: 'No accessToken found in request header.'
        });
        return;
    }
    
    // Remove the 'Bearer ' prefix
    accessToken = accessToken.replace('Bearer ', '');
    
    // Convert GitHub issue format into TopCoder challenge format
    var payload = fMassagePayload(req.body);
    
    // Call the TopCoder API to create and activate the new challenge
    fPostChallenge(accessToken, payload, function(error, challenge) {
        if (error) {
            res.status(error.status).json({
                error: error.message
            });
            return;
        }
        
        // Add object properties expected by the GLIB Chrome extension
        challenge.success = true;
        challenge.challengeURL = config.TC_SITE + '/challenge-details/' +
                challenge.id + '/?type=develop&noncache=true';
        
        // Send back the challenge JSON
        res.status(201).json(challenge);
    });
});


module.exports = router;
