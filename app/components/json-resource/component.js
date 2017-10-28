import Ember from 'ember';
import JsonMap from 'api-ui/components/json-map/component';
const { get } = Ember;

const TYPE_KEYS = ['type','baseType','resourceType'];

export function resourceComponentFor(key,value) {
  let c = 'json-value';
  if ( value ) {
    switch ( key ) {
      case 'id':
        c = 'json-reference';
        break;

      case 'type':
      case 'baseType':
      case 'resourceType':
        c = 'json-schema';
        break;

      case 'links':
        c = 'json-links';
        break;

      case 'actions':
        c = 'json-actions';
        break;
    }
  }

  return c;
}

export default JsonMap.extend({
  model: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  typeKeys: TYPE_KEYS,

  length: Ember.computed('model', function() {
    return Object.keys(this.get('model')).length;
  }),

  componentForKey: Ember.computed('model', function() {
    const out = {};
    const model = this.get('model');
    Object.keys(model).forEach((key) => {
      out[key] = resourceComponentFor(key, get(model,key));
    });
    return out;
  }),
});
