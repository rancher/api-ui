if ( !Object.keys )
{
  Object.keys = function (o) 
  {
    var result = [];
    for(var name in o) {
        if (o.hasOwnProperty(name))
          result.push(name);
    }
    return result;
  };
}

if ( !Array.prototype.indexOf )
{
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
        throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0) {
        return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
        n = Number(arguments[1]);
        if (n != n) { // shortcut for verifying if it's NaN
            n = 0;
        } else if (n != 0 && n != Infinity && n != -Infinity) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
    }
    if (n >= len) {
        return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
        if (k in t && t[k] === searchElement) {
            return k;
        }
    }
    return -1;
  }
}

String.prototype.splitLimit = function(delim,limit)
{
  delim = delim.toString();
  var parts = this.split(delim);

  if ( !limit )
  {
    return parts;
  }

  var a = parts.splice(0, limit-1)
  var b = parts.join(delim);

  a.push(b);

  return a;
}
