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
const  path= require('path');
const fs =require('fs');
const Test = require('supertest/lib/test');
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJhZG1pbmlzdHJhdG9yIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJwc2hhaDEiLCJleHAiOjI0NjI0OTQ2MTgsInVzZXJJZCI6IjQwMTM1OTc4IiwiaWF0IjoxNDYyNDk0MDE4LCJlbWFpbCI6InBzaGFoMUB0ZXN0LmNvbSIsImp0aSI6ImY0ZTFhNTE0LTg5ODAtNDY0MC04ZWM1LWUzNmUzMWE3ZTg0OSJ9.XuNN7tpMOXvBG1QwWRQROj7NfuUbqhkjwn39Vy4tR5I';
/**
 * This file defines tests methods for routes.
 */
describe('Test routes', () => {
  let sandbox;
  const errorBody = {'message':'error'} ;
  const validBody ={test:'OK'};
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

  it('GET /challenges-santosh  error', function *() {
    sandbox.stub(request, 'get').yields(new Error('Test error'), null, errorBody);
    const res =  yield api.get('/challenges-santosh').expect(500).end();
    res.body.should.be.eql(errorBody);
  });

  it('GET /challenges-santosh with error', function *() {
    sandbox.stub(request, 'get').yields(null, null, validBody);
    const res =  yield api.get('/challenges-santosh').expect(500).end();
  });

  it('GET /challenges-santosh without error', function *() {
    sandbox.stub(request, 'get').yields(null, null, JSON.stringify(validBody));
    const res =  yield api.get('/challenges-santosh').expect(200).end();
    res.body.should.property('test', 'OK');
  });

  it('POST /', function *() {
    const res = yield api.post('/').expect(200);
    res.body.should.property('success', true);
    res.body.should.property('challengeURL', 'http://topcoder.com');
    res.body.should.property('createdDate');
  });

  it('POST /challenges without accessToken', function *() {
    const res = yield api.post('/challenges').expect(500).end();
    res.body.should.be.eql({
      err: 'no accessToken present'
    });
  });

  it('POST /challenges with invalid body', function *() {
    sandbox.stub(request, 'post').yields(null, null, validBody);
    const res =yield api.post('/challenges')
      .set('authorization', token)
      .send(validBody).expect(200).end();
    res.body.should.be.eql({
      error: validBody
    });
  });

  it('POST /challenges with accessToken', function *() {
    sandbox.stub(request, 'post').yields(new Error('Test error'), null, errorBody);
     yield api.post('/challenges').set('authorization', 'wrong').expect(500).end();
  });
  it('POST /challenges with valid accessToken and error', function *() {
    sandbox.stub(request, 'post').yields(new Error('Test error'), null, JSON.stringify(errorBody));
    const res = yield api.post('/challenges').set('authorization', token).expect(500).end();
    res.body.should.be.eql(errorBody);
  });

  it('POST /challenges with valid accessToken and no error', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(validBody));
    const res = yield api.post('/challenges').set('authorization', token).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL');
  });

  it('POST /oauth/accestoken with error', function *() {
    sandbox.stub(request, 'post').yields(new Error('Test error'), null,errorBody);
    const res = yield api.post('/oauth/access_token').expect(500).end();
    res.body.should.be.eql(errorBody);
  });
  it('POST /challenges with prize in title', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({projectId: '30054534'},validBody)));
    const res = yield api.post('/challenges')
      .set('authorization', token)
      .send({
        title: '[$500/$250] Winterschlaefer cross vendor restore'
      }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });

  it('POST /challenges for F2F', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
      projectId: '30054534'
    },validBody)));
    const res = yield api.post('/challenges')
      .set('authorization', token)
      .send({
        number:'1',
        html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
        title: '[$500] Winterschlaefer cross vendor restore',
        body: fs.readFileSync(path.join(__dirname, './1.md'), 'utf-8')
      }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });

  it('POST /challenges for F2F with no submission guides', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
      projectId: '30054534'
    },validBody)));
    const res = yield api.post('/challenges')
      .set('authorization', token)
      .send({
        number:'1',
        html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
        title: '[$500] Winterschlaefer cross vendor restore',
        body: 'empty'
      }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });

  it('POST /challenges for F2F with Repository', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
      projectId: '30054534'
    },validBody)));
    const res = yield api.post('/challenges')
      .set('authorization', token)
      .send({
        number:'1',
        html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
        title: '[$500] Winterschlaefer cross vendor restore',
        body: fs.readFileSync(path.join(__dirname, './2.md'), 'utf-8')
      }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });

  it('POST /challenges for F2F with Repository only', function *() {
    sandbox.stub(request, 'post').yields(null, null, JSON.stringify(_.extend({
      projectId: '30054534'
    },validBody)));
    const res = yield api.post('/challenges')
      .set('authorization', token)
      .send({
        number:'1',
        html_url:'https://github.com/cloudspokes/GLIB-ChromeExt',
        title: '[$500] Winterschlaefer cross vendor restore',
        body: fs.readFileSync(path.join(__dirname, './3.md'), 'utf-8')
      }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });

  it('POST /oauth/access_token without error', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
    const res = yield api.post('/oauth/access_token').expect(200).end();
    res.body.should.property('test', 'OK');
  });
  it('POST /oauth/access_token with x_auth_username and x_auth_password', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
    const res = yield api
      .post('/oauth/access_token')
      .send({
        x_auth_username:'user',
        x_auth_password:'pass'
      })
      .expect(200).end();
    res.body.should.property('test', 'OK');
  });

  it('POST /challenges-santosh without token and exist error1', function *() {
    sandbox.stub(request, 'post').yields(new Error('Test error'), null,errorBody);
    const res = yield api.post('/challenges-santosh').expect(500).end();
    res.body.should.be.eql(errorBody);
  });

  it('POST /challenges-santosh without token and error2', function *() {
    const stub = sandbox.stub(request, 'post');
    stub.onCall(0).yields(null, null,JSON.stringify({
      x_auth_access_token: token
    }));
    stub.onCall(1).yields(new Error('Test error'), null,errorBody);
    const res = yield api.post('/challenges-santosh').expect(500).end();
    res.body.should.be.eql(errorBody);
  });

  it('POST /challenges-santosh without token and invald body', function *() {
    const stub = sandbox.stub(request, 'post');
    stub.onCall(0).yields(null, null,JSON.stringify({
      x_auth_access_token: token
    }));
    stub.onCall(1).yields(null, null,validBody);
    const res = yield api.post('/challenges-santosh').expect(200).end();
    res.body.should.be.eql({
      error: validBody
    });
  });

  it('POST /challenges-santosh without token and no error', function *() {
    const stub = sandbox.stub(request, 'post');
    stub.onCall(0).yields(null, null,JSON.stringify({
      x_auth_access_token: token
    }));
    stub.onCall(1).yields(null, null,JSON.stringify(validBody));
    const res = yield api.post('/challenges-santosh').expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('success', true);
    res.body.should.property('challengeURL');
  });

  it('POST /challenges-santosh with token', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
    const res = yield api.post('/challenges-santosh').set('x-auth-access-token', token).send({
      title: 'title',
      tc_project_id:'6370',
      registrationStartDate:'2016-02-16T17:53:03+00:00'

    }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('success', true);
    res.body.should.property('challengeURL');
  });

  it('POST /challenges-santosh with x_auth_username and x_auth_password', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(validBody));
    const res = yield api.post('/challenges-santosh').send({
      title: 'title',
      tc_project_id:'6370',
      registrationStartDate:'2016-02-16T17:53:03+00:00',
      x_auth_username:'user',
      x_auth_password:'pass'
    }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('success', true);
    res.body.should.property('challengeURL');
  });


  it('POST /challenges-santosh for f2f', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(_.extend({id: '30053654'},validBody)));
    const res = yield api.post('/challenges-santosh').send({
      title: '[$80] Dinnaco - iXBRL Document Viewer UI Prototype F2F Challenge II'
    }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('success', true);
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30053654/?type=develop&noncache=true');
  });

  it('POST /challenges-santosh with prize in title', function *() {
    sandbox.stub(request, 'post').yields(null, null,JSON.stringify(_.extend({id: '30054534'},validBody)));
    const res = yield api.post('/challenges-santosh').send({
      title: '[$500/$250] Winterschlaefer cross vendor restore'
    }).expect(200).end();
    res.body.should.property('test', 'OK');
    res.body.should.property('success', true);
    res.body.should.property('challengeURL', 'https://www.topcoder-dev.com/challenge-details/30054534/?type=develop&noncache=true');
  });
});
