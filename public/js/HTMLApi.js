"use strict";

function HTMLApi(data, docs, cb)
{
  this._schemas     = null;
  this._data        = data;
  this._docs        = docs;
  this._filterId    = 0;

  this._reqModal    = null;
  this._editSchema  = null;
  this._lastBody    = null;
  this._lastOpt     = null;

  this.referenceDropdownLimit = 100;

  this._formatter = new JSONFormatter({
    baseUrl: window.location.protocol +"//" + window.location.host,
    keyFormatter: this.keyFormatter.bind(this),
    valueFormatter: this.valueFormatter.bind(this)
  });

  async.auto({
    title:                      this.titleUpdate.bind(this),
    rawSchema:                  this.schemasLoad.bind(this),
    schema:     ['rawSchema',   this.schemasMunge.bind(this)  ],
  }, initDone);

  function initDone(err, results)
  {
    if ( err )
      alert('Error loading UI: ' + err);
    else
      cb();
  }
}

HTMLApi.prototype.show = function(cb)
{
  async.auto({
    render:                     this.render.bind(this)         ,
    operations: ['render',      this.operationInit.bind(this) ],
    actions:    ['render',      this.actionInit.bind(this)    ],
    filters:    ['render',      this.filterInit.bind(this)    ],
  }, showDone);

  function showDone(err, results)
  {
    if ( err )
    {
      alert('Error loading UI: ' + err);
      return;
    }

    $('#header-body').css('visibility','visible');
    $('#json').css('padding-top', $('#header')[0].offsetHeight + 'px');
    if ( cb )
      cb();
  }
}

HTMLApi.prototype._setupModal = function(html)
{
  if ( this._reqModal )
  {
    this._reqModal.sfDialog('close');
    this._reqModal.remove();
    this._reqModal = null;
  }

  if ( !html )
  {
    html = '<div class="loading"></div>';
  }

  this._reqModal = $('<div style="width: 700px;"/>').html(html);
  return this._reqModal;
}

HTMLApi.prototype.showModal = function(html,in_opt,cb)
{
  var self = this;

  var opt = {
    destroyOnClose: false,
    dialogHeightMin: 100,
    buttons: [
      {id: 'cancel',  text: 'Cancel', cancel: true }
    ]
  };
  
  var k = Object.keys(in_opt);
  for ( var i = 0 ; i < k.length ; i++ )
  {
    opt[ k[i] ] = in_opt[ k[i] ];
  }

  self._setupModal(html);
  require('starfield/sf.dialog', function() {
    self._reqModal.sfDialog(opt);
    cb(self._reqModal);
  });
}

HTMLApi.prototype.replaceModal = function(html)
{
  this._reqModal.html(html);
}

HTMLApi.prototype.titleUpdate = function(cb)
{
  document.title = "API: " + (this._data.displayName || this._data.name || this._data.id || this._data.type);

  if ( cb )
    async.nextTick(cb);
}

HTMLApi.prototype.schemasLoad = function(cb)
{
  if ( !this._data )
    return async.nextTick(function() { cb("No data") });

  var link;
  if ( this._data.links && this._data.links.schemas )
    link = this._data.links.schemas;

  if ( link )
  {
    this.ajax('GET', link, function(err,res) {
      cb(err,res);
    });
  }
  else
  {
    return async.nextTick(function() { cb("No schemas link") });
  }
}


HTMLApi.prototype.schemasMunge = function(cb, results)
{
  var schemas = results.rawSchema;

  if ( !schemas || !schemas.data )
    return async.nextTick(function() { cb("No schema data") });

  var out = {};
  var i, schema;
  for ( i = 0 ; i < schemas.data.length ; i++ ) 
  {
    schema = schemas.data[i];
    out[schema.id] = this._schemaMunge(schema);
  }

  this._schemas = out;
  return async.nextTick(function() { cb(undefined,out); });
}

