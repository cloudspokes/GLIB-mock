# GLIB Mock Update
Deployment Guide

For easier viewing, please copy the contents of this file and paste into 
this Markdown Editor: https://jbt.github.io/markdown-editor/ .


### Description

This code has been updated in submission to this challenge: 
https://www.topcoder.com/challenge-details/30057735/?type=develop .

Most of the changes are in `routes/index.js`, but changes have also been made 
elsewhere as well, including the addition of the `helpers/topcoder-api.js` file.


## Prerequisites

1. Node v4.4+
2. NPM


## Configuration

Configuration values and URLs can be found in `config/development.js`. For more info about 
these values, see: https://apps.topcoder.com/forums/?module=Thread&threadID=901747&start=0 .


## Local Deployment

First, install dependencies by running:

```
npm install
```

Now, for testing, we need to use the TopCoder dev API, but the `topcoder-api-challenges` 
module is hard-coded to use the production API instead. For more info, see: 
https://apps.topcoder.com/forums/?module=Thread&threadID=901723&start=15&mc=20#2196881 .

So, once all dependencies are installed, you will need to edit the `topcoder-api-challenges` 
module code manually to use the dev API domain:

1. Open the file `node_modules/topcoder-api-challenges/src/ApiClient.js` in a text editor.
2. Go to Line 29.
3. Replace the URL `http://api.topcoder.com/v3` with `https://api.topcoder-dev.com/v3`.
4. Save the file.

After that, you can start the app by running:

```
npm start
```

Next, open `http://localhost:3000/` in a web browser. If all goes well, you should see 
a simple web page with "GLIB mock" followed by "Welcome to the GLIB mock endpoint". 
You must not occupy port 3000 to test successfully.


## Heroku Deployment

As described above in the section titled "Local Deployment", the `topcoder-api-challenges` 
module code must be edited manually to use the TopCoder dev API domain. However, once you 
do that and deploy the app to Heroku, Heroku will run `npm install` and overwrite your 
changes to the `topcoder-api-challenges` module. Therefore, you need to:

1. Edit the `topcoder-api-challenges` module as described above in section "Local Deployment".
2. Copy the `topcoder-api-challenges` folder from the `node_modules` folder 
   into a new folder named `node_modules_static`.
3. Edit the `helpers/topcoder-api.js` file to refer to the new module location. 
   At the top, on Line 11, replace `require('topcoder-api-challenges')` with 
   `require('../node_modules_static/topcoder-api-challenges')` and save the file.

Once you do that, you're ready to deploy to Heroku. To do so, please follow these steps: 
https://devcenter.heroku.com/articles/getting-started-with-nodejs . 
The `Procfile` and `app.json` files are already configured.


## Production Build and Installation

### Manual Deployment Notes

To use the TopCoder production API rather than the dev API:

1. Edit the `topcoder-api-challenges` module code as described above 
   in the section titled "Local Deployment", except this time, 
   put the production URL `http://api.topcoder.com/v3` back in.

2. Then, open `config/development.js` in a text editor and edit the values 
   as appropriate to match TopCoder's production API.

3. Finally, set the `TC_ENV` environment variable to `prod` before starting the app. 
   Locally, this can be done by running `TC_ENV=prod npm start` at the command prompt. 
   For Heroku, this can be done by editing the `app.json` file and adding the 
   entry `"TC_ENV": { "value": "prod" }` to the "env" object.


## Running Tests

