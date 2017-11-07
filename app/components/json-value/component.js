import Ember from 'ember';
let { get, isArray } = Ember
import { baseTypeOf } from 'api-ui/helpers/base-type-of';

export default Ember.Component.extend({
  model: null,
  schemas: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  baseType: Ember.computed('model', function() {
    return baseTypeOf(this.get('model'));
  }),

  objectClass: Ember.computed('model', function() {
    const model = this.get('model');
    const objType = typeof model;

    if ( objType === 'object' ) {
      const type = get(model,'type');
      const id = get(model,'id');

      if ( type === 'collection' ) {
        return 'collection';
      } else if ( type && id ) {
        return 'resource';
      } else if ( isArray(model) ) {
        return 'array';
      } else {
        return 'map';
      }
    }

    return 'unknown';
  }),

  strVal: Ember.computed('model', function() {
    return this.get('model')+'';
  }),
});
