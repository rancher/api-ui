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
