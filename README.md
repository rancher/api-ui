api-ui
========

An embedded UI for any service that implements the Rancher API spec.

Integrating with your API
-------
See [HTML UI](https://github.com/rancherio/api-spec/blob/master/specification.md#html-ui) in the API specification.  This also includes a link to the latest version hosted on our CDN.

Install
--------
```bash
git clone https://github.com/rancherio/api-ui
cd api-ui
npm install
bower install
npm install -g broccoli-cli
```

Usage
--------

### Compiling into stand-alone CSS and JavaScript files
This will write files to `./dist/{version}/`, suitable for publishing to a CDN.

```bash
  ./bin/compile
```

### Running as a standalone server
This will start a server on the given port number (default: 3000) that serves up the assets directly.
This mode is mostly suitable for development of this library itself.

```bash
  broccoli serve
```

Integrating with an API
--------
Wrap JSON responses with a bit of HTML (and return `Content-Type: text/html`):
```
<!DOCTYPE html>
<!-- If you are reading this, there is a good chance you would prefer sending an
"Accept: application/json" header and receiving actual JSON responses. -->
<link rel="stylesheet" type="text/css" href="//cdn.rancher.io/api-ui/1.0.0/ui.css" />
<script src="//cdn.rancher.io/api-ui/1.0.0/ui.js"></script>
<script>
var schemas = "http://url-to-your-api/v1/schemas";
var data = {
  /* ... JSON response ... */
};
/* ... additional options globals, see below ... */
</script>
```

Options
------
Several options can be configured through additional globals:

```javascript
// Adds a documentation link in the navigation area
var docsPage = "http://url-to-your-docs/site";

// URL to a documentation JSON file to add descriptions for types and fields.
var docsJson = "http://url-to-your-docs.json";

// Displays the username who is logged in next to the Log Out link so the user knows who you think they are
var user = "jsmith";

// Disables the display of the logout link
var logout = false; // Disable the display of the Log Out link

// Replaces the default "${API_ACCESS_KEY}:${API_SECRET_KEY}" string when displaying cURL commands.
//   setting to false will omit the user/pass option from the command entirely.
var curlUser = "some:thing";

// Overrides the location where bootstrap is loaded from ('/css/boostrap.min.css' and '/js/bootstrap.min.js' will be appended to this)
var bootstrap = "http://url/to/bootstrap/version";
```
