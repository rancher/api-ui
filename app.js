
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , css = require('./routes/css')
  , js = require('./routes/js')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/ui.css', css.serve);
app.get('/ui.min.css', css.serveMin);

app.get('/ui.js', js.serve);
app.get('/ui.min.js', js.serveMin);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
