import Ember from 'ember';

export default Ember.Component.extend({
  model: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  actions: {
    expand() {
      this.set('expanded', true);
    },

    collapse() {
      this.set('expanded', false);
    },
  },

  length: Ember.computed('model', function() {
    return this.get('model.length');
  }),
});
