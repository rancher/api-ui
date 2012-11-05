var dir = __dirname + '/../public/css';
var files = [
  'main.css'
];

var async = require('async');
var fs = require('fs');
var uglify = require('uglifycss');

exports.serve = function(req, res){
  fetch(respond.bind(res));
};

exports.serveMin = function(req, res){
  fetchMin(respond.bind(res));
};

function respond(err, src) {
  var res = this;
  if ( err )
    return res.send(err);

  res.header('Content-Type','text/css;charset=UTF-8');
  res.end(src);
}

function fetch(cb) {
  async.map(files, loadSource, filesLoaded);

  function loadSource(name, cb) {
    var path = dir+'/'+name;
    if ( name.match(/\.css$/) )
      fs.readFile(path, cb);
    else
      cb(new Error('Unknown CSS file type: '+ name));
  }

  function filesLoaded(err, res) {
    if ( err )
      return cb(err);

    cb(null, (res||[]).join("\n"));
  }
}

function fetchMin(cb) {
  fetch(function(err, source) {
    if ( err )
      return cb(err)

    var min = uglify.processString(source);
    cb(null,min);
  });
}

exports.fetch = fetch;
exports.fetchMin = fetchMin;
