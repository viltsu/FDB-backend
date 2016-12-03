const NodeCache = require( "node-cache" );

module.exports = function(Forecast) {

  Forecast.remoteMethod(
    'find',
    {
      description: 'fetch forecast',
      accepts: [
        {arg: 'lat', type: 'number', required: true},
        {arg: 'lon', type: 'number', required: true}
      ],
      http: {path: '/',verb: 'get'},
      returns: {type: 'Forecast', root: true}
    }
  );
};
