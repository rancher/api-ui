/*
https://github.com/bhollis/jsonview/blob/master/src/components/jsonview.js

MIT License

Copyright (c) 2009 Benjamin Hollis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/* 
 * The JSONFormatter helper object. This contains two major functions, jsonToHTML and errorPage, 
 * each of which returns an HTML document.
 */ 
function JSONFormatter(opt) {
  this.options = opt;
}

JSONFormatter.prototype = {
  htmlEncode: function (t) {
    return t != null ? t.toString().replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : '';
  },

  // Completely escape strings, taking care to return common escape codes to their short forms
  jsString: function(s) {
    // the JSON serializer escapes everything to the long-form \uXXXX
    // escape code. This is a map of characters to return to the short-escaped
    // form after escaping.
    var has = {
      '\b': 'b',
      '\f': 'f',
      '\r': 'r',
      '\n': 'n',
      '\t': 't'
    }, ws;
    for (ws in has) {
      if (-1 === s.indexOf(ws)) {
        delete has[ws];
      }
    }

    // The old nsIJSON can't encode just a string...
    s = JSON.stringify({a:s});
    s = s.slice(6, -2);

    for (ws in has) {
      s = s.replace(new RegExp('\\\\u000' + (ws.charCodeAt().toString(16)), 'ig'),
                    '\\' + has[ws]);
    }

    return this.htmlEncode(s);
  },
  
  decorateWithSpan: function (value, className) {
    return '<span class="' + className + '">' + this.htmlEncode(value) + '</span>';
  },
  
  // Convert a basic JSON datatype (number, string, boolean, null, object, array) into an HTML fragment.
  valueToHTML: function(value, path) {
    var valueType = typeof value;
    
    var output = "";
    if (value == null) {
      output += this.decorateWithSpan('null', 'null');
    }
    else if (value && value.constructor == Array) {
      output += this.arrayToHTML(value, path);
    }
    else if (valueType == 'object') {
      output += this.objectToHTML(value, path);
    } 
    else if (valueType == 'number') {
      output += this.decorateWithSpan(value, 'num');
    }
    else if (valueType == 'string') {
      if (/^(http|https):\/\/[^\s]+$/i.test(value)) {
        var prefix = '';
        var dispValue = value;
        if ( this.options.baseUrl && value.indexOf(this.options.baseUrl) == 0)
        {
          prefix = '&hellip;';
          dispValue = value.substr(this.options.baseUrl.length);
        }

        output += '<a class="valuelink" href="' + this.jsString(value) + '"><span class="string">&quot;' + prefix + this.jsString(dispValue) + '&quot;</span></a>';
      } else {
        output += '<span class="string">&quot;' + this.jsString(value) + '&quot;</span>';
      }
    }
    else if (valueType == 'boolean') {
      output += this.decorateWithSpan(value, 'bool');
    }
    
    return output;
  },
  
  // Convert an array into an HTML fragment
  arrayToHTML: function(json, in_path) {
    var hasContents = false;
    var output = '';
    var cur = 0, total = 0;
    for (var prop in json ) {
      total++;
    }

    var path;
    for ( var prop in json ) {
      if ( ! json.hasOwnProperty(prop) )
        continue;

      hasContents = true;

      path = (in_path||[]).slice(0);
      path.push(prop);
      output += '<li>' + this.valueToHTML(json[prop],path);

      cur++;
      if ( cur < total ) {
        output += ',';
      }
      output += '</li>';
    }
    
    if ( hasContents ) {
      output = '[' + (total > 1 ? '<span class="array-count"> ' + total + ' items</span>' : '') + '<ul class="array collapsible">' + output + '</ul>]';
    } else {
      output = '[ ]';
    }

    return output;
  },
  
  // Convert a JSON object to an HTML fragment
  objectToHTML: function(json, in_path) {
    var hasContents = false;
    var output = '';
    var cur = 0, total = 0;
    for (var prop in json ) {
      if ( ! json.hasOwnProperty(prop) || prop.substr(0,2) == '__' )
        continue;

      total++;
    }

    var keyHtml, valueHtml, path;
    for ( var prop in json ) {
      if ( ! json.hasOwnProperty(prop) || prop.substr(0,2) == '__' )
        continue;

      if ( this.options.keyFormatter )
      {
        keyHtml = this.options.keyFormatter(prop, json, in_path)
      }
      else
      {
        keyHtml = this.jsString(prop);
      }

      if ( this.options.valueFormatter )
      {
        valueHtml = this.options.valueFormatter(prop, json, in_path)
      }
      else
      {
        path = (in_path||[]).slice(0);
        path.push(prop);
        valueHtml = this.valueToHTML(json[prop],path);
      }

      hasContents = true;
      output += '<li><span class="prop"><span class="q">"</span>' + keyHtml +
                '<span class="q">"</span></span>: ' + valueHtml;

      cur++;
      if ( cur < total ) {
        output += ',';
      }
      output += '</li>';
    }
    
    if ( hasContents ) {
      output = '{<ul class="obj collapsible">' + output + '</ul>}';
    } else {
      output = '{ }';
    }
    
    return output;
  },
  
  // Convert a whole JSON value / JSONP response into a formatted HTML document
  jsonToHTML: function(json, callback, uri) {
    var output = '<div id="json" class="json">' +
                 this.valueToHTML(json) +
                 '</div>';
    if (callback) {
      output = '<div class="callback">' + callback + '(</div>' +
               output +
               '<div class="callback">)</div>';
    }
    return this.toHTML(output, uri);
  },

  // lazy load the translations
  getStringBundle: function() {
    if (this.stringbundle) {
      return this.stringbundle;
    }

    var src = 'chrome://jsonview/locale/jsonview.properties';
    var localeService = Cc["@mozilla.org/intl/nslocaleservice;1"].getService(Ci.nsILocaleService);

    var appLocale = localeService.getApplicationLocale();
    var stringBundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
    this.stringbundle = stringBundleService.createBundle(src, appLocale);
    return this.stringbundle;
  },

  // Produce an error document for when parsing fails.
  errorPage: function(error, data, uri) {
    var stringbundle = this.getStringBundle();

    // Escape unicode nulls
    data = data.replace("\u0000","\uFFFD");

    var output = '<div id="error">' + stringbundle.GetStringFromName('errorParsing') + '</div>' +
                 '<h1>' + stringbundle.GetStringFromName('docContents') + ':</h1>' +
                 '<div id="json" class="json">' + this.htmlEncode(data) + '</div>';
    return this.toHTML(output, uri + ' - Error');
  },
  
  // Wrap the HTML fragment in a full document. Used by jsonToHTML and errorPage.
  toHTML: function(content, title) {
    return '<!DOCTYPE html>\n' +
      '<html><head><title>' + this.htmlEncode(title) + '</title>' +
      '<link rel="stylesheet" type="text/css" href="chrome://jsonview/content/default.css">' +
      '<script type="text/javascript" src="chrome://jsonview/content/default.js"></script>' +
      '</head><body>' +
      content +
      '</body></html>';
  },

  // Click handler for collapsing and expanding objects and arrays
  collapse: function(evt) {
    var collapser = evt.target;

    var target = collapser.parentNode.getElementsByClassName('collapsible');

    if ( ! target.length ) {
      return;
    }

    target = target[0];

    if ( target.style.display == 'none' ) {
      var ellipsis = target.parentNode.getElementsByClassName('ellipsis')[0];
      target.parentNode.removeChild(ellipsis);
      target.style.display = '';
      $(collapser).removeClass('glyphicon-plus');
      $(collapser).addClass('glyphicon-minus');
    } else {
      target.style.display = 'none';

      var ellipsis = document.createElement('span');
      ellipsis.className = 'ellipsis';
      ellipsis.innerHTML = ' &hellip; ';
      target.parentNode.insertBefore(ellipsis, target);
      $(collapser).removeClass('glyphicon-minus');
      $(collapser).addClass('glyphicon-plus');
    }
  }
  
};
