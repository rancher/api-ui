/**
* Cookie handling
*
* @package Base
* @author Vincent Fiduccia <vincent@godaddy.com>
* @since 1.0
*/
function Cookie() {};

Cookie.set = function(name,value,expire,path,domain,secure)
{
  var expire_date;
  if ( typeof(expire) == 'object' )
    expire_date = expire;
  else if ( expire )
    expire_date = new Date( (new Date()).getTime() + (86400000 * expire));

  var str = name +'=' + escape(value);

  if ( expire )
    str += ';expires=' + expire_date.toGMTString();

  if ( path )
    str += ';path=' + path;

  if ( domain )
    str += ';domain=' + domain;

  if ( secure )
    str += ';secure';

  try
  {
    document.cookie = str;
  }
  catch ( e )
  {
    return false;
  }
  return true;
}

Cookie.get = function(name)
{
  var all = Cookie.getAll();

  if ( typeof( all[name] ) == 'undefined' )
    return false;

  return all[name];
}

Cookie.getAll = function()
{
  var cookies = document.cookie.split(/;\s*/);
  var tmp,name,val;
  var ret = {};

  for ( var i = 0 ; i < cookies.length ; i++ )
  {
    tmp = cookies[i].split(/=/);
    name = tmp[0].trim();

    if ( !name )
      continue;

    if ( tmp.length > 1 )
      val = unescape(tmp[1].trim());
    else
      val = '';

    ret[ name ] = val;
  }

  return ret;
}

Cookie.remove = function(name)
{
  document.cookie = name+'=null; expires=Wed, 24 Feb 1982 18:42:00 UTC; path=/';
}
