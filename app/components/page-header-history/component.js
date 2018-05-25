import { alias, reads } from '@ember/object/computed';
import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service'
import { computed } from '@ember/object';

export default Component.extend({
  layout,
  history:          service(),

  tagName:           'LI',
  classNames:        ['dropdown','nav-item','nav-cluster'],
  classNameBindings: ['hide'],
});
