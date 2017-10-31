import Ember from 'ember';
import Util from 'api-ui/utils/util';

export default Ember.Component.extend({
  history: Ember.inject.service(),

  model: null,
  parent: null,

  tagName: '',

  limit: null,
  originalLimit: null,

  init() {
    this._super(...arguments);
    this.set('originalLimit', this.get('model.limit'));
    this.set('limit', this.get('model.limit'));
  },

  actions: {
    changeLimit() {
      let path = this.get('parent.links.self');
      path = Util.addQueryParam(path, 'limit', this.get('limit'));
      this.get('history').follow(path);
    },

    follow(path) {
      this.get('history').follow(path);
    }
  },

  length: Ember.computed('model', function() {
    return Object.keys(this.get('model')).length;
  }),
});
