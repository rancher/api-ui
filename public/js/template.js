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

  for ( var key in context )
  {
    ret.push( options.fn({ key: key, value: context[key]} ) );
  }

  return ret.join("");
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

Handlebars.registerHelper('displayValue', function(context, options) {
  var html = htmlapi._formatter.valueToHTML(context);
  return new Handlebars.SafeString(html);
});
