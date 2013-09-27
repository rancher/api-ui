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
    document.body.innerHTML = '<div class="loading"></div>';
    try {
      htmlapi = new HTMLApi(window.data, window.docs, window.user, apiReady);
    }
    catch (e)
    {
      apiError(err);
    }
  }

  function apiError(err)
  {
    document.body.innerHTML = 'Error loading UI: '+ Handlebars.Utils.escapeExpression(err);
  }

  function apiReady(err) {
    var view = Cookie.get('apiview') || 'browse';
    if ( err )
      view = 'browse';

    explorer = new Explorer(htmlapi);

    if ( view == 'explorer' )
      explorer.show();
    else
      htmlapi.show();
  }

})();

