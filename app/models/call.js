import Ember from 'ember';
import { randomStr } from 'api-ui/utils/util';
import Resource from 'ember-api-store/models/resource';

export default Resource.extend({
  ajax: Ember.inject.service(),

  id: null,
  method: 'GET',
  path: null,
  requestBody: null,

  _ajax: null,

  statusCode: null,
  responseBody: null,
  loading: null,

  init() {
    this._super();
    this.set('id', randomStr(8, 'loweralphanum') + '$' + this.get('method') + '$' + this.get('path'));
  },

  go() {
    const req = this.get('ajax').request(this.get('path'), {
      method: this.get('method'),
      data: this.get('requestBody'),
    });

    this.set('_ajax', req);
    this.set('loading', true);

    let promise = req.then((res) => {
      this.set('responseBody', res);
    }).catch((err) => {
      this.set('responseBody', err.payload);
    }).finally(() => {
      this.setProperties({
        statusCode: promise.xhr.status,
        statusText: promise.xhr.statusText,
        loading: false
      });
    });

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
});
