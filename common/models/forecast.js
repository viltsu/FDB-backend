module.exports = function(Forecast) {

  Forecast.fetchForecast = function(cb) {
    cb(null, {})
  };

  Forecast.remoteMethod(
    'fetchForecast',
    {
      description: 'fetch forecast',
      http: {path: '/',verb: 'get'},
      returns: {type: 'Forecast', root: true}
    }
  );
};
