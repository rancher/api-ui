import Ember from 'ember';

export default Ember.Service.extend({
  ajax: Ember.inject.service(),
  cache: null,

  init() {
    this._super(...arguments);
    this.set('cache', {});
  },

  allFor(path) {
    // Relative-ize links so the namespace will be prepended
    if ( path.indexOf(window.location.origin) === 0 ) {
      path = path.substr(window.location.origin.length);
    }

    const cache = this.get('cache');
    let entry = cache[path];
    if ( entry ) {
      return Ember.RSVP.resolve(entry);
    }

    return this.get('ajax').request(path).then((res) => {
      cache[path] = res;
      return res;
    });
  },
});
