import Ember from 'ember';
import JsonMap from 'api-ui/components/json-map/component';
const { get } = Ember;

const TYPE_KEYS = ['type','baseType','resourceType'];
const SORT_KEYS = {
  id: 1,
  type: 2,
  baseType: 3,
  resourceType: 4,
  links: 5,
}

export function resourceComponentFor(key, value, schema) {
  let c = 'json-value';
  if ( value ) {
    switch ( key ) {
      case 'id':
      case 'type':
      case 'baseType':
      case 'resourceType':
        c = 'json-reference';
        break;

      case 'links':
        c = 'json-links';
        break;

      case 'actions':
        c = 'json-actions';
        break;
    }
  }

  if ( schema ) {
    const types = schema.typesFor(key);
    if ( types && types[0] === 'reference' && types[1] ) {
      c = 'json-reference';
    }
  }

  return c;
}

export default JsonMap.extend({
  model: null,
  schemas: null,
  collapsible: true,
  initExpanded: true,

  tagName: '',

  typeKeys: TYPE_KEYS,

  length: Ember.computed('model', function() {
    return Object.keys(this.get('model')).length;
  }),

  sortedKeys: Ember.computed('model', function() {
    return Object.keys(this.get('model')).sort((a,b) => {
      const sa = SORT_KEYS[a];
      const sb = SORT_KEYS[b];

      if ( sa && sb ) {
        return  sa - sb;
      } else if ( sa ) {
        return -1;
      } else if ( sb ) {
        return 1;
      } else {
        return a.localeCompare(b, {sensitivity: 'base'});
      }
    })
  }),

  componentForKey: Ember.computed('model', function() {
    const out = {};
    const model = this.get('model');
    const schema = this.get('schemas').findBy('id', (model.get('type')||'').toLowerCase());

    Object.keys(model).forEach((key) => {
      out[key] = resourceComponentFor(key, get(model,key), schema);
    });
    return out;
  }),
});