HTMLApi.prototype._schemaMunge = function(schema)
{
  // Split complex types like reference[something] into base and sub type
  if ( schema.resourceFields )
  {
    for ( var k in schema.resourceFields )
    {
      this._fieldMunge(schema.resourceFields[k]);
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

HTMLApi.prototype._fieldMunge = function(field)
{
  field._typeList = field.type.replace(/\]+$/,'').split(/\[/);
  return field;
}

HTMLApi.prototype.render = function(cb)
{
  var jsonHtml = this._formatter.valueToHTML(this._data)

  var tpl = {
    data: this._data,
    docs: this._docs
  };

  document.body.innerHTML = Handlebars.templates['body'](tpl);
  $('#json').html(jsonHtml);

  this._addCollapsers();

  $('#operations').html('<span class="inactive">None</span>');
  $('#actions').html('<span class="inactive">None</span>');
  $('#filters').html('<span class="inactive">None</span>');
  
  return async.nextTick(cb);
}

HTMLApi.prototype._addCollapsers = function()
{
  var items = $('UL.collapsible');
  for( var i = 0; i < items.length; i++)
  {
    this._addCollapser($(items[i]).parent());
  }
}

HTMLApi.prototype._addCollapser = function(item)
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
  async.nextTick(cb);
}

// ----------------------------------------------------------------------------

HTMLApi.prototype.actionInit = function(cb)
{
  var data = this._data;

  if ( !data.actions )
    return async.nextTick(cb);
    
  var html = Handlebars.templates['actions']({
    actions: data.actions
  });
  $('#actions').html(html);

  async.nextTick(cb);
}

HTMLApi.prototype.actionLoad = function(name, obj, body)
{
  var self = this;

  this._lastBody = body||this._lastBody||{};

  if ( !obj )
    obj = this._data;

  var isCollection = (obj.type == 'collection');

  // The schema for the type of object we have
  var objSchema = this.getSchema(null,obj);

  // The description of the input and output for this action
  var actionSchema = (isCollection ? objSchema.collectionActions[name] : objSchema.resourceActions[name]);

  // The schema for the input
  var actionInput = {};
  if ( actionSchema.input )
    actionInput = this.getSchema(actionSchema.input);

  this._editSchema = actionInput;
  var url = obj.actions[name];
  var title = 'Action: ' + name;

  self.showModal(null, {title: title}, shown);
  
  function shown(modal) 
  {
    self.loadReferenceOptions(actionSchema, ready);

    function ready()
    {
      var rows = [];
      
      var tpl = {};
      var mode = 'action';
      tpl.fields = self._flattenFields(mode, actionInput, self._lastBody);
      tpl.hasFields = tpl.fields.length > 0;
      tpl.mode = mode;
      tpl.createTypes = {};

      var retry = function()
      {
        self.actionLoad(name, obj);
      }

      var html = Handlebars.templates['edit'](tpl);
      var popinActions = [
        {id: 'ok',      text: 'Show Request', /*on_enter: true, */ onClick: function() { self.showRequest('POST',actionInput,retry,url); }.bind(self) },
        {id: 'cancel',  text: 'Cancel', cancel: true }
      ];

      
      self.replaceModal(html);
      modal.sfDialog('setButtons',popinActions);
      modal.sfDialog('resize');
    }
  }
}

// ----------------------------------------------------------------------------

HTMLApi.prototype.filterInit = function(cb)
{
  var name, list, i, v, modifier, pos;
  var schema = this.getSchema();

  if ( this._data.type != 'collection' || !schema || !schema.collectionFilters )
    return async.nextTick(cb);

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

  var html = Handlebars.templates['filters']({
    canFilter: canFilter,
    hasFilters: (filters.length > 0)
  });
  $('#filters').html(html);

  for ( var i = 0 ; i < filters.length ; i++ )
  {
    v = filters[i];

    html = Handlebars.templates['filter']({
      allFilterSchema: schema.collectionFilters,
      thisFilterSchema: schema.collectionFilters[v.name],
      cur: v
    });
    $('#filter-body').append(html);
  }

  async.nextTick(cb);
}

HTMLApi.prototype.filterAdd = function(name, modifier, value, before)
{
  var schema = this.getSchema();
  var schemaFilters = schema.collectionFilters;

  if ( !name )
  {
    // Get the first filter name
    name = schemaFilters[ Object.keys(schemaFilters)[0] ];
  }

  var cur = {
    name:     name,
    modifier: modifier || 'eq',
    value:    value || ''
  };

  html = Handlebars.templates['filter']({
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
    var dataVar = 'htmlapi._data';
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

  if ( !obj[key] )
    return html;

  if ( key == 'id' && obj.links && obj.links['self'] )
  {
    html = '<a class="valuelink" href="' + obj.links['self'] + '">' + html + '</a>';
  }
  else if (key == 'type' || key == 'resourceType')
  {
    var schema = this.getSchema(obj[key]);
    if ( schema )
    {
      html = '<a class="valuelink" href="' + schema.links['self'] + '">' + html + '</a>';
    }
  }

  return html;
}

HTMLApi.prototype.ajax = function(method, url, body, cb)
{
  if ( typeof body == 'function' )
  {
    cb = body;
    body = null;
  }

  if ( body && typeof body == 'object' )
  {
    body = JSON.stringify(body);
  }

  var res;
  res = jQuery.ajax({
    type: method||'GET',
    data: body,
    contentType: 'application/json',
    headers: {
      'Accept' : 'application/json'
    },
    url: url,
    dataType: 'json',
    success: function(data, msg, jqxhr) { cb(null,data, jqxhr); },
    error: function(jqxhr, msg, exception) { 
      var body = null;
      try {
        body = jQuery.parseJSON(jqxhr.responseText);
      }
      catch (e) {
        body = jqxhr.responseText;
      }

      cb(msg, body, jqxhr); 
    }
  });
}

// ------------------------------

HTMLApi.prototype.up = function()
{
  window.location.href = window.location.href.replace(/[^\/]+\/?$/,'');
}

HTMLApi.prototype.reload = function()
{
  window.location.href = window.location.href.replace(/#.*/,'');
}

HTMLApi.prototype.logout = function()
{
  window.location.href = window.location.href.replace(/\/\//,"//logout@");  
}

HTMLApi.prototype.request = function(method,body,opt,really)
{
  var self = this;
  method = method || 'GET';
  opt = opt || {};

  this._lastOpt = opt;
  this._lastBody = body;

  var url = opt.url || this._data.links.self || window.location.href;
  var urlParts = URLParse.parse(url);

  var realUrl = url;
  var realMethod = method;
  if ( method != 'POST' )
  {
    realUrl = URLParse.updateQuery(url,{'_method': method});
    realMethod = 'POST';
  }

  if ( really )
  {
    this._reqModal.sfDialog('setButtons', [
      {id: 'cancel', text: 'Cancel', cancel: true}
    ]);

    $('#notsent').hide();
    $('#waiting').show();
    $('#result' ).hide();

    if ( opt.blobs )
    {
      var form = this.oldPopin.getForm();
      form.encoding = 'multipart/form-data';
      form.action = Utils.updateQuery(url,{_format: 'json'});
      form.method = method;

      // Move all the file inputs to the end
      var fields = form.getElementsByTagName('INPUT');
      var field;
      for ( var i = fields.length-1 ; i >= 0 ; i-- )
      {
        field = fields[i];
        if ( field.type == 'file' )
        {
          $L.detach(field);
          form.appendChild(field);
        }
      }

      var iframe = $L.create('IFRAME',{id: 'post_iframe'},{display: 'none'}, form);
      iframe.onload = this.postDone.bind(this);
      form.target = 'post_iframe'
      form.submit();
    }
    else
    {
      this.ajax('POST', realUrl, body||'', function(err,body,jqxhr) { self.requestDone(err,body,jqxhr); });
    }

    return;
  }

  var tpl = {
    method: method,
    host: urlParts.host,
    path: urlParts.requestUri,
    baseUrl: urlParts.protocol+'//'+urlParts.host,
  };

  if ( opt.blobs )
  {
    var rawBody = {};
    var keys = Object.keys(body);
    var key;
    for ( var i = 0 ; i < keys.length ; i++ )
    {
      key = keys[i];
      if ( opt.blobs[i] )
        rawBody[key] = { blob: true, value: body[key] };
      else
        rawBody[key] = { blob: false, value: body[key] };
    }

    var boundary = URLParse.generateHash(16);
    tpl.rawBody = rawBody;
    tpl.boundary = boundary;
    tpl.contentType = 'multipart/form-data; boundary='+ boundary;
  }
  else if ( typeof body == 'object' )
  {
    var json = JSON.stringify(body);
    var formatted = this._formatter.valueToHTML(body);
    tpl.body = json.replace(/,/g,", ");
    tpl.prettyBody = formatted;
    tpl.contentLength = json.length;
    tpl.contentType = 'application/json';
  }

  var html = Handlebars.templates['request'](tpl);

  self._setupModal(html);

  require('starfield/sf.dialog', function() {
    self._reqModal.sfDialog({
      destroyOnClose: false,
      title: 'API Request',
      buttons: [
        {id: 'ok',      text: 'Send Request', onClick: function() { self.request(method,body,opt,true); } },
        {id: 'cancel',  text: 'Cancel', cancel: true}
      ],
    });
    self._reqModal.sfDialog('resize');
  });
}

HTMLApi.prototype.postDone = function()
{
  var body = $('#post_iframe').contents()[0].body;
  var text = body.innerText || body.textContent;
  var json = JSON.parse(text);
  this.requestDone(undefined,json);
}

HTMLApi.prototype.requestDone = function(err, body, res)
{
  var tpl = {};

  if ( err && !body )
  {
    alert('Error: ' + err);
    return;
  }

  if ( res )
  {
    var headers = [];
    var lines = res.getAllResponseHeaders().trim().split(/\r?\n/);
    var parts;
    for ( var i = 0 ; i < lines.length ; i++ )
    {
      parts = lines[i].splitLimit(':',2);
      headers.push({name: parts[0].trim(), value: parts[1].trim()});
    }

    tpl.res = res;
    tpl.responseHeaders = headers;
  }

  var html = Handlebars.templates['response'](tpl);

  var out = '';
  var selfUrl = false;
  if ( body )
  {
    if ( typeof body == 'object' )
    {
      if ( body.links && body.links.self )
        selfUrl = body.links.self;

      out = this._formatter.valueToHTML(body)
    }
    else
    {
      out = $('<div/>').text(body.toString()).html();
    }
  }

  var loc;
  if ( res )
  {
    loc = res.getResponseHeader('Location');
  }

  var retry = (typeof body != 'object' || (body.type && body.type == 'error') ) && this._lastOpt.retry;

  var popinActions = [
      {id: 'reload',  text: 'Reload', /*on_enter: (loc ? false : true),*/     onClick: this.reload.bind(this)},
      {id: 'up',      text: 'Go Up',                                      onClick: function() { this.up(); }.bind(this) },
      {id: 'cancel',  text: 'Close', cancel: true}
  ];

  if ( loc )
  {
    popinActions.unshift({id: 'follow', text: 'Follow Location', /*on_enter: !retry,*/ onClick: function() { window.location.href = loc }});
  }
  else if ( selfUrl )
  {
    popinActions.unshift({id: 'followSelf', text: 'Follow Self Link', /*on_enter: !retry,*/ onClick: function() { window.location.href = selfUrl }});
  }

  if ( retry )
  {
    popinActions.unshift({id: 'edit', text: 'Edit & Retry', /*on_enter: true,*/ onClick: this._lastOpt.retry.bind(this) });
  }

  
  this._reqModal.sfDialog('setButtons', popinActions);
  $('#notsent').hide();
  $('#waiting').hide();
  $('#result').html(html);
  $('#response-body').html(out);
  $('#result' ).show();
  this._reqModal.sfDialog('resize');
}

HTMLApi.prototype.create = function()
{
  var self = this;
  var data = {};
  var k, v;
  var schema = this.getSchema();
  
  // Apply schema defaults
  for ( k in schema.resourceFields )
  {
    v = schema.resourceFields[k];
    data[k] = '';
    if ( v['default'] )
    {
      data[k] = v['default'];
    }
  }

  // Apply response defaults
  if ( this._data.createDefaults )
  {
    for ( k in this._data.createDefaults )
    {
      data[k] = this._data.createDefaults[k];
    }
  }

  if ( this._data.createTypes && schema.resourceFields.type && schema.resourceFields.type.create )
  {
    var type = data.type;

    schema.resourceFields.type._typeList = ['__type__'];
    schema.resourceFields.type.options = Object.keys(this._data.createTypes);

    // Make sure the selected type exists in the createTypes list
    if ( !type || !this._data.createTypes[type] )
      type = Object.keys(this._data.createTypes)[0];

    this.createTypeChanged(type,true);
    this._lastBody = data;
  }
  else
  {
    this.showEdit(data, false, schema);
  }
}

HTMLApi.prototype.loadReferenceOptions = function(schema,doneCb)
{
  var self = this;

  function getReferences(task, cb)
  {
    function gotReferences(err,res)
    {
      if ( res.pagination && res.pagination.partial )
      {
        // Too many...
      }
      else
      {
        var opt = {};
        var i, obj, label;
        for ( i = 0 ; i < res.data.length ; i++ )
        {
          obj = res.data[i]; 
          if ( obj.displayName )
            label = obj.displayName + ' (' + obj.id + ')';
          else if ( obj.name )
            label = obj.name + ' (' + obj.id + ')';
          else
            label = obj.id;
          
          opt[ obj.id ] = label;
        }

        schema.resourceFields[task.field].options = opt;
      }

      cb();
    }

    self.ajax('GET', URLParse.updateQuery(task.url,{_format: 'json', limit: self.referenceDropdownLimit, 'removed_null': 1}), gotReferences);
  }

  var q = async.queue(getReferences, 1);
  q.drain = doneCb;

  var k, field, idxj;
  for ( k in schema.resourceFields )
  {
    field = schema.resourceFields[k];
    idx = field._typeList.indexOf('reference');
    if ( idx >= 0 )
    {
      if ( field.referenceCollection )
      {
        // Explicit collection URL to load
        q.push({field: k, url: field.referenceCollection});
      }
      else if ( field._typeList[idx+1] )
      {
        // Look for a collection URL in the schema for the referenced type
        var referenceSchema = this.getSchema(field._typeList[idx+1]);
        if ( referenceSchema && referenceSchema.links.collection)
        {
          q.push({field: k, url: referenceSchema.links.collection});
        }
      }
    }
  }

  if ( q.length() == 0 )
    q.drain();
}


HTMLApi.prototype.showEdit = function(data,update,schema,url)
{
  var self = this;
  if ( !schema )
  {
    return;
  }

  var mode = (update ? 'update' : 'create');

  this.loadReferenceOptions(schema, display); 
  this._editSchema = schema;

  function display()
  {
    var rows = [];
    
    var tpl = {};
    tpl.fields = self._flattenFields(mode, schema, data);
    tpl.hasFields = tpl.fields.length > 0;
    tpl.mode = mode;
    tpl.createTypes = self._data.createTypes || {};

    var retry = function()
    {
      self.showEdit(self._lastBody||data, update, schema);
    }

    var title = (update ? 'Edit' : 'Create') +' '+ schema.id;
    var html = Handlebars.templates['edit'](tpl);
    var method = (update ? 'PUT' : 'POST');
    var popinActions = [
      {id: 'ok',      text: 'Show Request', /*on_enter: true, */ onClick: function() { self.showRequest(method,schema,retry,url); }.bind(self) },
      {id: 'cancel',  text: 'Cancel', cancel: true }
    ];

    self._setupModal(html);
    require('starfield/sf.dialog', function() {
      self._reqModal.sfDialog({
        title: title,
        buttons: popinActions
      });
    });
  }
}

HTMLApi.prototype._flattenFields = function(mode,schema,data)
{
  var rows = [];
  var keys = Object.keys(schema.resourceFields);
  var name, field, row;
  for ( var i = 0 ; i < keys.length ; i++ )
  {
    name = keys[i];
    field = schema.resourceFields[name];
    row = this._flattenField(mode, name, field, data[name]);
    if ( row )
      rows.push(row);
  }

  return rows;
}

HTMLApi.prototype._flattenField = function(mode, name, field, data, depth)
{
  depth = depth || 0;

  var type = field._typeList[depth];

  if ( mode == 'update' || (mode == 'create' && field.create) || (mode == 'action') )
  {
    // The value input's name
    var formFieldName = name;

    // The key input's name, for maps
    var formFieldName2 = null;
    var subType;
    for ( var i = 0 ; i <= depth; i++ )
    {
      subType = field._typeList[i];
      if ( subType == 'array' )
      {
        formFieldName += '[]'; 
      }

      if ( subType == 'map' )
      {
        formFieldName2 = formFieldName+'.key{}';
        formFieldName += '.value{}';
      }
    }

    var row = {
      name: name,
      formFieldName: formFieldName,
      formFieldName2: formFieldName2,
      required: field.required || false,
      writable: (mode == 'action') || (mode == 'update' && field.update) || (mode != 'update' && field.create),
      type: type,
      field: field,
      children: null,
      value: ''
    };

    var displayType = field._typeList[ field._typeList.length - 1];
    var parentType  = field._typeList[ field._typeList.length - 2];
    if ( parentType && parentType == 'reference' )
    {
      var link = null;
      if ( field.referenceCollection )
      {
        link = field.referenceCollection;
      }
      else
      {
        var displaySchema = this.getSchema(displayType);
        if ( displaySchema )
        {
          link = displaySchema.links['self'];
        }
      }

      if ( link )
        displayType = '<a href="' + link + '">' + displayType + '</a>';
    }

    for ( var i = field._typeList.length - 2 ; i >= depth ; i-- )
    {
      displayType = field._typeList[i] + '[' + displayType + ']';
    }

    row.displayType = displayType;

    if ( type == 'map' )
    {
      row.children = [];
      var keys = Object.keys(data||{});
      var child;
      for ( var i = 0 ; i < keys.length ; i++ )
      {
        child = this._flattenField(mode, name, field, data[keys[i]], depth+1);
        child.value2 = keys[i];
        child.parentIsMap = true;
        row.children.push(child);
      }
    }
    else if ( type == 'array' )
    {
      row.children = [];
      for ( var i = 0 ; i < (data||[]).length ; i++ )
      {
        row.children.push( this._flattenField(mode, name, field, data[i], depth+1) );
      }
    }
    else
    {
      row.value = data;
    }

    return row;
  }

  return null;
}


HTMLApi.prototype.remove = function(really)
{
  this.request('DELETE');
}

HTMLApi.prototype.update = function()
{
  var schema = this.getSchema(this._data.type);

  var data = {};
  var k, v;
  for ( k in schema.resourceFields )
  {
    data[k] = this._data[k];
  }

  this.showEdit(data, true, schema)
}

HTMLApi.prototype.createTypeChanged = function(type,first)
{
  var self = this;
  var schema = this.getSchema(type);

  // Save the current values
  if ( first !== true )
  {
    var values = self.getEditValues(null, schema);
    self._lastBody = values.body;
    self._lastBody.type = type;
  }

  self.showEdit(self._lastBody, false, schema, this._data.createTypes[type] );
}

HTMLApi.prototype._flattenInputs = function($form)
{
  var serialized = $form.serializeArray();
  
  var i, j;
  var $files = $("INPUT[type='file']",$form);
  for ( i = 0 ; i < $files.length ; i++ )
  {
    serialized.push({name: $files[i].name, value: $($files[i]).val()});
  }

  var inputs = {};
  var k, field, v;
  var isArray, isMapKey, isMapValue, name, values;

  var maps = {};

  for ( i = 0 ; i < serialized.length ; i++ )
  {
    field = serialized[i];
    k = field.name;
    v = field.value;
    isArray = k.indexOf('[]') >= 0;
    isMapKey = k.indexOf('.key{}') >= 0;
    isMapValue = k.indexOf('.value{}') >= 0;

    if ( isArray )
    {
      name = k.replace(/\[\]$/,'');
      if ( typeof inputs[name] === "undefined" )
        inputs[name] = [];
      
      inputs[name].push(v);
    }
    else if ( isMapKey || isMapValue )
    {
      if ( isMapKey )
        name = k.replace(/\.key\{\}$/,''); 
      else if ( isMapValue )
        name = k.replace(/\.value\{\}$/,''); 

      if ( typeof maps[name] === 'undefined' )
      {
        maps[name] = {keys: [], values: []};
      }

      if ( isMapKey )
        maps[name].keys.push(v);
      if ( isMapValue )
        maps[name].values.push(v);
    }
    else
    {
      inputs[k] = v;
    }
  }

  var keys = Object.keys(maps);
  var map, subK;
  for ( i = 0 ; i < keys.length ; i++ )
  {
    k = keys[i];
    map = maps[k];
    inputs[k] = {};

    for ( j = 0 ; j < map.keys.length ; j++ )
    {
      subK = map.keys[j];
      if ( subK )
        inputs[k][subK] = map.values[j];
    }
  }

  return inputs;
}

HTMLApi.prototype.getEditValues = function(method, schema)
{
  var $form = $('#edit-form')
  var inputs = this._flattenInputs($form);

  var body = {};
  var blobs = null;
  var k, field, v;
  for ( k in schema.resourceFields )
  {
    field = schema.resourceFields[k];
    v = inputs[k];

    if ( field._typeList[0] == 'array' )
    {
      if ( !v || v.length == 0 )
        v = [];

      // Remove empty items
      for ( var i = v.length ; i >= 0 ; i-- )
      {
        if ( v[i] === "" )
        {
          v.splice(i,1);
        }
      }
    }

    // Don't include nullable fields if they have no value
    if ( v === "" && field.nullable )
    {
      continue;
    }

    if ( field.type == 'blob' )
    {
      if ( v )
      {
        var filename = this.extractFilename(v);
        if ( !blobs )
        {
          blobs = {};
        }
        blobs[k] = 1;
        body[k] = filename;
      }
    }
    else if ( field.type == 'boolean' )
    {
      if ( typeof v != 'undefined')
      {
        body[k] = (v == 1);
      }
    }
    else if ( typeof v != 'undefined' )
    {
      body[k] = v;
    }
    else if ( method == 'PUT' && typeof this._data[k] != 'undefined' )
    {
      body[k] = this._data[k];
    }
  }

  return {
    body: body,
    blobs: blobs
  };
}

HTMLApi.prototype.showRequest = function(method, schema, retry, url)
{
  var values = this.getEditValues(method,schema);

  var opt = {blobs: values.blobs};

  if ( retry )
    opt.retry = retry;

  if ( url )
    opt.url = url;

  this.request(method, values.body, opt);
}

HTMLApi.prototype.extractFilename = function(path)
{
  var sep = /[\/\\:]/;  // If nothing matches, use the any of the delimiters
  if ( path.match(/^\\/) || path.match(/^[^\\]:\\/) )
  {
    sep = "\\";
  }
  else if ( path.match(/^\//) )
  {
    sep = "/";
  }
  else if ( path.match(":") )
  {
    sep = ":";
  }

  var parts = path.split(sep);
  return parts[parts.length-1];
}

HTMLApi.prototype.subAdd = function(button, name)
{
  var schema = this._editSchema;
  var schemaField = schema.resourceFields[name];

  var parentField = this._flattenField('update',name,schemaField,{},0);

  var field = this._flattenField('update',name,schemaField,'',1);
  field.parentIsMap = parentField.type == 'map';

  var html = Handlebars.templates['field'](field);

  html = '<div><input type="button" onclick="htmlapi.subRemove(this);" value="-">' + html + '</div>';
  $(button).before(html);
  this._reqModal.sfDialog('resize');
}

HTMLApi.prototype.subRemove = function(button)
{
  var $div = $(button).parents('DIV');
  $($div[0]).remove();
  this._reqModal.sfDialog('resize');
}
