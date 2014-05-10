Handlebars.templates = Handlebars.templates || {};

Handlebars.registerHelper('ifEqual', function(a, b, options) {
  if ( a == b )
  {
    return options.fn(this);
  }
  else
  {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('eachProperty', function(context, options) {
  var ret = [];

  var any = false;
  for ( var key in context )
  {
    any = true;
    ret.push( options.fn({ key: key, value: context[key]} ) );
  }

  if ( any )
  {
    return ret.join("");
  }
  else
  {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('ifInList', function(a, b, options) {
  var c = b.split(/,/);
  if ( b.indexOf(a) >= 0 )
  {
    return options.fn(this);
  }
  else
  {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('displayName', function(context, options) {
  return context.displayName || context.name || context.id || '';
});

Handlebars.registerHelper('displayKey', function(context, options) {
  key = Handlebars.Utils.escapeExpression(context);
  // This could theoretically break the middle of a tag, but will be fine for keys
  var key = context.replace(/([A-Z][a-z]+)/g, '<span>$1</span>');
  return new Handlebars.SafeString(key);
});

Handlebars.registerHelper('displayValue', function(context, options) {
  var html = htmlapi._formatter.valueToHTML(context);
  html = html.replace(/(<span class="string">)&quot;([^"]+)&quot;(<\/span>)/g, '$1$2$3');
  return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('displayModifier', function(context, options) {
  var str = '';
  switch (context)
  {
    case ""       : str = '='; break;
    case "eq"     : str = '='; break;
    case "ne"     : str = '&ne;'; break;
    case "lt"     : str = '&lt;'; break;
    case "lte"    : str = '&le;'; break;
    case "gt"     : str = '&gt;'; break;
    case "gte"    : str = '&ge;'; break;
    case "null"   : str = 'NULL'; break;
    case "notnull": str = 'Not NULL'; break;
    case "like"   : str = 'Like'; break;
    case "notlike": str = 'Not like'; break;
    case "prefix" : str = 'Starts with'; break;
    case "suffix" : str = 'Ends with'; break;
  }

  return new Handlebars.SafeString(str);
});
