function Explorer(schema)
{
  this._schema = schema;
  this._columns = [];

  this.rootColumn();
}

Explorer.prototype.rootColumn = function()
{
  var entries = [];
  for ( var i = 0 ; i < this._schema.data.length ; i++ )
  {
    entries.push(this._schema.data[i].id);j
  }

  var tpl = {
    entries: entries
  };

  var html = Handlebars.templates['column.hbs'](tpl);
  $('#explorer').html(html);
}

