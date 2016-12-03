const request = require('request');
const moment = require('moment');
const NodeCache = require( "node-cache" );

module.exports = function(RainMap) {

  const MAX_FAIL = 5;
  const RESULT_SIZE = 10;
  const MAP_URL = 'http://testbed.fmi.fi/data/area/radar/temperature/TB_%datatime%.png';

  const cache = new NodeCache({stdTTL: 3600, errorOnMissing: true});

  RainMap.fetchImages = function fetchImages(cb, parameters) {
    parameters = parameters || {};
    parameters.success = parameters.success || 0;
    parameters.fail = parameters.fail || 0;
    parameters.data = parameters.data || [];
    if (parameters.time) {
      parameters.time = moment(parameters.time).subtract(5, 'minutes');
    } else {
      parameters.time = getStartTime();
    }

    if (parameters.success  > RESULT_SIZE || parameters.fail > MAX_FAIL) {
      cb(null, parameters.data);
      return;
    }
    let utc = moment(parameters.time).utc();
    let url = MAP_URL.replace('%datatime%',utc.format('YYYYMMDDHHmm'));

    try{
      let model = cache.get(url, true );
      parameters.data.push(model);
      parameters.success++;
      RainMap.fetchImages(cb, parameters)
    } catch( err ){
      request(url, function(error, res, body) {
        if (!error && res.statusCode === 200) {
          let model = {
            image: url,
            time: parameters.time.format('HH:mm')
          };
          parameters.data.push(model);
          parameters.success++;
          cache.set(url, model);
        } else {
          parameters.fail++
        }
        RainMap.fetchImages(cb, parameters)
      });
    }
  }

  function getStartTime() {
    let min = parseInt(moment().format('mm'));
    if (min % 5 !== 0) {
      min -= min % 5;
    }
    let start = moment().minute(min);

    return moment(start);
  }

  RainMap.remoteMethod(
    'fetchImages',
    {
      description: 'fetch rain maps',
      http: {path: '/',verb: 'get'},
      returns: {type:  ['RainMap'], root: true}
    }
  );

};
