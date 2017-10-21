import Ember from 'ember';

export default Ember.Service.extend({
  store: Ember.inject.service(),

  list: null,

  init() {
    this._super();
    this.clear();
  },

  length: Ember.computed.reads('list.length'),
  last: Ember.computed.reads('list.firstObject'),

  clear() {
    this.set('list', []);
  },

  getById(id) {
    return this.get('list').findBy('id', id);
  },

  add(call) {
    this.get('list').unshift(call);
    return call;
  }
});
