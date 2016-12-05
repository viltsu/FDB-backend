const NodeCache = require( "node-cache" );

module.exports = function(Train) {

  const cache = new NodeCache({stdTTL: 36000, errorOnMissing: true});

  const stations = function(cb) {
    try{
      let stations = cache.get('train-stations', true );
      cb(stations);
    } catch( err ){
      Train.findStations(function(err, data) {
        if (err) return {};
        let stations = {};
        data.forEach(function(elem) {
          stations[elem.stationShortCode] = elem.stationName;
        });
        cache.set('train-stations', stations);
        cb(stations);
      })
    }
  };

  Train.findCurrent = function(station, destinationStation, limit, cb) {
    stations(function(stations) {
      Train.findTrains(station, limit * 10, function(err, data) {
        if (err) return cb(err);
        let results = [];
        let done = false;
        data.forEach(function(elem) {
          let train = {};
          train.trainNumber = elem.trainNumber;
          train.train = elem.commuterLineID;
          train.cancelled = elem.cancelled;
          train.late = 0;
          if (!train.train || done) {
            return;
          }
          let shouldAdd = !destinationStation;
          let destination = (destinationStation || 'LEN');
          let shouldFindDest = false;
          elem.timeTableRows.forEach(function(timeRow) {
            if ((timeRow.type === 'DEPARTURE' && shouldFindDest) ||
                (timeRow.type === 'ARRIVAL'   && !shouldFindDest) || shouldAdd) {
              return;
            }
            if (typeof timeRow.actualTime !== 'undefined') {
              train.lastStop = stations[timeRow.stationShortCode] || timeRow.stationShortCode;
              train.lastTime = timeRow.actualTime;
            }
            if (timeRow.stationShortCode === station && timeRow.commercialTrack) {
              shouldFindDest = true;
              if (typeof timeRow.actualTime !== 'undefined') {
                shouldAdd = false;
                shouldFindDest = false;
              }
              train.line = timeRow.commercialTrack;
              train.actual = timeRow.actualTime;
              train.arrival = timeRow.scheduledTime;
              train.estimate = timeRow.liveEstimateTime;
              train.late = timeRow.differenceInMinutes || 0;
              train.track = timeRow.commercialTrack;
            }
            if (shouldFindDest) {
              if (timeRow.stationShortCode === destination && timeRow.commercialTrack) {
                shouldAdd = true;
                shouldFindDest = false;
              } else if (timeRow.stationShortCode === 'LEN' && station !== 'LEN') {
                shouldAdd = false;
                shouldFindDest = false;
              }
              train.destination = stations[timeRow.stationShortCode] || 'unknown';
              train.destinationLine = timeRow.commercialTrack;
              train.destinationArrival = timeRow.liveEstimateTime || timeRow.scheduledTime;
            }
          });
          if (shouldAdd) {
            results.push(train);
            if (results.length >= limit) {
              done = true;
            }
          }
        });
        results.sort(function(a,b) {
          return new Date(a.arrival) - new Date(b.arrival);
        });
        cb(null, results);
      });
    });
  };

  Train.findStation = function(search, cb) {
    stations( stations => {
      let result = [], i;
      for(i in stations) {
        if (!stations.hasOwnProperty(i)) {
          continue;
        }
        result.push({
          'stationName': i,
          'stationShortCode': stations[i],
        })
      }
      if (search) {
        search = search.toLowerCase();
        result = result.filter((station) => {
          return station['stationName']
              .toLowerCase()
              .indexOf(search) !== -1 ||
            station['stationShortCode']
              .toLowerCase()
              .indexOf(search) !== -1
        })
      }
      cb(null, result)
    });
  };

  Train.remoteMethod(
    'findCurrent',
    {
      description: 'Return current trains arriving to the stop',
      http: {path: '/',verb: 'get'},
      accepts: [
        {arg: 'station', type: 'string', required: true},
        {arg: 'destinationStation', type: 'string'},
        {arg: 'limit', type: 'string'}
      ],
      returns: {type: ['Train'], root: true}
    }
  );

  Train.remoteMethod(
    'findStation',
    {
      description: 'Return list of stations',
      http: {path: '/station',verb: 'get'},
      accepts: [
        {arg: 'search', type: 'string'}
      ],
      returns: {type: ['TrainStation'], root: true}
    }
  );

  Train.disableRemoteMethodByName("findStations", true);
  Train.disableRemoteMethodByName("findTrains", true);
  Train.disableRemoteMethodByName("invoke", true);
};
