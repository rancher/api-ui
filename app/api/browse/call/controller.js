import Ember from 'ember';

export default Ember.Controller.extend({
  history: Ember.inject.service(),

  model: null,

  showHeaders: false,

  canBack: Ember.computed('model.id', function() {
    return !this.get('history').isFirst(this.get('model'));
  }),

  canForward: Ember.computed('model.id', function() {
    return !this.get('history').isLast(this.get('model'));
  }),

  canUp: Ember.computed('model.path', function() {
    const path = this.get('model.path');
    return path && path.length && path !== '/';
  }),

  canReload: Ember.computed('model.method', function() {
    const method = this.get('model.method');
    return (method && method+'').toUpperCase() === 'GET';
  }),

  canEdit: Ember.computed.notEmpty('model.links.update'),

  canRemove: Ember.computed.notEmpty('model.links.remove'),

  actions: {
    back() {
    },

    forward() {
    },

    up() {
      const parts = this.get('model.path').split('/');
      const path = parts.slice(0, parts.length-1).join('/');
      this.get('history').follow(path);
    },

    reload() {
      const path = this.get('model.path');
      this.get('history').follow(path);
    },

    edit() {
    },

    delete() {
    },

    toggleHeaders() {
      this.toggleProperty('showHeaders');
    },
  }
});
