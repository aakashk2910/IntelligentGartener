var express = require('express');
var router = express.Router();

var nodeSchedule = require("node-schedule")

var util = require('util');

var sleep = require('sleep');

// Soil Type json with the min and max water percent
var decision ="";

var schedule = require('node-schedule');

var regression = require('regression')

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

  var soilTypeObject = {"soilType":
  [{"type":"sand","fieldCapacity":"12", "wiltingPoint":"5"  },
    {"type":"sandyLoam","fieldCapacity":"16", "wiltingPoint":"6"  },
    {"type":"loam","fieldCapacity":"25", "wiltingPoint":"10"  },
    {"type":"slitLoam","fieldCapacity":"32", "wiltingPoint":"14"  },
    {"type":"clayLoam","fieldCapacity":"38", "wiltingPoint":"20"  },
    {"type":"slityClay","fieldCapacity":"40", "wiltingPoint":"26"  },
    {"type":"clay","fieldCapacity":"43", "wiltingPoint":"30"  }]};

var time;
var soil;
var light;

var moistureReading = [];
var sensorReadingTime = [];
var lightReading = [];

//var test = [];

var Forecast = require('forecast');

// Initialize
var forecast = new Forecast({
  service: 'darksky',
  key: 'f62d609f3f2e23d60813eb10b736894d',
  units: 'celcius',
  cache: true,      // Cache API requests
  ttl: {            // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
    minutes: 27,
    seconds: 45
  }
});

// Retrieve weather information from coordinates (Munich, Germany)
forecast.get([48.1351, 11.5820], function(err, weather) {
  if(err) return console.dir(err);
  //console.dir(weather);
});

  var dataForML = [];


var db = cloudant.db.use('iotp_3xowkp_sensordata_2018-01');

 db.find({
   "selector": {
      "_id": {
         "$gt": "0"
      }
   },
   "fields": [
      "_id",
      "data",
      "eventType",
      "timestamp"
   ],
   "sort": [
      {
         "timestamp": "desc"
      }
   ],
   "limit": 50
},
   function (err, data) {
      var originalData = [];
      console.log(data);
      if(data){
          var count=0;
          for(var i=0; count<20 && i < data.docs.length;i++) {
              if(data.docs[i]){
                  if(data.docs[i].eventType=='event' && data.docs[i].data.d != null ){
                    if(count<10){
                      moistureReading.push((data.docs[i].data.d.soil / 1024) * 100);
                      lightReading.push((data.docs[i].data.d.light /1024) * 100 );
                      sensorReadingTime.push(datetime.create(data.docs[i].timestamp).format('M'));
                    }
                    if(data.docs[i].data.d.soil ){
                      //console.log((data.rows[i].doc.data.d.soil /1024) * 100 );
                      dataForML.push([count+1,((data.docs[i].data.d.soil /1024) * 100 )])
                      originalData.push([count+1,((data.docs[i].data.d.soil ) )]);
                      count++;
                    }
                  }
              }
          }
          time = datetime.create(data.docs[2].timestamp).format('m/d/Y H:M:S');
          if(data.docs[2].data.d!=null){
            soil = data.docs[2].data.d.soil;
            light = data.docs[2].data.d.light;
          }
          
          //var test =[[1, 1], [2, 67], [3, 79], [4, 127], [5, 100], [6, 96], [7, 80], [8, 69], [9, 60]];

         // console.log('input data to regression --- '+ dataForML);
         // console.log('model: '+util.inspect(regression.polynomial(dataForML, {order : 1}), false, null));
          console.log(decide());


      }else{
          console.log(err);
      }

      //var sensorData = JSON.parse(data);
      //console.log(sensorData);
  });


