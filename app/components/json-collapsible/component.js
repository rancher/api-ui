import Ember from 'ember';

export default Ember.Component.extend({
  model: null,
  open: '&#123;',
  close: '&#125;',
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
