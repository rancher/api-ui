import Ember from 'ember';
import JsonMap from 'api-ui/components/json-map/component';

export default JsonMap.extend({
  history: Ember.inject.service(),

  actions: {
    follow(url) {
      this.get('history').follow(url);
    },
  },

  list: Ember.computed('model', function() {
    const model = this.get('model')||{};
    let out = [];
    let self = null;

    Object.keys(model).forEach((key) => {
      const obj = {
        key: key,
        value: model[key],
        sort: key.toLowerCase()
      };

      if ( key === 'self' ) {
        self = obj;
      } else {
        out.push(obj);
      }
    });

    out = out.sortBy('sort');

    if ( self ) {
      out.unshift(self);
    }

    return out;
  }),

  length: Ember.computed.alias('list.length'),
});
