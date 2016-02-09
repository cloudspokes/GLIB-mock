var express = require('express');
var router = express.Router();
var config = require('config');
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'GLIB mock'
    });
});

router.post('/', function(req, res, next) {
    console.log('posting to: ', config.APIURL_BASE + config.APIURL_CHALLENGE);
    console.log(req.body);

    res.json({
        success: true,
        challengeURL: 'http://topcoder.com',
        createdDate: new Date()
    });
    /*
        request.post(config.APIURL_BASE + config.APIURL_CHALLENGE, {
            form: req.body,
            function(err, httpResponse, body) {
                if (err) {
                    console.log(err);
                    res.state(500).json(body);
                } else {
                    console.log(body);
                    res.json(body);
                }
            }
        });
    */
});


module.exports = router;
