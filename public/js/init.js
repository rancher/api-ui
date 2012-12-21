"use strict";

var htmlapi;
var explorer;
(function()
{
  function addScript(url,onload) {
    var head = document.getElementsByTagName('HEAD')[0];
    var script = document.createElement('script');
    script.src = url
    script.onload = function() { onload() };
    head.appendChild(script);
  }

  async.series([
    function(cb) { addScript("https://img4.wsimg.com/starfield/jquery/v1.7.1/jquery.js", cb); },
    function(cb) { addScript("https://img3.wsimg.com/starfield/curl/v1.8.1/curl.js", cb); }
  ], duelLoaded);

  function duelLoaded() {
    jQuery(window).load(jQueryReady);
  }

  function jQueryReady() {
    require('starfield/sf.dialog', function() {
      dialogReady();
    });
  }

  function dialogReady() {
    htmlapi = new HTMLApi(window.data, window.docs, apiReady);
  }

  function apiReady() {
    explorer = new Explorer(htmlapi);

    var view = Cookie.get('apiview') || 'browse';
    if ( view == 'explorer' )
      explorer.show();
    else
      htmlapi.show();
  }

})();

