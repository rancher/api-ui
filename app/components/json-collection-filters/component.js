import Ember from 'ember';

export default Ember.Component.extend({
  model: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  length: Ember.computed('model', function() {
    return Object.keys(this.get('model')).length;
  }),
});
