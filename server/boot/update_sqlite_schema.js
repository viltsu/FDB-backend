module.exports = function(app) {
  app.dataSources.infoLite.isActual(function(err, actual){
    if (!actual) {
      app.dataSources.infoLite.autoupdate();
    }
  });
};
