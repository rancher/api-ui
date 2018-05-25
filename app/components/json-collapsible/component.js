import Ember from 'ember';

export default Ember.Component.extend({
  open: '<',
  close: '>',
  length: 0,
  collapsible: true,
  initExpanded: true,
  expandedClassNames: '',
  showSummaryWhenExpanded: false,

  tagName: '',

  expanded: null,

  init() {
    this._super(...arguments);
    this.set('expanded', this.get('initExpanded'));
  },

  actions: {
    expand() {
      this.set('expanded', true);
    },

    collapse() {
      this.set('expanded', false);
    },
  },
});
