import Ember from 'ember';
import ThrottledResize from 'api-ui/mixins/throttled-resize';

export default Ember.Component.extend(ThrottledResize, {
  router: Ember.inject.service(),

  model: null,
  active: null,

  tagName: 'div',
  classNames: ['call-row'],
  classNameBindings: ['active:active'],

  onResize() {
    const $test = this.$('.clip-test');
    const $parent = this.$('.clip-parent');
    const $target = this.$('.clip-target');
    if ( $test.width() > $parent.width() ) {
      $target.addClass('clip-left');
    } else {
      $target.removeClass('clip-left');
    }
  },

  click() {
    this.get('router').transitionTo('api.browse.call', this.get('model.id'));
  },
});
