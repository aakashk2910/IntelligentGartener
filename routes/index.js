var express = require('express');
var router = express.Router();

//var sensorData = JSON.parse(data);

//console.log(sensorData);

var datetime = require('node-datetime');
// Load the Cloudant library.
var Cloudant = require('cloudant');

var me = '270d4676-7828-4e22-a88f-2cd83509be50-bluemix'; // Set this to your own account
var password = '2fa835c1a88e237c3219ea76f5eb27ccd966ca1fb2c713701de86e5ce3f8831b';

// Initialize the library with my account.
var cloudant = Cloudant({account: me, password: password});

cloudant.db.list(function (err, allDbs) {
    if(allDbs){
        console.log('All my databases: %s', allDbs.join(', '));
    }else {
        console.log(err);
    }

});
var time;
var soil;
var light;

var db = cloudant.db.use('iotp_3xowkp_sensordata_2018-01');

  db.list({include_docs:true}, function (err, data) {
      if(data){
          for(var i=2; i< data.total_rows; i++) {
              console.log(datetime.create(data.rows[i].doc.timestamp).format('H:M:S'));
              console.log(data.rows[i].doc.data.d.soil);
              console.log(data.rows[i].doc.data.d.light);

              console.log("-----");

          }
          time = datetime.create(data.rows[2].doc.timestamp).format('m/d/Y H:M:S');
          soil = data.rows[2].doc.data.d.soil;
          light = data.rows[2].doc.data.d.light;

      }else{
          console.log(err);
      }
      //var sensorData = JSON.parse(data);
      //console.log(sensorData);
  });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',
      {
        title : 'IG | Dashboard',
        moistureStatus : 'Normal',
        moisture : soil,
        percentMoistureChange : '10%',
        commentMoisture : 'increase in today moisture level.',
        light : light,
        lightStatus : 'Not required',
        health : '8',
        healthStatus : 'Healthy',
        time : time
      });
});

router.get('/user', function(req, res, next) {
    res.render('user', {title: 'IG | User'});
});

router.get('/table', function(req, res, next) {
    res.render('table', {title: 'IG | Table'});
});

module.exports = router;
