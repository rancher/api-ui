import Ember from 'ember';
import Ajax from 'ember-ajax/services/ajax';
import AjaxErrors from 'ember-ajax/errors';

export default Ajax.extend({
  store: Ember.inject.service(),

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

  handleResponse() {
    let payload = this._super(...arguments);
    if ( payload instanceof AjaxErrors.AjaxError ) {
      if ( payload.payload ) {
        return this.get('store')._typeify(payload.payload, { updateStore: false });
      } else {
        return payload;
      }
    } else {
      return this.get('store')._typeify(payload, { updateStore: false });
    }
  }
});
