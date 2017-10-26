import Ember from 'ember';

export default Ember.Service.extend({
  ajax: Ember.inject.service(),
  router: Ember.inject.service(),
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

  isFirst(call) {
    // These are reversed because add prepends to the beginning..
    return this.get('list.lastObject') === call;
  },

  isLast(call) {
    // These are reversed because add prepends to the beginning..
    return this.get('list.firstObject') === call;
  },

  add(call) {
    this.get('list').unshiftObject(call);
    return call;
  },

  follow(path, andTransitionTo=true) {
    // Relative-ize links so the namespace will be prepended
    if ( path.indexOf(window.location.origin) === 0 ) {
      path = path.substr(window.location.origin.length);
    }

    const call = this.get('store').createRecord({
      type: 'call',
      path: path,
    });

    this.add(call);
    call.go();

    if ( andTransitionTo ) {
      this.get('router').transitionTo('api.browse.call', call.get('id'));
    }

    return call;
  }
});
