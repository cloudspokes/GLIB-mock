/**
 * TopCoder API helper.
 * 
 * @author TCSDEVELOPER
 * @version 1.0
 * @copyright Copyright (C) 2017, TopCoder, Inc. All rights reserved.
 */

'use strict';

var ApChallengeMicroservice = require('topcoder-api-challenges');

var TopcoderApi = {
    call: call
};

/**
 * Make a call to the TopCoder API. You should pass in the API method name and the
 * accessToken, followed by the parameters that the API endpoint expects. For example:
 * 
 *     TopcoderApi.call('challengesGet', 'ACCESS TOKEN HERE', options, callback);
 *     TopcoderApi.call('saveDraftContest', 'ACCESS TOKEN HERE', body, callback);
 *     TopcoderApi.call('activateChallenge', 'ACCESS TOKEN HERE', id, callback);
 * 
 * @param {String} method - name of the API method to call, e.g., 'challengesGet'.
 *     For a full list of available methods, see:
 *     https://www.npmjs.com/package/topcoder-api-challenges#documentation-for-api-endpoints
 * @param {String} accessToken - OAuth accessToken string.
 * @param The remaining arguments should be parameters to pass to the API method.
 *     Each API method expects different parameters. For more info, see:
 *     https://www.npmjs.com/package/topcoder-api-challenges#documentation-for-api-endpoints
 */
function call(method, accessToken) {
    // Get the remaining arguments, which are the parameters to pass to the API endpoint
    var parameters = Array.prototype.slice.call(arguments, 2);
    
    // Get the TopCoder API client
    var defaultClient = ApChallengeMicroservice.ApiClient.instance;
    
    // Configure API key Authorization: Bearer
    var bearer = defaultClient.authentications['bearer'];
    bearer.apiKey = accessToken;
    bearer.apiKeyPrefix = 'Bearer';
    
    // Call the TopCoder API method/endpoint
    var api = new ApChallengeMicroservice.DefaultApi();
    api[method].apply(api, parameters);
}

module.exports = TopcoderApi;
