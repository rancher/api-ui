var plainDir = __dirname + '/../public/js';
var viewDir  = __dirname + '/../public/views';

var files = [
  'async.js',
  'json2.js',
  'polyfill.js',
  'JSONFormatter.js',
  'URLParse.js',
  'Cookie.js',
  'handlebars.runtime.js',
  'template.js',
  'view:body.hbs',
  'view:filters.hbs',
  'view:filter.hbs',
  'view:actions.hbs',
  'view:request.hbs',
  'view:response.hbs',
  'view:edit.hbs',
  'view:field.hbs',
  'view:explorer.hbs',
  'view:column.hbs',
  'view:column-links.hbs',
  'view:column-collection.hbs',
  'view:column-resource.hbs',
  'init.js',
  'HTMLApi.js',
  'Explorer.js',
];

var async = require('async');
var fs = require('fs');
var uglify = require('uglify-js');
var handlebars = require('handlebars');

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

  res.header('Content-Type','text/javascript;charset=UTF-8');
  res.end(src);
}

function fetch(cb) {
  async.map(files, loadSource, filesLoaded);

  function loadSource(name, cb) {
    if ( name.match(/\.js$/) )
    {
      fs.readFile(plainDir+'/'+name, cb);
      return;
    }

    if ( name.match(/^view:/) )
    {
      var subname = name.substr(5);
      fs.readFile(viewDir+'/'+subname, function(err, source) {
        if ( err )
          return cb(err);

        compileView(subname, source, cb);
      });
      return;
    }

    cb(new Error('Unknown JS file type: '+ name));
  }

  function filesLoaded(err, res) {
    if ( err )
      return cb(err);

    cb(null, (res||[]).join("\n\n"));
  }
}

function fetchMin(cb) {
  fetch(function(err, source) {
    if ( err )
      return cb(err)

    var min = minify(source);
    cb(null,min);
  });
}

function compileView(name, source, cb)
{
  process.nextTick(function() {
    var compiled = handlebars.precompile(source.toString(),{});
    var out = [];
    var safeName = name.replace(/'/g,"\\'");
    out.push("(function() {")
    out.push("Handlebars.templates['" + safeName + "'] = Handlebars.template(");
    out.push(compiled);
    out.push(",{});");
    out.push("Handlebars.registerPartial('"+ safeName + "', Handlebars.templates['"+ safeName +"']);");
    out.push("})();");

    cb(null, out.join("\n"));
  });
}

function minify(source)
{
  var ast = uglify.parser.parse(source);
  ast = uglify.uglify.ast_mangle(ast);
  ast = uglify.uglify.ast_squeeze(ast);
  var min = uglify.uglify.gen_code(ast);

  return min;
}

exports.fetch = fetch;
exports.fetchMin = fetchMin;
