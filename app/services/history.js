import Ember from 'ember';

export default Ember.Service.extend({
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

  goTo(idOrCall) {
    let call;
    if ( typeof idOrCall === 'object' ) {
      call = idOrCall;
    } else {
      call = this.getById(idOrCall);
    }

    if ( call ) {
      const queryParams = {
        id: call.get('id'),
      };

      /*this.get('router').*/
      return window.l('router:main').transitionTo(
        'call',
        call.get('path').replace(/^\//,''),
        { queryParams }
      );
    }
  },

  follow(path, andTransitionTo=true) {
    // Relative-ize links so the namespace will be prepended
    if ( path.indexOf(window.location.origin) === 0 ) {
      path = path.substr(window.location.origin.length);
    }

    const call = this.get('store').createRecord({
      type: 'call',
      path: path,
      method: 'GET',
    });

    this.add(call);
    call.go();

    if ( andTransitionTo ) {
      this.goTo(call);
    }

    return call;
  }
});