function decide(){
  
   dataForML = [];
   moistureReading = [];
  lightReading = [];
  sensorReadingTime = [];
  var db = cloudant.db.use('iotp_3xowkp_sensordata_2018-01');

try{
db.find({
   "selector": {
      "_id": {
         "$gt": "0"
      }
   },
   "fields": [
      "_id",
      "data",
      "eventType",
      "timestamp"
   ],
   "sort": [
      {
         "timestamp": "desc"
      }
   ],
   "limit": 50
},
   function (err, data) {
      var originalData = [];
      console.log(data);
      if(data){
          var count=0;
          for(var i=0; count<20 && i < data.docs.length;i++) {
              if(data.docs[i]){
                  if(data.docs[i].eventType=='event' && data.docs[i].data.d != null ){
                    if(count<10){
                      moistureReading.push((data.docs[i].data.d.soil / 1024) * 100);
                      lightReading.push((data.docs[i].data.d.light /1024) * 100 );
                      sensorReadingTime.push(datetime.create(data.docs[i].timestamp).format('M'));
                    }
                    if(data.docs[i].data.d.soil ){
                      //console.log((data.rows[i].doc.data.d.soil /1024) * 100 );
                      dataForML.push([count+1,((data.docs[i].data.d.soil /1024) * 100 )])
                      originalData.push([count+1,((data.docs[i].data.d.soil ) )]);
                      count++;
                    }
                  }
              }
          }
          time = datetime.create(data.docs[2].timestamp).format('m/d/Y H:M:S');
          if(data.docs[2].data.d!=null){
            soil = data.docs[2].data.d.soil;
            light = data.docs[2].data.d.light;
          }
          var model = regression.polynomial(dataForML.reverse(), {order : 1});
          var slope = model.equation[0];
          var constant = model.equation[1];
          var wiltingPoint = soilTypeObject.soilType[6].wiltingPoint; 
          var fieldCapacity = soilTypeObject.soilType[6].fieldCapacity; 
          console.log(originalData);
          if(dataForML[0][1]>=wiltingPoint && dataForML[0][1] <= fieldCapacity){ //if its inside the range
            decision =  "Good condition";
          }else if(dataForML[0][1] <=wiltingPoint){
            if(slope>0.0){
                var timeUnit = (wiltingPoint - constant) / slope;
                console.log("Time unit"+model.predict(timeUnit));
                decision =   "The soil may reach minimum recommended soil moisture level in "+ ((timeUnit * 3)/60)+ ' minutes from the last reported sensor data. There is an increasing trend in soil moisture';
            } else {
              var willItRain = false;
              forecast.get([48.1351, 11.5820], function(err, weather) {
                if(err) decision =  console.dir(err);
                if(weather.currently.summary.toUpperCase().includes("RAIN"))
                  willItRain = true;
              });
              if(willItRain)
                decision =   "It might rain ! Automated watering is not performed !";        
              pushWaterEvent();

              decision =   "The soil requires watering ! Automated watering is being perfomed ! ";
            }
          }else if(dataForML[0][1] >= fieldCapacity){
            decision =   "The soil contains exccess water! Please consider draining !";
          }

      }else{
          console.log(err);
          decision =  "Error";
      }
     
  });
}catch(err){
  
}
 

  
}


var nodeSchedule = require("node-schedule")

nodeSchedule.scheduleJob('*/10 * * * * *', function(){
  decision = decide();
  console.log(" Scheduler ! ");
});

        var Client = require('ibmiotf');
function pushWaterEvent(){


      var config = {
          "org": "3xowkp",
          "id": "garden",
          "domain": "internetofthings.ibmcloud.com",
          "type": "RaspberryPi3",
          "auth-method": "token",
          "auth-token": "asoubdou32beuabsd13",
          //"auth-key" : "a-3xowkp-icxxqn72s7",
          //"auth-token" : "EZOEcu!DqRn9JxmLK("
      };

      try {
              // Event Push
      var deviceClient = new Client.IotfDevice(config);

      deviceClient.connect();

      deviceClient.on("connect", function () {
          //publishing event using the default quality of service
          deviceClient.publish("status","json",'{"d" : null, "event":"water" }');
      });
    }
    catch(err) {
        console.log("IOT Connection failed");
    }


}


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
        time : time,

        moistureReading : JSON.stringify(moistureReading),
        sensorReadingTime : JSON.stringify(sensorReadingTime),
        lightReading : JSON.stringify(lightReading)

    });
});


//Routes

router.get('/notification', function(req, res, next) {
    // Retrieve weather information from coordinates (Munich, Germany)
    var obj= {};
    obj.decision = decision;
    console.log(decision);
    res.json(obj);
});


router.get('/user', function(req, res, next) {
    res.render('user', {title: 'IG | User'});
});

router.get('/table', function(req, res, next) {
    res.render('table', {title: 'IG | Table'});
});

module.exports = router;
