var NodeCache = require( "node-cache" );

module.exports = function(Train) {

  var cache = new NodeCache({stdTTL: 36000, errorOnMissing: true});

  var stations = function(cb) {
    try{
      var stations = cache.get('train-stations', true );
      cb(stations);
    } catch( err ){
      Train.findStations(function(err, data) {
        if (err) return {};
        var stations = {};
        data.forEach(function(elem) {
          stations[elem.stationShortCode] = elem.stationName;
        });
        cache.set('train-stations', stations);
        cb(stations);
      })
    }
  };

  Train.findCurrent = function(station, cb) {
    stations(function(stations) {
      Train.findTrains(station, function(err, data) {
        if (err) return cb(err);
        var results = [];
        data.forEach(function(elem) {
          var train = {};
          train.line = elem.commuterLineID;
          train.cancelled = elem.cancelled;
          train.late = 0;
          var shouldAdd = true;
          var shouldFindDest = false;
          elem.timeTableRows.forEach(function(timeRow) {
            if (timeRow.type == 'DEPARTURE') {
              return;
            }
            if (typeof timeRow.actualTime !== 'undefined') {
              train.lastStop = stations[timeRow.stationShortCode] || timeRow.stationShortCode;
              train.lastTime = timeRow.actualTime;
            }
            if (timeRow.stationShortCode === station) {
              shouldFindDest = true;
              if (typeof timeRow.actualTime !== 'undefined') {
                shouldAdd = false;
              }
              train.actual = timeRow.actualTime;
              train.arrival = timeRow.scheduledTime;
              train.estimate = timeRow.liveEstimateTime;
              train.late = timeRow.differenceInMinutes || 0;
            }
            if (shouldFindDest) {
              if (timeRow.stationShortCode === 'LEN') {
                shouldFindDest = false;
              }
              train.destination = stations[timeRow.stationShortCode] || 'unknown';
            }
          });
          if (shouldAdd) {
            results.push(train);
          }
        });
        results.sort(function(a,b) {
          return new Date(a.arrival) - new Date(b.arrival);
        });
        cb(null, results);
      });
    });
  };



  Train.remoteMethod(
    'findCurrent',
    {
      description: 'Return current trains arriving to the stop',
      http: {path: '/',verb: 'get'},
      accepts: [
        {arg: 'station', type: 'string', required: true}
      ],
      returns: {type: 'Train', root: true}
    }
  );
};
