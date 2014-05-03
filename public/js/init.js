"use strict";

var htmlapi;
var explorer;
(function()
{
  jQuery(window).load(jQueryReady);

  function jQueryReady() {
    if ( window.autoInit === false )
      return;

    document.body.innerHTML = '<div class="loading"></div>';
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

