var htmlapi;
(function()
{
  async.series([
    function(cb) { addScript("https://img4.wsimg.com/starfield/jquery/v1.7.1/jquery.js", cb); },
    function(cb) { addScript("https://img3.wsimg.com/starfield/curl/v1.8.1/curl.js", cb); }
  ], duelLoaded);

  function addScript(url,onload) {
    var head = document.getElementsByTagName('HEAD')[0];
    var script = document.createElement('script');
    script.src = url
    script.onload = function() { onload() };
    head.appendChild(script);
  }

  function duelLoaded() {
    jQuery(window).load(ready);
  }

  function ready() {
    htmlapi = new HTMLApi(window.data, window.docs);
  }
})();

function HTMLApi(data, docs)
{
  this._schemas  = null;
  this._data     = null;
  this._docs     = docs;
  this._filterId = 0;

  this._formatter = new JSONFormatter({
    baseUrl: window.location.protocol +"//" + window.location.host,
    keyFormatter: this.keyFormatter.bind(this),
    valueFormatter: this.valueFormatter.bind(this)
  });

  this.loadData(data);
}

HTMLApi.prototype.loadData = function(data)
{
  this._schemas = null;
  this._data = data;

  async.auto({
    title:                      this.titleUpdate.bind(this),
    rawSchema:                  this.schemasLoad.bind(this),
    schema:     ['rawSchema',   this.schemasMunge.bind(this)  ],
    render:     ['schema',      this.render.bind(this)        ],
    operations: ['render',      this.operationInit.bind(this) ],
    actions:    ['render',      this.actionInit.bind(this)    ],
    filters:    ['render',      this.filterInit.bind(this)    ],
  }, this.initDone.bind(this));
}

HTMLApi.prototype.titleUpdate = function(cb)
{
  document.title = "API: " + (this._data.displayName || this._data.name || this._data.id || this._data.type);

  if ( cb )
    cb();
}

HTMLApi.prototype.schemasLoad = function(cb)
{
  if ( !this._data )
  {
    return cb("No data");
  }

  var link;
  if ( this._data.links && this._data.links.schemas )
  {
    link = this._data.links.schemas;
  }

  if ( link )
  {
    this.ajax(link, cb);
  }
  else
  {
    return cb("No schemas link");
  }
}


HTMLApi.prototype.schemasMunge = function(cb, results)
{
  var schemas = results.rawSchema;

  if ( !schemas || !schemas.data )
    return cb('No schema data');

  var out = {};
  var i, schema;
  for ( i = 0 ; i < schemas.data.length ; i++ ) 
  {
    schema = schemas.data[i];
    out[schema.id] = this.schemaMunge(schema);
  }

  this._schemas = out;
  cb(undefined, out);
}

HTMLApi.prototype.schemaMunge = function(schema)
{
  // Split complex types like reference[something] into base and sub type
  if ( schema.resourceFields )
  {
    for ( var k in schema.resourceFields )
    {
      this.fieldMunge(schema.resourceFields[k]);
    }
  }

  // Sort filter modifiers
  var filter;
  var order = {'': 1, 'eq':2, 'ne': 3, 'lte':4, 'lt':5, 'gt':6, 'gte':7};
  for ( var k in schema.collectionFilters )
  {
    filter = schema.collectionFilters[k];

    if ( filter && filter.modifiers)
    {
      filter.modifiers.sort(function(a,b) {
        var ia = order[a];
        if ( !ia )
          return 1;

        var ib = order[b];
        if ( !ib )
          return -1;

        return ia-ib;
      });
    }
  }

  return schema;
}

