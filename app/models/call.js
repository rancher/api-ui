import Ember from 'ember';
import { randomStr , randomCharsets} from 'api-ui/utils/util';
import Resource from 'ember-api-store/models/resource';

export default Resource.extend({
  ajax: Ember.inject.service(),

  id: null,
  method: 'GET',
  path: null,
  requestBody: null,

  _ajax: null,

  status: null,
  responseBody: null,

  init() {
    this._super();
    this.set('id', randomStr(16, 'loweralphanum'));
  },

  go() {
    const req = this.get('ajax').request(this.get('path'), {
      method: this.get('method'),
      data: this.get('requestBody'),
    });

    this.set('_ajax', req);

    return req.then((res) => {
      this.set('status', res._statusCode);
      this.set('responseBody', res);
      this.set('responseBodyStr', JSON.stringify(res, null, 2));
    }).catch((err) => {
      this.set('status', err._statusCode);
      this.set('responseBody', err);
      this.set('responseBodyStr', JSON.stringify(err, null, 2));
    });
  }
});
