import Ember from 'ember';

export default Ember.Component.extend({
  open: '<',
  close: '>',
  length: 0,
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
});
