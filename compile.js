#!/usr/bin/env node

var fs  = require('fs');
var css = require('./routes/css');
var js = require('./routes/js');

var dir = __dirname + "/compiled";
if ( !fs.existsSync(dir) )
  fs.mkdirSync(dir);

var pkg = require('./package.json');

var cssFile     = dir + '/ui.css';
var cssMinFile  = dir + '/ui.min.css';

css.fetch(write.bind(null,cssFile));
css.fetchMin(write.bind(null,cssMinFile));

var jsFile     = dir + '/ui.js';
var jsMinFile  = dir + '/ui.min.js';

js.fetch(write.bind(jsFile));
js.fetchMin(write.bind(jsMinFile));

function write(path,err,src) {
  if ( err )
  {
    console.log('Error compiling:', err);
    process.exit(1);
    return;
  }

  fs.writeFileSync(path, src);
  console.log('Wrote',path,'('+src.length+' bytes)');
}
