/**
 * App tests.
 * 
 * @author TCSDEVELOPER
 * @version 1.0
 * @copyright Copyright (C) 2017, TopCoder, Inc. All rights reserved.
 */

'use strict';
require('should');
require('co-mocha');
const _ = require('lodash');
const config = require('config');
const sinon = require('sinon');
const request = require('request');
const server = require('../app');
const supertest = require('promisify-supertest');
const api = supertest(server);
const path = require('path');
const fs = require('fs');
const Test = require('supertest/lib/test');
const TopcoderApi = require('../helpers/topcoder-api.js');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJhZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJwc2hhaDEiLCJleHAiOjI0NjI0OTQ2MTgsInVzZXJJZCI6IjQwMTM1OTc4IiwiaWF0IjoxNDYyNDk0MDE4LCJlbWFpbCI6InBzaGFoMUB0ZXN0LmNvbSIsImp0aSI6ImY0ZTFhNTE0LTg5ODAtNDY0MC04ZWM1LWUzNmUzMWE3ZTg0OSJ9.XuNN7tpMOXvBG1QwWRQROj7NfuUbqhkjwn39Vy4tR5I';

/**
 * This file defines tests methods for routes.
 */
describe('Test routes', () => {
    let sandbox;
    
    beforeEach(function* () {
        sandbox = sinon.sandbox.create();
    });
    afterEach(() => {
        sandbox.restore();
    });
    
    it('GET /', function *() {
        yield api.get('/').expect(200);
    });
    
    it('GET /notexist', function *() {
        yield api.get('/notexist').expect(404);
    });
    
    it('POST /oauth/access_token - without credentials', function *() {
        const res = yield api.post('/oauth/access_token').expect(400).end();
        
        res.body.should.be.eql({
            error: 'No username and/or password found in request body.'
        });
    });
    
    it('POST /oauth/access_token - success', function *() {
        const credentials = {
            "username": "tonyj",
            "password": "appirio123"
        };
        
        sandbox.stub(request, 'post')
            .onFirstCall().yields(null, null, JSON.stringify({
                "refresh_token": "",
                "id_token": "",
                "access_token": "",
                "token_type": ""
            }))
            .onSecondCall().yields(null, null, JSON.stringify({
                result: {
                    content: {
                        token: 'TOKEN'
                    }
                }
            }));
        
        const res = yield api.post('/oauth/access_token')
                .send(credentials).expect(201).end();
        
        res.body.should.have.property('accessToken').which.is.a.String();
    });
    
    it('GET /challenges - without accessToken', function *() {
        const res = yield api.get('/challenges').expect(401).end();
        
        res.body.should.be.eql({
            error: 'No accessToken found in request header.'
        });
    });
    
    it('GET /challenges - success', function *() {
        sandbox.stub(TopcoderApi, 'call').yields(null, {
            result: {
                content: [
                    { id: 1 },
                    { id: 2 },
                    { id: 3 }
                ]
            }
        }, null);
        
        const res = yield api.get('/challenges')
                .set('Authorization', 'Bearer ' + token)
                .expect(200).end();
        
        res.body.should.be.an.Array();
    });
    
    it('POST /challenges - without accessToken', function *() {
        const res = yield api.post('/challenges').expect(401).end();
        
        res.body.should.be.eql({
            error: 'No accessToken found in request header.'
        });
    });
    
    it('POST /challenges - success', function *() {
        const githubIssue = {};
        
        sandbox.stub(TopcoderApi, 'call')
            .onFirstCall().yields(null, {
                result: {
                    content: {
                        id: 1
                    }
                }
            }, null)
            .onSecondCall().yields(null, {
                result: {
                    content: {
                        id: 1
                    }
                }
            }, null);
        
        const res = yield api.post('/challenges')
                .set('Authorization', 'Bearer ' + token)
                .send(githubIssue)
                .expect(201).end();
        
        res.body.should.have.property('id').which.is.a.Number();
    });
    
    
    // Old tests for reference
    
//    it('POST /challenges with invalid body', function *() {
//      sandbox.stub(request, 'post').yields(null, null, validBody);
//      const res =yield api.post('/challenges')
//        .set('authorization', token)
//        .send(validBody).expect(200).end();
//      res.body.should.be.eql({
//        error: validBody
//      });
//    });
//
//    it('POST /challenges with accessToken', function *() {
//      sandbox.stub(request, 'post').yields(new Error('Test error'), null, errorBody);
//       yield api.post('/challenges').set('authorization', 'wrong').expect(500).end();
//    });
//    it('POST /challenges with valid accessToken and error', function *() {
//      sandbox.stub(request, 'post').yields(new Error('Test error'), null, JSON.stringify(errorBody));
//      const res = yield api.post('/challenges').set('authorization', token).expect(500).end();
//      res.body.should.be.eql(errorBody);
//    });
//
//    it('POST /challenges with valid accessToken and no error', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(validBody));
//      const res = yield api.post('/challenges').set('authorization', token).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL');
//    });
//
//    it('POST /oauth/accestoken with error', function *() {
//      sandbox.stub(request, 'post').yields(new Error('Test error'), null,errorBody);
//      const res = yield api.post('/oauth/access_token').expect(500).end();
//      res.body.should.be.eql(errorBody);
//    });
//    it('POST /challenges with prize in title', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({projectId: '30054534'},validBody)));
//      const res = yield api.post('/challenges')
//        .set('authorization', token)
//        .send({
//          title: '[$500/$250] Winterschlaefer cross vendor restore'
//        }).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
//    });
//
//    it('POST /challenges for F2F', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
//        projectId: '30054534'
//      },validBody)));
//      const res = yield api.post('/challenges')
//        .set('authorization', token)
//        .send({
//          number:'1',
//          html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
//          title: '[$500] Winterschlaefer cross vendor restore',
//          body: fs.readFileSync(path.join(__dirname, './1.md'), 'utf-8')
//        }).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
//    });
//
//    it('POST /challenges for F2F with no submission guides', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
//        projectId: '30054534'
//      },validBody)));
//      const res = yield api.post('/challenges')
//        .set('authorization', token)
//        .send({
//          number:'1',
//          html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
//          title: '[$500] Winterschlaefer cross vendor restore',
//          body: 'empty'
//        }).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
//    });
//
//    it('POST /challenges for F2F with Repository', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
//        projectId: '30054534'
//      },validBody)));
//      const res = yield api.post('/challenges')
//        .set('authorization', token)
//        .send({
//          number:'1',
//          html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
//          title: '[$500] Winterschlaefer cross vendor restore',
//          body: fs.readFileSync(path.join(__dirname, './2.md'), 'utf-8')
//        }).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
//    });
//
//    it('POST /challenges for F2F with Repository only', function *() {
//      sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
//        projectId: '30054534'
//      },validBody)));
//      const res = yield api.post('/challenges')
//        .set('authorization', token)
//        .send({
//          number:'1',
//          html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
//          title: '[$500] Winterschlaefer cross vendor restore',
//          body: fs.readFileSync(path.join(__dirname, './3.md'), 'utf-8')
//        }).expect(200).end();
//      res.body.should.property('test', 'OK');
//      res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
//    });
//
//    it('POST /oauth/access_token without error', function *() {
//      sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
//      const res = yield api.post('/oauth/access_token').expect(200).end();
//      res.body.should.property('test', 'OK');
//    });
//    it('POST /oauth/access_token with x_auth_username and x_auth_password', function *() {
//      sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
//      const res = yield api
//        .post('/oauth/access_token')
//        .send({
//          x_auth_username:'user',
//          x_auth_password:'pass'
//        })
//        .expect(200).end();
//      res.body.should.property('test', 'OK');
//    });
});
