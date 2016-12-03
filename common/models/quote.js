module.exports = function(Quote) {

  Quote.random = function(cb) {
    Quote.count(function (err, count) {
      if (err !== null) {
        cb(err, {});
        return;
      }
      const spot = Math.floor(Math.random() * count);
      Quote.findOne({offset: spot}, function(err, model) {
        cb(err, model);
      });
    });
  };

  Quote.remoteMethod(
    'random',
    {
      description: 'Return random quote',
      http: {path: '/random',verb: 'get'},
      returns: {type: 'Object', root: true}
    }
  );

};
