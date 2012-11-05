function URLParse()
{
}

URLParse.updateQuery = function(url,assoc)
{
  var parts = url.split('?',2);
  var base = parts[0];
  var query = URLParse.queryStringToAssoc(parts[1]||'');

  var v;
  for ( var k in assoc )
  {
    if ( !assoc.hasOwnProperty(k) )
    {
      continue;
    }

    v = assoc[k];
    if ( v === null )
    {
      delete query[k];
    }
    else
    {
      query[k] = v;
    }
  }

  var out = base + URLParse.assocToQueryString(query);
  return out;
}

URLParse.queryStringToAssoc = function(qs)
{
  if (qs.length == 0)
    return [];

  // Ignore ?
  qs = qs.replace(/^\?/,'');

  // Turn <plus> back to <space>
  qs = qs.replace(/\+/g, ' ')

  // parse out name/value pairs separated via &
  var args = qs.split('&')

  // split out each name=value pair
  var pair, name, value;
  var qs_assoc = [];
  for (var i=0 ; i < args.length ; i++ )
  {
    pair = args[i].split('=');
    name = unescape(pair[0]);

    if (pair.length == 2)
      value = unescape(pair[1]);
    else
      value = '';

    if ( name.match(/\[\]$/) )
    {
      name = name.replace(/\[\]$/, '');
      if ( !qs_assoc[name] )
      {
        qs_assoc[name] = [];
      }

      qs_assoc[name][qs_assoc[name].length] = value;
    }
    else
    {
      qs_assoc[name] = value;
    }
  }

  return qs_assoc;
}

URLParse.assocToQueryString = function(assoc)
{
  var ret = '';

  var v;
  for ( var k in assoc )
  {
    if ( !assoc.hasOwnProperty(k) )
    {
      continue;
    }

    v = assoc[k];
    ret += (ret ? '&' : '?') + escape(k) + '=' + escape(v);
  }

  return ret;
}
