import Ember from 'ember';
let { isArray } = Ember

export default Ember.Component.extend({
  model: null,
  collapsible: true,
  expanded: false,

  tagName: '',

  kind: Ember.computed('model', function() {
    let model = this.get('model');
    let type = typeof model;

    if ( type === 'object' ) {
      if ( model ) {
        if ( isArray(model) ) {
          return 'array';
        } else {
          return 'map'
        }
      }

      return 'null';
    } else if ( type === 'undefined' ) {
      return 'null';
    } else if ( type === 'boolean' ) {
      return 'keyword';
    } else {
      // number, string
      return type;
    }
  }),

  strVal: Ember.computed('model', function() {
    return this.get('model')+'';
  }),
});
