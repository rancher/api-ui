import Ember from 'ember';

export default Ember.Component.extend({
  history: Ember.inject.service(),

  model: null,
  parent: null,

  tagName: '',

  highlight: Ember.computed('key','followUrl', function() {
    const key = this.get('key');
    const url = this.get('followUrl');
    return !!url && !['baseType','type','resourceType'].includes(key);
  }),

  followUrl: Ember.computed('key','parent.type', function() {
    const key = this.get('key');
    const value = this.get('model');
    const parentType = (this.get('parent.type')||'').toLowerCase();
    const parentSchema = this.get('schemas').findBy('id', parentType);

    if ( !parentSchema && parentType !== 'collection' ) {
      return null;
    }

    let url;

    if ( key === 'id' ) {
      url = parentSchema.linkFor('collection') + '/' + value;
    } else if ( key === 'type' ) {
      url = parentSchema.linkFor('self');
    } else if ( key === 'baseType' || key === 'resourceType' ) {
      const targetSchema = this.get('schemas').findBy('id', (value+'').toLowerCase());
      if ( targetSchema ) {
        url = targetSchema.linkFor('self');
      }
    } else {
      const types = parentSchema.typesFor(key);
      if ( types && types.length ) {
        if ( types[0] === 'reference' ) {
          const targetSchema = this.get('schemas').findBy('id', (types[1]||'').toLowerCase());
          if ( targetSchema ) {
            url = targetSchema.linkFor('collection') + '/' + value;
          }
        } else {
          const namedSchema = this.get('schemas').findBy('id', (types[0]||'').toLowerCase());
          if ( namedSchema ) {
            url = namedSchema.linkFor('collection') + '/' + value;
          }
        }
      }
    }

    return url;
  }),

  actions: {
    click() {
      const url = this.get('followUrl');
      if ( url ) {
        this.get('history').follow(url);
      }
    }
  },

});
