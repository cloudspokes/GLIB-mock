/**
 * Challenge model used to post a new challenge to the TopCoder API.
 * 
 * @author TCSDEVELOPER
 * @version 1.0
 * @copyright Copyright (C) 2017, TopCoder, Inc. All rights reserved.
 */

'use strict';

var _ = require('lodash');

var defaultChallenge = {
    "confidentialityType": "public",
    "technologies": [],
    "subTrack": "CODE",
    "name": "Challenge Name",
    "reviewType": "COMMUNITY",
    "detailedRequirements": "These are the requirements.",
    "submissionGuidelines": "- Ensure good test coverage on all modules\n- Upload documentation for how to run your submission\n- Upload all your source code as a zip for review\n- Winner will be required to submit a pull request with their winning code.",
    "platforms": [],
    "finalDeliverableTypes": [],
    "prizes": [],
    "assignees": [],
    "failedRegisterUsers": []
};

module.exports = function() {
    return _.cloneDeep(defaultChallenge);
};
