gdapi-ui
========

An in-browser client for Go Daddy® REST APIs

Usage
--------

### Compiling the stand-alone CSS and JavaScript files
This will write files to ./compiled/{version}/, suitable for publishing to a CDN.

```bash
  ./compile
```


### Standalone server
This will start a server on the given port number (default: 3000) that serves up the assets directly.
This mode is mostly suitable for development of this library itself.

```bash
  ./serve [port]
```

### As part of another Node.js Connect/Express service
This will add a route into your Connect/Express service to respond with the appropriate asset.
This mode is suitable for integrating with an existing project that already has a server running.
```javascript
var express = require('express');
var app = express();

// Your existing routes
app.get('/', function(req, res){
  res.send('Hello World');
});

var assets = require('gd-assets');
var groups = assets.groups.load(__dirname+'/assets.json');
assets.middleware(app, groups)

app.listen(3000);
```