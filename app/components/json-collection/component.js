import Ember from 'ember';
import JsonResource from 'api-ui/components/json-resource/component';
import { resourceComponentFor } from 'api-ui/components/json-resource/component';
const { get } = Ember;

export function collectionComponentFor(key, value) {
  let c = resourceComponentFor(...arguments);
  if ( value ) {
    switch ( key ) {
      case 'sort':
//        c = 'json-collection-sort';
        break;

      case 'sortLinks':
        c = null;
        break;

      case 'pagination':
        c = 'json-collection-pagination';
        break;

      case 'filters':
        c = 'json-collection-filters';
        break;

      case 'createType':
        c = 'json-collection-create-types';
        break;
    }
  }

  return c;
}

export default JsonResource.extend({
  model: null,
  collapsible: true,
  expanded: true,

  mapKeys: Ember.computed('model', function() {
    return this.get('model').allKeys();
  }),

  componentForKey: Ember.computed('model', function() {
    const out = {};
    const model = this.get('model');
    Object.keys(model).forEach((key) => {
      out[key] = collectionComponentFor(key, get(model, key));
    });
    return out;
  }),
});
