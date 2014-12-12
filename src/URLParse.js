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

URLParse.parse = function(url)
{
/**
 * See: https://gist.github.com/1847816
 * Parse a URI, returning an object similar to window.location
 */

  var res = {};

  var a = document.createElement('a');
  a.href = url;

  var keys = ['protocol','hostname','host','pathname','port','search','hash','href'];
  var i, k, v;
  for (i = 0 ; i < keys.length ; i++ )
  {
    k = keys[i];
    v = a[k];

    if ( k == 'pathname' && v.substr(0,1) != '/' )
    {
      v = '/' + v; // IE doesn't put a leading slash on pathnames of A-tags, but does on window.location
    }

    res[k] = v;
  }

  res.toString = function() { return anchor.href; };
  res.requestUri = res.pathname + res.search;  
  return res;
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

URLParse.generateHash = function(length,which)
{
  length = length || 12;
  which = which || 'full';

  var chars;
  if ( which == 'hex' )
    chars = '0123456789abcdef';
  else
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234556789';

  var str = "";
  for ( var i = 0 ; i < length ; i++ )
    str += chars.substr( Math.floor(Math.random()*chars.length), 1 );

  return str;
}
