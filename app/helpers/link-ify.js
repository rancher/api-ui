import Ember from 'ember';
import { escapeHtml } from 'api-ui/utils/util';
import { htmlSafe} from '@ember/string';

export default Ember.Helper.extend({
  compute(params) {
    let url = params[0]||'';
    const origin = window.location.origin;

    if ( !url.match(/https?:\/\//) ) {
      return url;
    }

    let anchor = url;
    let prefix = '';
    let options = ' target="_blank" rel="nofollow noopener noreferrer"';

    if ( url.startsWith(origin) && url !== origin ) {
      prefix = '&hellip;';
      anchor = url.substr(origin.length);
      options = '';
    }

    return htmlSafe(`<a href="${escapeHtml(url)}"${options}>${prefix}${escapeHtml(anchor)}</a>`);
  }
});
