import Ember from 'ember';

const TYPE_KEYS = ['type','baseType','resourceType'];

export default Ember.Component.extend({
  model: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  typeKeys: TYPE_KEYS,

  actions: {
    expand() {
      this.set('expanded', true);
    },

    collapse() {
      this.set('expanded', false);
    },
  },

  length: Ember.computed('model', function() {
    return Object.keys(this.get('model')).length;
  }),
});
