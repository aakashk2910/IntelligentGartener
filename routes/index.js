var express = require('express');
var router = express.Router();

//var sensorData = JSON.parse(data);

//console.log(sensorData);


// Load the Cloudant library.
var Cloudant = require('cloudant');

var me = '270d4676-7828-4e22-a88f-2cd83509be50-bluemix'; // Set this to your own account
var password = '2fa835c1a88e237c3219ea76f5eb27ccd966ca1fb2c713701de86e5ce3f8831b';

// Initialize the library with my account.
var cloudant = Cloudant({account: me, password: password});

cloudant.db.list(function (err, allDbs) {
    console.log('All my databases: %s', allDbs.join(', '))
});

var db = cloudant.db.use('iotp_3xowkp_sensordata_2018-01');

  db.list({include_docs:true}, function (err, data) {
      console.log(err, data.toString());
      //var sensorData = JSON.parse(data);
      //console.log(sensorData);
  });

  db.get('doc', function (err, data) {
     console.log(err, data);
      var sensorData = JSON.parse(data);
      console.log(sensorData);
  });


// console.log("Reading document 'doc'");
// db.get('doc', function(err, data) {
//     console.log('Data:', data);
//     // keep a copy of the doc so we know its revision token
//     doc = data;
// });

// read a document
var readDocument = function(callback) {
    console.log("Reading document 'mydoc'");
    db.get('mydoc', function(err, data) {
        console.log('Error:', err);
        console.log('Data:', data);
        // keep a copy of the doc so we know its revision token
        doc = data;
        callback(err, data);
    });
};



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',
      {
        title : 'IG | Dashboard',
        moistureStatus : 'Normal',
        percentMoistureChange : '10%',
        commentMoisture : 'increase in today moisture level.',
        light : '90',
        lightStatus : 'Not required',
        health : '8',
        healthStatus : 'Healthy'
      });
});

router.get('/user', function(req, res, next) {
    res.render('user', {title: 'IG | User'});
});

router.get('/table', function(req, res, next) {
    res.render('table', {title: 'IG | Table'});
});

module.exports = router;
