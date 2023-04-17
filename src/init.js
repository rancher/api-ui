"use strict";

var htmlapi;
var explorer;
(function()
{
  jQuery(window).ready(jQueryReady);

  function getScript(url, cb) {
    return jQuery.ajax({
      dataType: 'script',
      cache: true,
      type: 'GET',
      url: url,
      success: cb
    });
  }

  function baseUrl() {
    var out = null;
    $('SCRIPT').each(function(idx, script) {
      if ( script.src ) {
        var match = script.src.match(/^(.*)\/ui\.(min\.)?js/);
        if ( match )
        {
          out = match[1];
        }
      }
    });

    return out;
  }

  function jQueryReady()
  {
    if ( window.autoInit === false )
      return;

    bootstrapReady();
  }

  function bootstrapReady()
  {
    document.body.innerHTML = '<div class="loading"><i class="fa fa-2x fa-spinner fa-spin"></i></div>';
    try {
      htmlapi = new HTMLApi({
        data:       window.data,
        schemasUrl: window.schemas,
        docsPage:   window.docsPage || window.docs,
        docsJson:   window.docsJson || window.docJson,
        user:       window.user,
        curlUser:   window.curlUser,
        logout:     window.logout
      }, apiReady);
    }
    catch (e)
    {
      apiError(e);
    }
  }

  function apiReady(err)
  {
    var view = Cookie.get('apiview') || 'browse';
    if ( err )
      view = 'browse';

    explorer = new Explorer(htmlapi);

    if ( view == 'explorer' )
      explorer.show();
    else
      htmlapi.show();
  }


  function apiError(err)
  {
    document.body.innerHTML = 'Error loading UI: '+ Handlebars.Utils.escapeExpression(err);
  }

})();