HTMLApi.prototype.fieldMunge = function(field)
{
  var field, match, match2;
  if ( match = field.type.match(/^([^\[]+)\[(.+)\]$/) )
  {
    field._baseType = match[1];

    if ( match2 = match[2].match(/^([^\[]+)\[(.+)\]$/) )
    {
      field._subType = match2[1];
      field._subSubType = match2[2];
    }
    else
    {
      field._subType = match[2];
      field._subSubType = '';
    }
  }
  else
  {
    field._baseType = field.type;
    field._subType = '';
    field._subSubType = '';
  }

  return field;
}

HTMLApi.prototype.render = function(cb)
{
  var jsonHtml = this._formatter.valueToHTML(this._data)

  var tpl = {
    data: this._data,
    docs: this._docs
  };

  document.body.innerHTML = Handlebars.templates['body.hbs'](tpl);
  $('#json').html(jsonHtml);

  this.addCollapsers();

  $('#operations').html('<span class="inactive">None</span>');
  $('#actions').html('<span class="inactive">None</span>');
  $('#filters').html('<span class="inactive">None</span>');
  
  return cb();
}

HTMLApi.prototype.addCollapsers = function()
{
  var items = $('UL.collapsible');
  for( var i = 0; i < items.length; i++)
  {
    this.addCollapser($(items[i]).parent());
  }
}

HTMLApi.prototype.addCollapser = function(item)
{
  // This mainly filters out the root object (which shouldn't be collapsible)
  if ( item.nodeName != 'LI' )
    return;
  
  var collapser = $('<div/>', {
    "class": "collapser",
    text: '-',
    click: JSONFormatter.prototype.collapse
  });
  item.insertBefore(collapser, item.firstChild);
}

HTMLApi.prototype.initDone = function(err, results)
{
  if ( err )
  {
    alert(err);
    return;
  }

  $('#header-body').css('visibility','visible');
  $('#json').css('padding-top', $('#header')[0].offsetHeight + 'px');
}

HTMLApi.prototype.getSchema = function(type, obj)
{
  if ( !obj )
    obj = this._data;

  // support this.getSchema() for the top-level resource
  if ( !type && obj )
  {
    if ( obj.type == 'collection' )
      type = obj.resourceType;
    else
      type = obj.type;
  }

  if ( type && this._schemas && this._schemas[type] )
    return this._schemas[type];

  return null;
}

// ----------------------------------------------------------------------------

HTMLApi.prototype.operationInit = function(cb)
{
  var html = '';
  var schema = this.getSchema();
  var data = this._data;

  if ( !data )
    return cb('No data');

  var type = data.type;

  var upEnabled = true;
  if ( data.type == 'collection' && (data.resourceType||'').toLowerCase() == 'apiversion' )
    upEnabled = false;

  html += '<input type="button" onclick="htmlapi.up();" value="Go Up"' + (upEnabled ? '' : ' DISABLED')+'>&nbsp;';
  html += '<input type="button" onclick="htmlapi.reload();" value="Reload"><br/>';

  if ( schema )
  {
    var methods = ( type == 'collection' ? schema.collectionMethods : schema.resourceMethods );
    var order = {'POST': 1, 'PUT': 2, 'DELETE': 3}
    methods.sort(function(a,b) {
      var ia = order[a];
      if ( !ia )
        return -1;

      var ib = order[b];
      if ( !ib )
        return 1;

      return ia-ib;
    });

    var method;
    for ( var i = 0, len = methods.length ; i < len ; i++ )
    {
      method = methods[i].toUpperCase();

      switch ( method )
      {
      case 'POST':
        html += '<input type="button" onclick="htmlapi.create(this);" value="Create">&nbsp;';
        break;
      case 'DELETE':
        html += '<input type="button" onclick="htmlapi.remove(this);" value="Delete">&nbsp;';
        break;
      case 'PUT':
        html += '<input type="button" onclick="htmlapi.update(this);" value="Edit">&nbsp;';
        break;
      default:
        break; 
      }
    }
  }

  $('#operations').html(html);
  cb();
}

// ----------------------------------------------------------------------------

HTMLApi.prototype.actionInit = function(cb)
{
  if ( !(this.data && this.data.actions) )
  {
    return;
  }

  var html = '<select name="action" id="action">';

  for ( var k in this.data.actions )
  {
    html += '<option value="'+ k.escape() +'">' + k.escape() + '</option>';
  }

  html += '</select><br/><input type="submit" name="do" value="Go"/>'; 
  $('actions').innerHTML = html;
  cb();
}

HTMLApi.prototype.actionLoad = function(name, obj, body)
{
  var self = this;

  this.lastBody = body||this.lastBody||{};

  if ( !obj )
    obj = this.data;

  var isCollection = (obj.type == 'collection');

  // The schema for the type of object we have
  var objSchema = this.getSchema(null,obj);

  // The description of the input and output for this action
  var actionSchema = (isCollection ? objSchema.collectionActions[name] : objSchema.resourceActions[name]);

  // The schema for the input
  var actionInput = {};
  if ( actionSchema.input )
    actionInput = this.getSchema(actionSchema.input);

  var url = obj.actions[name];

  var popin = self.getPopin(name+' action','',[]);
  popin.setLoading();
  popin.show();

  self.loadReferenceOptions(actionSchema, display);

  function display()
  {
    var tpl = new Template();
    tpl.assign('fields', actionInput.resourceFields);
    tpl.assign('action', name);
    tpl.assign('data', self.lastBody);

    var retry = function()
    {
      self.actionLoad(name,obj);
    }

    var html = tpl.fetch('htmlapi/edit');
    var method = 'POST';
    var popinActions = [
      {name: 'ok',      label: 'Show Request', on_enter: true, action: function() { self.showRequest(method,actionInput,retry,url); }.bind(self) },
      {name: 'cancel',  label: 'Cancel', display_as: 'link', on_escape: true, action: function() { self.popin.hide(); }.bind(self) }
    ];

    popin.setBody(html);
    popin.setActions(popinActions);
  }
}

// ----------------------------------------------------------------------------

HTMLApi.prototype.filterInit = function(cb)
{
  var name, list, i, v, modifier, pos;
  var schema = this.getSchema();

  if ( this._data.type != 'collection' || !schema || !schema.collectionFilters )
    return;

  var filters = [];
  var canFilter = false;
  this._filterId = 0;
  if ( this._data.filters )
  {
    for ( name in this._data.filters )
    {
      if ( schema.collectionFilters[name] )
        canFilter = true;

      list = this._data.filters[name];
      
      if ( !list )
        continue;

      for ( i = 0 ; i < list.length ; i++ )
      {
        v = list[i];
        filters.push({
          id: this._filterId++,
          name: name,
          modifier: (v.modifier == "eq" ? "" : v.modifier) || "",
          value: v.value
        });
      }
    }
  }

  var html = Handlebars.templates['filters.hbs']({
    canFilter: canFilter,
    hasFilters: (filters.length > 0)
  });
  $('#filters').html(html);

  for ( var i = 0 ; i < filters.length ; i++ )
  {
    v = filters[i];

    html = Handlebars.templates['filter.hbs']({
      allFilterSchema: schema.collectionFilters,
      thisFilterSchema: schema.collectionFilters[v.name],
      cur: v
    });
    $('#filter-body').append(html);
  }

  cb();
}

HTMLApi.prototype.filterAdd = function(name, modifier, value, before)
{
  var schema = this.getSchema();
  var schemaFilters = schema.collectionFilters;

  if ( !name )
  {
    // Get the first filter name
    name = schemaFilters[ HTMLApi.objectKeys(schemaFilters)[0] ];
  }

  var cur = {
    name:     name,
    modifier: modifier || 'eq',
    value:    value || ''
  };

  html = Handlebars.templates['filter.hbs']({
    allFilterSchema: schemaFilters,
    thisFilterSchema: schemaFilters[name],
    cur: cur
  });

  if( before )
    $(before).before(html);
  else
    $('#filter-body').append(html);

  $('#no-filters').hide();
}

HTMLApi.prototype.filterRemove = function(elem)
{
  var $div = $(elem).parents('.filter');
  $div.remove();

  var $rows = $('#filter-body DIV');
  $('#no-filters').toggle($rows.length == 0);
}

HTMLApi.prototype.filterChange = function(elem)
{
  var $elem = $(elem);

  var name = $elem.val();
  var $row = $elem.parents('.filter');
  var prefix = $row.data('prefix');
  var next = $row.next()[0];

  var  modifier = $('#'+prefix+'_modifier').val();
  var  value = $('#'+prefix+'_value').val();

  this.filterRemove(elem);
  this.filterAdd(name, modifier, value, next);
}

HTMLApi.prototype.modifierChange = function(elem)
{
  var $elem = $(elem);
  var modifier = $elem.val();
  var $row = $elem.parents('.filter');
  var prefix = $row.data('prefix');
  var $input = $(prefix+'_value');

  $input.toggle( (modifier != 'null' && modifier != 'notnull') );
}

HTMLApi.prototype.filterApply = function(clear)
{
  var $rows = $('#filters DIV.filter');
  var $row,name,modifier,value;

  var query = '';

  if ( !clear )
  {
    for ( var i = 0 ; i < $rows.length ; i++ )
    {
      $row      = $($rows[i]); 
      prefix    = $row.data('prefix');
      name      = $('#'+prefix+'_name').val();
      modifier  = $('#'+prefix+'_modifier').val();
      value     = $('#'+prefix+'_value').val();

      // Null/NotNull have no value, otherwise if there's no value ignore the filter
      if ( value === "" && (modifier != 'null' && modifier != 'notnull') )
        continue;

      // Equals doesn't need an explicit modifier
      if ( modifier == 'eq' )
        modifier = false;
      
      query += (query ? '&' : '?') + escape(name) + (modifier ? '_'+modifier : '') + (value ? '=' + escape(value) : '');
    }
  }

  window.location.href = window.location.href.replace(/\?.*$/,'') + query;
}

HTMLApi.prototype.filterClear = function()
{
  this.filterApply(true);
}

// ------------------------------

HTMLApi.prototype.keyFormatter = function(key,obj, path)
{
  var html = this._formatter.jsString(key);

  path = path||[];
  var parentKey = path[path.length-1] || '';

  if ( parentKey == 'createTypes' )
  {
    var schema = this.getSchema(key);
    if ( schema )
    {
      html = '<a class="keylink" href="' + schema.links['self'] + '">' + html + '</a>';
    }
  }
  else if ( parentKey == 'actions' )
  {
    var dataVar = 'htmlapi.data';
    for ( var i = 0 ; i < path.length-1 ; i++ )
    {
      dataVar += "['"+ path[i] + "']";
    }

    html = '<a class="keylink" href="#" onclick="htmlapi.actionLoad(\''+ key + '\',' + dataVar + ',{}); return false;">' + html + '</a>';
  }

  return html;
}

HTMLApi.prototype.valueFormatter = function(key,obj, path)
{
  path = (path||[]).slice(0);
  path.push(key);

  var html = this._formatter.valueToHTML(obj[key], path);

  if ( obj[key] && (key == 'type' || key == 'resourceType') )
  {
    var schema = this.getSchema(obj[key]);
    if ( schema )
    {
      html = '<a class="valuelink" href="' + schema.links['self'] + '">' + html + '</a>';
    }
  }

  return html;
}

HTMLApi.prototype.ajax = function(url, cb)
{
  jQuery.ajax({
    url: URLParse.updateQuery(url,{_format: 'json'}),
    dataType: 'json',
    success: function(data) { cb(null,data) },
    error: function(jqxhr, msg, exception) { cb(msg) }
  });
}

HTMLApi.objectKeys = Object.keys || function(o) 
{
  var result = [];
  for(var name in o) {
      if (o.hasOwnProperty(name))
        result.push(name);
  }
  return result;
};
