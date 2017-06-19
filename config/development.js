/**
 * Configuration values and URLs.
 * 
 * @author TCSDEVELOPER
 * @version 1.0
 * @copyright Copyright (C) 2017, TopCoder, Inc. All rights reserved.
 */

'use strict';

var config = {};

// Client ID used to get TopCoder API v2 access token
config.TC_OAUTH_CLIENT_ID = 'JFDo7HMkf0q2CkVFHojy3zHWafziprhT';

// Endpoint URL to get TopCoder API v2 access token
config.TC_V2_AUTH_URL = 'https://topcoder-dev.auth0.com/oauth/ro';

// Endpoint URL to upgrade v2 token to v3 token
config.TC_V3_AUTH_URL = 'https://api.topcoder-dev.com/v3/authorizations';

// Whether to use the TopCoder 'prod' API or 'dev' API
config.TC_ENV = process.env.TC_ENV || 'dev';

// TopCoder website URL
config.TC_SITE = process.env.TC_SITE || ((config.TC_ENV === 'prod') ?
    'https://www.topcoder.com' : 'https://www.topcoder-dev.com');

module.exports = config;
