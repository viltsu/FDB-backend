const NodeCache = require( "node-cache" );
const parseString = require('xml2js').parseString;

module.exports = function(Forecast) {

  Forecast.getForecast = function(next) {
    Forecast.find(function(err, data) {
      if (err) return next(err);
      parseString(data, function(err, result) {
        if (err) return next(err);
        let results = {};
        if (result && result['wfs:FeatureCollection'] && result['wfs:FeatureCollection']['wfs:member']) {
          result['wfs:FeatureCollection']['wfs:member'].map(item => {
            item['BsWfs:BsWfsElement'].map(elem => {
              if (!elem['BsWfs:Time'] || !elem['BsWfs:Time'][0] ||
                !elem['BsWfs:ParameterName'] || !elem['BsWfs:ParameterName'][0] ||
                !elem['BsWfs:ParameterValue'] || !elem['BsWfs:ParameterValue'][0]) {
                return;
              }
              if (!results[elem['BsWfs:Time'][0]]) {
                results[elem['BsWfs:Time'][0]] = {};
              }
              results[elem['BsWfs:Time'][0]][elem['BsWfs:ParameterName'][0]] = elem['BsWfs:ParameterValue'][0]
            })
          });
        }
        let list = [];
        for(let i in results) {
          if (!results.hasOwnProperty(i)) {
            continue;
          }
          let obj = results[i];
          obj['time'] = i;
          list.push(obj)
        }
        next(null, list);
      });

    });
  };

  Forecast.remoteMethod(
    'getForecast',
    {
      description: 'fetch forecast',
      http: {path: '/',verb: 'get'},
      returns: {type: 'Forecast', root: true}
    }
  );

  Forecast.disableRemoteMethodByName("find", true);
  Forecast.disableRemoteMethodByName("invoke", true);

};
