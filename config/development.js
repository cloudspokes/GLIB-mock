'use strict';

var config = {};

config.XAPIKEY = process.env.XAPIKEY || '';
config.APIURL_BASE = process.env.APIURL_BASE || 'https://xsmjngybcg.execute-api.us-east-1.amazonaws.com';
config.APIURL_CHALLENGE = process.env.APIURL_CHALLENGE || '/dev/v3/challenges';
config.APIURL_OAUTHACCESS = process.env.APIURL_OAUTHACCESS || '/dev/v3/oauth/access_token';
config.SELFURL = process.env.SELFURL || 'http://127.0.0.1:3000';
config.TC_ENV = process.env.TC_ENV || 'dev';
config.TC_SITE = process.env.TC_SITE || ((config.TC_ENV === 'prod') ? 'https://www.topcoder.com' :
    'https://www.topcoder-dev.com');

module.exports = config;
