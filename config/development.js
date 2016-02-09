'use strict';

var config = {};

config.XAPIKEY = process.env.XAPIKEY || '';
config.APIURL_BASE = process.env.APIURL_BASE || 'https://xsmjngybcg.execute-api.us-east-1.amazonaws.com';
config.APIURL_CHALLENGE = process.env.APIURL_CHALLENGE || '/dev/v3/challenges';

module.exports = config;
