import Ember from 'ember';
import Ajax from 'ember-ajax/services/ajax';

export default Ajax.extend({
  contentType: 'application/json; charset=utf-8',

  namespace: Ember.computed('app.apiServer', function() {
    if ( this.get('app.apiServer') ) {
      return this.get('app.apiProxy');
    } else {
      return undefined;
    }
  }),

  headers: Ember.computed(function() {
    let out ={};
    return out;
  }),

  isSuccess(status, headers, payload ) {
    if ( (headers['content-type']||'').toLowerCase().includes('/json') ) {
      Object.defineProperty(payload, '_statusCode', {value: status});
      Object.defineProperty(payload, '_headers', {value: headers});
    }

    return this._super(...arguments);
  },
});
