gdapi-ui
========

An in-browser client for Go Daddy® REST API.

Integrating with your API
-------
See [HTML UI](https://github.com/godaddy/gdapi/blob/master/specification.md#html-ui) in the API specification.

Install
--------
```bash
git clone https://github.com/godaddy/gdapi-ui
cd gdapi-ui
npm install
```

Usage
--------

### Compiling into stand-alone CSS and JavaScript files
This will write files to ./compiled/{version}/, suitable for publishing to a CDN.

```bash
  ./bin/compile
```


### Running as a standalone server
This will start a server on the given port number (default: 3000) that serves up the assets directly.
This mode is mostly suitable for development of this library itself.

```bash
  ./bin/gdapi-ui [port]
```

### Running as part of another Node.js Connect/Express service
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
var groups = assets.groups.load('/path/to/gdapi-ui//assets.json');
assets.middleware(app, groups)

app.listen(3000);
```
