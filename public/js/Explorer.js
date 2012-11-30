function Explorer(htmlapi)
{
  this._api = htmlapi;
  this._columns = [];
  this._lastColumnId = 0;
}

Explorer.prototype.show = function(cb)
{
  var tpl = {
  };

  document.body.innerHTML = Handlebars.templates['explorer'](tpl);
  $('#explorer').css('top', $('#header')[0].offsetHeight + 'px');

  this.rootColumn();

  if ( cb )
    return async.nextTick(cb);
}

Explorer.prototype.rootColumn = function()
{
  var data = [];
  var schemas = this._api._schemas;
  var keys = Object.keys(schemas);
  var k, schema;
  for ( var i = 0 ; i < keys.length ; i++ )
  {
    k = keys[i];
    schema = schemas[k];
    if ( schema.links && schema.links.collection )
    {
      data.push({
        id:           schema.id,
        displayName:  schema.displayName || schema.name || schema.id,
        links: {
          'self': schema.links.collection
        }
      });
    }
  }

  var col = this.addPlaceholder();
  this.populateColumn(col, {
    type: 'collection',
    data: data
  });
}

Explorer.prototype.removeColumns = function(numOrElem, inclusive)
{
  var stopAt;

  if ( inclusive !== true )
    inclusive = false;

  if ( typeof numOrElem === 'object' )
    stopAt = numOrElem.data('num');
  else
    stopAt = numOrElem;

  if ( inclusive )
    stopAt--;

  var col;
  while ( this._columns.length > stopAt )
  {
    col = this._columns.pop();
    col.remove();
  }
}

Explorer.prototype.addPlaceholder = function()
{
  var id = ++this._lastColumnId;
  var tpl = {
    id: id,
    num: this._columns.length + 1
  };

  var html = Handlebars.templates['column'](tpl);
  $('#explorer').append(html);

  var elem = $('#column_'+ id);

  this._columns.push(elem);
  return elem;
}

Explorer.prototype._findColumnById = function(id)
{
  var col;
  for ( var i = 0, len = this._columns.length ; i < len ;  i++ )
  {
    col = this._columns[id];
    if ( col.data('id') == id )
    {
      return col; 
    }
  }

  return null;
}

Explorer.prototype._findColumnByChild = function(child)
{
  return $(child).parents('.column');
}

Explorer.prototype.populateColumn = function(idOrElem, obj)
{
  var col;
  if ( typeof idOrElem === 'object' )
    col = idOrElem;
  else
    col = this._findColumnById(id);

  if ( !col )
    return;

  var links = obj.links || {};
  delete obj.links;
  delete links.self;
  delete links.schemas;

  if ( obj.type && obj.type == 'collection' )
  {
    var tpl = {
      id:         col.data('id'),
      num:        col.data('num'),
      pagination: obj.pagination,
      data:       obj.data,
      links:      links,
    };

    var html = Handlebars.templates['column-collection'](tpl);
    col.html(html);

    col.on('click', $.proxy(this.followLink, this));
  }
  else
  {
    var actions = obj.actions || {};
    delete obj.actions;

    var tpl = {
      id:         col.data('id'),
      num:        col.data('num'),
      actions:    actions,
      data:       obj,
      links:      links,
    };

    var html = Handlebars.templates['column-resource'](tpl);
    col.html(html);

    $('.column-links',col).on('click', $.proxy(this.followLink, this));
  }
}

Explorer.prototype.followLink = function(event)
{
  var self = this;
  var $tgt = $(event.target);
  var $col = this._findColumnByChild($tgt);
  var link = $tgt.data('self');

  this.removeColumns($col);
  var $newColumn = this.addPlaceholder();
  this._api.ajax('GET', link, function(err,res) {
    if ( err )
    {
      self.removeColumns($newColumn,true);
      alert(err);
      return;
    }

    self.populateColumn($newColumn, res);
  });
}