Originally, this GLIB mock is meant to be tested with the 
[GLIB Chrome Extension](https://github.com/cloudspokes/GLIB-ChromeExt).
However, the way the GLIB Chrome extension currently gets the access token makes it incompatible 
with the GLIB mock. Therefore, the copilot agreed to "remove the requirement to test with the 
Chrome extension" for this challenge. For more info, see: 
https://apps.topcoder.com/forums/?module=Thread&threadID=901741&start=0 .


### Postman

So to test this GLIB mock code, please install and use 
[Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en). 
For your convenience, I have provided the Postman collection file.

Simply open Postman, click "Import" at the top left, and select the 
`postman/GLIB-Mock-Test.postman_collection.json` file to import the collection. This will give 
you pre-made requests (in the left sidebar) that you can send to test the GLIB mock endpoints.

First, make a request to "Get Access Token". When the response arrives, copy the token value. 
Next, when you want to "Get List of Challenges" or "Create New Challenge", first paste the token 
into the `Authorization` header after the `Bearer ` string (replacing the old existing token) 
and then click the blue "Send" button. Afterwards, see the "Usage" section below for endpoint 
inputs/outputs and modify the request parameters/headers/body as you want.

#### Important Notes

- For some reason, the access tokens from the TopCoder API expire very quickly. 
  So if you get the error `Failed to create new challenge because: jwt expired`, 
  then please get another access token and try again with the new token.

- If the request seems to take too long to respond, go to the command prompt where 
  you started the app and try to press the space bar (or any other key). 
  For some reason, that helps move it along sometimes...

- When you "Create New Challenge", you may see the error message `Failed to activate new 
  challenge because: Billing/PO Number is null/empty. (status code: 500)` in the console. 
  This means the challenge was created successfully, but failed to be activated properly. 
  Please disregard this error, as per copilot consent: 
  https://apps.topcoder.com/forums/?module=Thread&threadID=901816&start=0 .


### Unit Tests

You can run the unit tests by running:

```
npm test
npm run coverage
```


## Usage

The GLIB mock now provides three endpoints:

- `POST /oauth/access_token` - Gets an OAuth access token using your TopCoder credentials.
- `GET /challenges` - Gets a list of challenges.
- `POST /challenges` - Creates and activates a new challenge.


### Getting an Access Token

Before you do anything else, you need to get an access token by calling the 
`POST /oauth/access_token` endpoint. Your request body should contain your 
TopCoder credentials in the following JSON format:

```
{
  "username": "YOUR USERNAME HERE",
  "password": "YOUR PASSWORD HERE"
}
```

If you're using the TopCoder dev API, you can simply use the following dummy credentials:

```
{
  "username": "tonyj",
  "password": "appirio123"
}
```

On success, the GLIB mock will return status code 201. The response body will contain 
the access token in this JSON format:

```
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJhZG1pbmlzdHJhdG9yIiwiQ29ubmVjdCBTdXBwb3J0IiwiVG9wY29kZXIgVXNlciIsIkNvbm5lY3QgTWFuYWdlciIsIldlbmRlbGxSb2xlIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJUb255SiIsImV4cCI6MTQ5NTYwMzg1MSwidXNlcklkIjoiODU0Nzg5OSIsImlhdCI6MTQ5NTYwMzI1MSwiZW1haWwiOiJ0amVmdHMrZGV2QHRvcGNvZGVyLmNvbSIsImp0aSI6ImVlMTk0ZTI1LTY1ZWYtNDJmMy05NDVhLWQ2Y2FhZWIwYTk2YiJ9.rrKrc_6eeZFAUKG6PxeWcLwjtiPN380CHwVYbzKBdk0"
}
```

Copy the value of the access token, as you will use it to call the other endpoints.


### Getting a List of Challenges

To get a list of TopCoder challenges, call the `GET /challenges` endpoint. 
Your request should contain the `Authorization` header set to the string `Bearer`, 
followed by a single space, followed by the value of your access token.

Optionally, you can also include query parameters in the 
[same format expected by the TopCoder API](https://github.com/cwdcwd/topcoder-api-challenges/blob/master/docs/DefaultApi.md#challengesGet). 
For example, to limit the list to five challenges, simply call `GET /challenges?limit=5`.

On success, the GLIB mock will return status code 200. The response body will contain 
the array of challenges in this JSON format:

```
[
  {
    "updatedAt": "2016-09-15T11:20Z",
    "createdAt": "2016-09-15T11:18Z",
    "createdBy": "40152643",
    "updatedBy": "40152643",
    "technologies": "ActionScript",
    "status": "ACTIVE",
    "track": "DEVELOP",
    "subTrack": "FIRST_2_FINISH",
    "name": "Foo dev 2",
    "reviewType": "INTERNAL",
    "id": 30050440,
    "forumId": 29250,
    "numSubmissions": 2,
    "numRegistrants": 3,
    "registrationStartDate": "2016-09-15T11:20:35.250Z",
    "registrationEndDate": "2017-10-15T11:20:00.000Z",
    "submissionEndDate": "2017-10-15T11:20:00.000Z",
    "platforms": "Brivo Labs",
    "totalPrize": 800,
    "isPrivate": false,
    "upcomingPhase": {
      "challengeId": 30050440,
      "id": 741468,
      "phaseType": "Iterative Review",
      "phaseStatus": "Scheduled",
      "scheduledStartTime": "2016-09-15T11:25Z",
      "scheduledEndTime": "2016-09-16T11:25Z",
      "duration": 86400000,
      "updatedAt": "2016-09-15T07:20Z",
      "createdAt": "2016-09-15T07:18Z",
      "createdBy": "40152643",
      "updatedBy": "40152643"
    },
    "projectId": 9043,
    "projectName": "foo3",
    "currentPhases": [
      ...
    ],
    "allPhases": [
      ...
    ],
    "prizes": [
      800
    ],
    "reliabilityBonus": 160,
    "isTask": false
  },
  ...
]
```


### Creating and Activating a New Challenge

To create (and activate) a new TopCoder challenge, call the `POST /challenges` endpoint. 
Your request should contain the `Authorization` header set to the string `Bearer`, 
followed by a single space, followed by the value of your access token.

Meanwhile, your request body should contain the 
[GitHub issue in JSON format](https://developer.github.com/v3/issues/#get-a-single-issue). 
For testing, you can use the following example JSON:

```
{
  "id": 1,
  "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
  "repository_url": "https://api.github.com/repos/octocat/Hello-World",
  "labels_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/labels{/name}",
  "comments_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/comments",
  "events_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/events",
  "html_url": "https://github.com/octocat/Hello-World/issues/1347",
  "number": 1347,
  "state": "open",
  "title": "Found a bug",
  "body": "I'm having a problem with this.",
  "user": {
    "login": "octocat",
    "id": 1,
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
    "gravatar_id": "",
    "url": "https://api.github.com/users/octocat",
    "html_url": "https://github.com/octocat",
    "followers_url": "https://api.github.com/users/octocat/followers",
    "following_url": "https://api.github.com/users/octocat/following{/other_user}",
    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
    "organizations_url": "https://api.github.com/users/octocat/orgs",
    "repos_url": "https://api.github.com/users/octocat/repos",
    "events_url": "https://api.github.com/users/octocat/events{/privacy}",
    "received_events_url": "https://api.github.com/users/octocat/received_events",
    "type": "User",
    "site_admin": false
  },
  "labels": [
    {
      "id": 208045946,
      "url": "https://api.github.com/repos/octocat/Hello-World/labels/bug",
      "name": "bug",
      "color": "f29513",
      "default": true
    }
  ],
  "assignee": {},
  "milestone": {},
  "locked": false,
  "comments": 0,
  "pull_request": {
    "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
    "html_url": "https://github.com/octocat/Hello-World/pull/1347",
    "diff_url": "https://github.com/octocat/Hello-World/pull/1347.diff",
    "patch_url": "https://github.com/octocat/Hello-World/pull/1347.patch"
  },
  "closed_at": null,
  "created_at": "2011-04-22T13:33:48Z",
  "updated_at": "2011-04-22T13:33:48Z",
  "closed_by": {}
}
```

On success, the GLIB mock will return status code 201. The response body will contain 
the newly-created challenge in this JSON format:

```
{
  "id": 30050770,
  "confidentialityType": "public",
  "technologies": [],
  "subTrack": "CODE",
  "name": "Found a bug",
  "reviewType": "COMMUNITY",
  "milestoneId": 0,
  "detailedRequirements": "<p>I'm having a problem with this.</p>\n<h4>Source: <a href=\"https://github.com/octocat/Hello-World/issues/1347\">Github Issue #1347</a></h4>\n",
  "submissionGuidelines": "<p>Ensure good test coverage on all modules\nUpload documentation for how to run your submission\nUpload all your source code as a zip for review\nWinner will be required to submit a pull request with their winning code.</p>\n",
  "registrationStartsAt": "2017-05-24T06:26:25.013Z",
  "registrationEndsAt": "2017-05-31T06:26:00.000Z",
  "submissionEndsAt": "2017-05-31T06:26:00.000Z",
  "platforms": [],
  "numberOfCheckpointPrizes": 0,
  "checkpointPrize": 0,
  "finalDeliverableTypes": [],
  "prizes": [],
  "projectId": 10139,
  "submissionVisibility": false,
  "maxNumOfSubmissions": 0,
  "assignees": [],
  "success": true,
  "challengeURL": "https://www.topcoder-dev.com/challenge-details/30050770/?type=develop&noncache=true"
}
```


### Handling Errors

When an error occurs, all endpoints return an appropriate status code 
along with a response body in this simple JSON format:

```
{
  "error": "ERROR MESSAGE HERE" 
}
```

