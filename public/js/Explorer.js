(function(window) {

var Explorer = function Explorer(htmlapi)
{
  this._api = htmlapi;
  this._columns = [];
  this._lastColumnId = 0;

  this._lastClickColumn = null;
  this._lastClickRow = null;
}

Explorer.prototype.show = function(cb)
{
  var tpl = {
    docs: this._api._docs,
    user: this._api._user
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

  this.resizeWrapper();
}

Explorer.prototype.addPlaceholder = function()
{
  var id = ++this._lastColumnId;
  var tpl = {
    id: id,
    num: this._columns.length + 1
  };

  var html = Handlebars.templates['column'](tpl);
  $('#explorer-wrapper').append(html);

  var elem = $('#column_'+ id);

  this._columns.push(elem);
  this.resizeWrapper();
  elem.scrollintoview();
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

  var hasLinks = false;
  for ( var k in links )
  {
    hasLinks = true;
    break;
  }

  if ( obj.type && obj.type == 'collection' )
  {
    var tpl = {
      id:         col.data('id'),
      num:        col.data('num'),
      pagination: obj.pagination,
      data:       obj.data,
      links:      links,
      hasLinks:   hasLinks
    };

    var html = Handlebars.templates['column-collection'](tpl);
    col.html(html);

    col.on('click', $.proxy(this.clickRow, this));
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
      hasLinks:   hasLinks
    };

    var html = Handlebars.templates['column-resource'](tpl);
    col.html(html);

    $('.column-links',col).on('click', $.proxy(this.followLink, this));
  }

  this.resizeWrapper();
  col.scrollintoview();
}

var isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
function moreKey(event)
{
  return (isMac ? event.metaKey : event.ctrlKey );
}

function rangeKey(event)
{
  return event.shiftKey;
}

function compareOrder(node1, node2)
{
  if (node1 == node2)
  {
    return 0;
  }

  if (node1.compareDocumentPosition)
  {
    // 4 is the bitmask for FOLLOWS.
    // 2 is the bitmask for PRECEEDS.
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }

  // Process in IE using sourceIndex - we check to see if the first node has a source index or if it's parent has one.
  if ('sourceIndex' in node1 || (node1.parentNode && 'sourceIndex' in node1.parentNode))
  {

    var isElement1 = node1.nodeType == 1;
    var isElement2 = node2.nodeType == 1;

    var index1 = isElement1 ? node1.sourceIndex : node1.parentNode.sourceIndex;
    var index2 = isElement2 ? node2.sourceIndex : node2.parentNode.sourceIndex;

    if (index1 != index2)
    {
      return ( index1 - index2 < 0 ? -1 : 1);
    }
    else
    {
      if (isElement1)
      {
        // Since they are not equal, we can deduce that node2 is a child of
        // node1 and therefore node1 comes first.
        return -1;
      }

      if (isElement2)
      {
        // Similarly, we know node1 is a child of node2 in this case.
        return 1;
      }

      // If we get here, we know node1 and node2 are both child nodes of the
      // same parent element.
      var s = node2;
      while ((s = s.previousSibling))
      {
        if (s == node1)
        {
          // We just found node1 before node2.
          return -1;
        }
      }

      // Since we didn't find it, node1 must be after node2.
      return 1;
    }
  }

  // For Safari, we cheat and compare ranges.
  var doc = ( node1.nodeType == 9 ? node1 : node1.ownerDocument || node1.document );

  var range1, range2, compare;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);

  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);

  var result = range1.compareBoundaryPoints(Range.START_TO_END, range2);
  return result;
}

Explorer.prototype.followLink = function(event)
{
  var self = this;
  var $tgt = $(event.target);
  var link = $tgt.data('self');

  // Open in new window with ctrl/apple key or middle click
  if ( link && ( moreKey(event) || event.which == 2 ))
  {
    window.open(link);
  }
  else
  {
    this.clickRow(event);
  }
}

Explorer.prototype.clickRow = function(event)
{
  var self = this;
  var $tgt = $(event.target);

  if ( ! $tgt.hasClass('row') )
    return;

  var $col = this._findColumnByChild($tgt);

  // Range & multiple selection
  if ( moreKey(event) )
  {
    $tgt.toggleClass('selected');
  }
  else if ( rangeKey(event) &&  $col[0] == this._lastClickColumn )
  {
    var newState = !$tgt.hasClass('selected');
    var cur,to;
    if ( compareOrder(this._lastClickRow, $tgt[0]) == -1 )
    {
      cur = this._lastClickRow;
      to = $tgt[0];
    }
    else
    {
      cur = $tgt[0];
      to = this._lastClickRow;
    }

    $(cur).nextUntil(to).toggleClass('selected', newState);
    $(to).toggleClass('selected', newState);
    event.preventDefault();
    event.stopPropagation();
  }
  else
  {
    // Single selection
    $('LI.row.selected', $col).removeClass('selected');
    $tgt.addClass('selected');
  }

  // Remember the last click for next time
  this._lastClickColumn = $col[0];
  this._lastClickRow = $tgt[0];

  // Remove columns after this one
  this.removeColumns($col);

  var $sel = $('LI.row.selected', $col);
  if ( $sel.length == 0 )
  {
    alert('Nothing is selected');
    return;
  }
  else if ( $sel.length > 1 )
  {
    alert($sel.length + ' things are selected');
    return;
  }
  else
  {
    var link = $tgt.data('self');
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
}

Explorer.prototype.resizeWrapper = function()
{
  var total = 0;
  $.each(this._columns, function(k,v) { 
    total += v.width()+1;
  });

  $('#explorer-wrapper').width(total);
}

window.Explorer = Explorer;

}(window));
