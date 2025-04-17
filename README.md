# api-ui

An embedded UI for any service that implements the Rancher API spec.

Integrating with your API
-------
See [HTML UI](https://github.com/rancherio/api-spec/blob/master/specification.md#html-ui) in the API specification.  This also includes a link to the latest version hosted on our CDN.

## Install

```bash
git clone https://github.com/rancherio/api-ui
cd api-ui
yarn install
```

## Usage

### Compiling into stand-alone CSS and JavaScript files
This will write files to `./dist/{version}/`, suitable for publishing to a CDN.

```bash
  ./scripts/build
```

### Integrating with an API

Wrap JSON responses with a bit of HTML (and return `Content-Type: text/html`):
```html
<!DOCTYPE html>
<!-- If you are reading this, there is a good chance you would prefer sending an
"Accept: application/json" header and receiving actual JSON responses. -->
<link rel="stylesheet" type="text/css" href="//releases.rancher.com/api-ui/1.0.4/ui.css" />
<script src="//releases.rancher.com/api-ui/1.0.4/ui.js"></script>
<script>
var schemas = "http://url-to-your-api/v1/schemas";
var data = {
  /* ... JSON response ... */
};
/* ... additional options globals, see below ... */
</script>
```

### Options

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

## Bugs & Issues
Please submit bugs and issues to [rancher/dashboard](//github.com/rancher/dashboard/issues) with a title starting with `[API UI] `.

Or just [click here](//github.com/rancher/dashboard/issues/new?title=%5BAPI%20UI%5D%20) to create a new issue.

License
=======
Copyright (c) 2014-2025 [SUSE](https://www.suse.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.