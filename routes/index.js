var express = require('express');
var router = express.Router();

var util = require('util');

var sleep = require('sleep');

// Soil Type json with the min and max water percent
var soilTypeObject = '{"soilType":[' +
    '{"type":"sand","fieldCapacity":"12", "wiltingPoint":"5"  },' +
    '{"type":"sandyLoam","fieldCapacity":"16", "wiltingPoint":"6"  },' +
    '{"type":"loam","fieldCapacity":"25", "wiltingPoint":"10"  },' +
    '{"type":"slitLoam","fieldCapacity":"32", "wiltingPoint":"14"  },' +
    '{"type":"clayLoam","fieldCapacity":"38", "wiltingPoint":"20"  },' +
    '{"type":"slityClay","fieldCapacity":"40", "wiltingPoint":"26"  },' +
    '{"type":"clay","fieldCapacity":"43", "wiltingPoint":"30"  }]}';

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
var time;
var soil;
var light;

var moistureReading = [];
var sensorReadingTime = [];
var lightReading = [];

//var test = [];

var dataForML = [];

var db = cloudant.db.use('iotp_3xowkp_sensordata_2018-01');

  db.list({include_docs:true}, function (err, data) {
      if(data){
          var count=0;
          for(var i=data.rows.length; count<20 && i >= 0;i--) {
              if(data.rows[i] && data.rows[i].doc.eventType === 'event'){
                  if(data.rows[i].doc.data.d != null ){
                    if(count<10){
                      moistureReading.push((data.rows[i].doc.data.d.soil / 1024) * 100);
                      lightReading.push((data.rows[i].doc.data.d.light /1024) * 100 );
                      sensorReadingTime.push(datetime.create(data.rows[i].doc.timestamp).format('M'));
                    }
                    if(data.rows[i].doc.data.d.soil ){
                      dataForML.push([count+1,((data.rows[i].doc.data.d.soil ))])
                      count++;
                    }
                  }
              }
          }
          time = datetime.create(data.rows[2].doc.timestamp).format('m/d/Y H:M:S');
          soil = data.rows[2].doc.data.d.soil;
          light = data.rows[2].doc.data.d.light;
          console.log(dataForML);      
          //var test =[[1, 1], [2, 67], [3, 79], [4, 127], [5, 100], [6, 96], [7, 80], [8, 69], [9, 60]];

          console.log('input data to regression --- '+ dataForML);
          console.log('model: '+util.inspect(regression.polynomial(dataForML, {order : 2}), false, null));
          console.log('regression --- ' + regression.polynomial(dataForML, {order : 2}).predict(2));


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
        time : time,

        moistureReading : JSON.stringify(moistureReading),
        sensorReadingTime : JSON.stringify(sensorReadingTime),
        lightReading : JSON.stringify(lightReading)

    });
});


// ML Decision Tree

/*
var ml = require('machine_learning');

var data =[['sand', 12, 5, 8],
    ['sand', 12, 5, 15],
    ['sandyLoam', 16, 6, 14],
    ['sandyLoam', 16, 6, 8],
    ['loam', 25, 10, 14],
    ['loam', 25, 10, 5],
    ['loam', 25, 10, 20],
    ['slitLoam', 32, 14, 15],
    ['slitLoam', 32, 14, 19],
    ['clay', 43, 30, 18],
    ['slityClay', 40, 26, 38],
    ['clayLoam', 38, 20, 18],
    ['clayLoam', 38, 20, 30],
    ['clayLoam', 38, 20, 21],
    ['slityClay', 40, 26, 18],
    ['clay', 43, 30, 37]];

var result = ['NA','NA','NA','WATER','NA','WATER','NA','WATER','WATER','WATER','NA','WATER','NA','WATER','WATER','WATER'];

var dt = new ml.DecisionTree({
    data : data,
    result : result
});

dt.build();

// dt.print();

console.log("Classify : ", dt.classify(['loam', 25, 10, 20]));

dt.prune(1.0); // 1.0 : mingain.
dt.print();

*/


//SVM

// var ml = require('machine_learning');
// var x = [[0.4, 0.5, 0.5, 0.,  0.,  0.],
//     [0.5, 0.3,  0.5, 0.,  0.,  0.01],
//     [0.4, 0.8, 0.5, 0.,  0.1,  0.2],
//     [1.4, 0.5, 0.5, 0.,  0.,  0.],
//     [1.5, 0.3,  0.5, 0.,  0.,  0.],
//     [0., 0.9, 1.5, 0.,  0.,  0.],
//     [0., 0.7, 1.5, 0.,  0.,  0.],
//     [0.5, 0.1,  0.9, 0.,  -1.8,  0.],
//     [0.8, 0.8, 0.5, 0.,  0.,  0.],
//     [0.,  0.9,  0.5, 0.3, 0.5, 0.2],
//     [0.,  0.,  0.5, 0.4, 0.5, 0.],
//     [0.,  0.,  0.5, 0.5, 0.5, 0.],
//     [0.3, 0.6, 0.7, 1.7,  1.3, -0.7],
//     [0.,  0.,  0.5, 0.3, 0.5, 0.2],
//     [0.,  0.,  0.5, 0.4, 0.5, 0.1],
//     [0.,  0.,  0.5, 0.5, 0.5, 0.01],
//     [0.2, 0.01, 0.5, 0.,  0.,  0.9],
//     [0.,  0.,  0.5, 0.3, 0.5, -2.3],
//     [0.,  0.,  0.5, 0.4, 0.5, 4],
//     [0.,  0.,  0.5, 0.5, 0.5, -2]];
//
// var y =  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1,1,1,1,1,1,1,1,1];
//
// var svm = new ml.SVM({
//     x : x,
//     y : y
// });
//
// svm.train({
//     C : 1.1, // default : 1.0. C in SVM.
//     tol : 1e-5, // default : 1e-4. Higher tolerance --> Higher precision
//     max_passes : 20, // default : 20. Higher max_passes --> Higher precision
//     alpha_tol : 1e-5, // default : 1e-5. Higher alpha_tolerance --> Higher precision
//
//     kernel : { type: "polynomial", c: 1, d: 5}
//     // default : {type : "gaussian", sigma : 1.0}
//     // {type : "gaussian", sigma : 0.5}
//     // {type : "linear"} // x*y
//     // {type : "polynomial", c : 1, d : 8} // (x*y + c)^d
//     // Or you can use your own kernel.
//     // kernel : function(vecx,vecy) { return dot(vecx,vecy);}
// });
//
// //console.log("Predict : ",svm.predict([1.3,  1.7,  0.5, 0.5, 1.5, 0.4]));
//
// console.log(JSON.stringify(moistureReading));
// console.log("Predict : ", svm.predict([0.0, 0.5, 0.4, 1.0, 2.0, 3.0 ]));


// Linear Regression Order 3



// console.log('regression ---' + regression.polynomial([
//     [1, 1], [2, 67], [3, 79], [4, 127], [5, 100], [6, 96], [7, 80], [8, 69]
// ], {order : 3}).predict(9));




var Client = require('ibmiotf');

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


// Event Push
var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

deviceClient.on("connect", function () {
    //publishing event using the default quality of service
    deviceClient.publish("status","json",'{"d" : null, "event":"water" }');
});


//Routes

router.get('/user', function(req, res, next) {
    res.render('user', {title: 'IG | User'});
});

router.get('/table', function(req, res, next) {
    res.render('table', {title: 'IG | Table'});
});

module.exports = router;
