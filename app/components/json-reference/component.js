import Ember from 'ember';

export default Ember.Component.extend({
  history: Ember.inject.service(),

  model: null,
  parent: null,

  tagName: 'a',
  classNameBindings: ['followUrl:link:string'],

  followUrl: Ember.computed('key','parent.type', function() {
    const key = this.get('key');
    const value = this.get('model');
    const parentSchema = this.get('schemas').findBy('id', this.get('parent.type'));

    if ( !parentSchema ) {
      return null;
    }

    let url;

    if ( key === 'id' ) {
      url = parentSchema.linkFor('collection') + '/' + value;
    } else if ( key === 'type' ) {
      url = parentSchema.linkFor('self');
    } else {
      const types = parentSchema.typesFor(key);
      if ( types ) {
        if ( types[0] === 'reference' ) {
          const targetSchema = this.get('schemas').findBy('id', types[1]);
          if ( targetSchema ) {
            url = targetSchema.linkFor('collection') + '/' + value;
          }
        } else {
          const namedSchema = this.get('schemas').findBy('id', types[0]);
          if ( namedSchema ) {
            url = namedSchema.linkFor('collection') + '/' + value;
          }
        }
      }
    }

    return url;
  }),

  click() {
    const url = this.get('followUrl');
    if ( url ) {
      this.get('history').follow(url);
    }
  },

});
