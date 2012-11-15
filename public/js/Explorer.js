function Explorer(htmlapi)
{
  this._api = htmlapi;
  this._columns = [];

}

Explorer.prototype.show = function()
{
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

