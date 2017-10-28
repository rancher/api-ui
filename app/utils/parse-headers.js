import { ucFirst } from 'api-ui/utils/util';

export function parseHeaders(str) {
  const lines = str.split(/\r?\n/);
  const out = {};

  lines.forEach((line) => {
    let [key, ...value] = line.split(':');
    if ( typeof value !== 'string' ) {
      value = value.join(':');
    }

    if ( key ) {
      key = formatKey(key.trim());
      out[key] = value.trim();
    }
  });

  return out;
}

export function formatKey(str) {
  return (str||'').dasherize().split('-').map((piece) => {
    return ucFirst(piece);
  }).join('-');
}
