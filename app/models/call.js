import Ember from 'ember';
import Resource from 'ember-api-store/models/resource';
import { parseHeaders } from 'api-ui/utils/parse-headers';

let lastId = 0;

export default Resource.extend({
  ajax: Ember.inject.service(),
  schemasService: Ember.inject.service('schemas'),

  id: null,
  method: 'GET',
  path: null,
  query: null,
  requestBody: null,

  state: 'prepare',

  prepare:   Ember.computed.equal('state','prepare'),
  loading:   Ember.computed.equal('state','loading'),
  done:      Ember.computed.equal('state','done'),

  statusCode: null,
  responseBody: null,
  responseHeaders: null,
  schemas: null,

  init() {
    this._super();
    this.set('id', lastId++);
  },

  go() {
    const req = this.get('ajax').request(this.get('fullPath'), {
      method: this.get('method'),
      data: this.get('requestBody'),
    });

    this.set('state', 'loading');

    const self = this;
    function done(res) {
      self.set('responseBody', res);
      self.set('responseHeaders', parseHeaders(promise.xhr.getAllResponseHeaders()));

      let schemaUrl = promise.xhr.getResponseHeader('x-api-schemas');
      if ( schemaUrl ) {
        return self.get('schemasService').allFor(schemaUrl).then(function(schemas) {
          self.set('schemas', schemas);
          return self;
        });
      }
    }

    let promise = req.then(done).catch(done).finally(() => {
      this.setProperties({
        statusCode: promise.xhr.status,
        statusText: promise.xhr.statusText,
        state: 'done'
      });
    });

    this.set('promise', promise);
    return promise;
  },

  isSuccess: Ember.computed('statusCode', function() {
    const status = this.get('statusCode');
    if ( !status || (status >= 200 && status <= 399) ) {
      return true;
    }

    return false;
  }),

  badgeColor: Ember.computed('isSuccess', function() {
    if ( this.get('isSuccess') ) {
      return 'bg-transparent text-success';
    } else {
      return 'bg-transparent text-error';
    }
  }),

  fullPath: Ember.computed('path','query', function() {
    let out = this.get('path');
    let query = this.get('query');
    if ( query ) {
      out += '?' + query;
    }
    return out;
  }),

  requestBodyStr: Ember.computed('requestBody', function() {
    const body = this.get('requestBody');
    if ( body ) {
      return JSON.stringify(body, null, 2);
    }

    return ''
  }),
});
