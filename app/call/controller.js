import Ember from 'ember';

function insensitiveIncludes(ary, str) {
  return (ary||[]).map(x => (x||'').toLowerCase()).includes((str||'').toLowerCase());
}

export default Ember.Controller.extend({
  history: Ember.inject.service(),

  model: null,
  id: 0,

  response: Ember.computed.alias('model.responseBody'),
  schemas: Ember.computed.alias('model.schemas'),

  requestMode: 'json',

  actions: {
    back() {
      this.get('history').goTo(this.get('model.id')-1);
    },

    forward() {
      this.get('history').goTo(this.get('model.id')+1);
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

    create(type) {
      const [path, body] = this.prepareCreate(type);

      this.get('history').create({
        method: 'POST',
        path: path,
        body: body,
        schemas: this.get('schemas'),
        parent: this.get('response'),
      });
    },

    edit() {
      this.get('history').create({
        method: 'PUT',
        path: this.get('response.links.update')||this.get('response.links.self'),
        body: this.get('response'),
        schemas: this.get('schemas'),
      });
    },

    submit() {
      this.get('model').go();
      if ( this.get('requestMode') === 'editor' ) {
        this.set('requestMode', 'json');
      }
    },

    delete() {
      this.get('history').create({
        method: 'DELETE',
        path: this.get('response.links.remove')||this.get('response.links.self'),
      });
    },

    toggleHeaders() {
      this.toggleProperty('showHeaders');
    },

    setRequestMode(mode) {
      this.set('requestMode', mode);
    },
  },

  json: Ember.computed('model._propertyChanged', function() {
    return this.get('model').serialize();
  }),

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
    const method = (this.get('model.method')||'').toUpperCase();
    return ['GET','DELETE','PUT'].includes(method);
  }),

  isCollection: Ember.computed.equal('response.type','collection'),

  canCreate: Ember.computed('schemas', 'response.createTypes', 'isCollection', function() {
    if ( !this.get('isCollection') ) {
      return false;
    }

    return this.hasMethod('POST') || (Object.keys(this.get('response.createTypes')||{}).length > 0);
  }),

  canEdit: Ember.computed('schemas', 'response.{type,resourceType}','response.links.update', function() {
    return this.hasLink('update') || this.hasMethod('PUT');
  }),

  canRemove: Ember.computed('schemas', 'response.{type,resourceType}','response.links.remove', function() {
    return this.hasLink('remove') || this.hasMethod('DELETE');
  }),

  baseHref: Ember.computed(function() {
    return window.location.origin;
  }),

  hasLink(link) {
    const response = this.get('response');

    if ( response && !!response.get(`links.${link}`) ) {
      return true;
    }

    return false;
  },

  hasMethod(method) {
    const response = this.get('response');
    const schemas = this.get('schemas');
    if ( !response || !schemas ) {
      return false;
    }

    if ( response.get('type') === 'collection' ) {
      const schema = schemas.findBy('id', (response.get('resourceType')||'').toLowerCase());
      if ( schema ) {
        return insensitiveIncludes(schema.collectionMethods, method);
      }
    } else {
      const schema = schemas.findBy('id', (response.get('type')||'').toLowerCase());
      if ( schema ) {
        return insensitiveIncludes(schema.resourceMethods, method);
      }
    }

    return false;
  },

  prepareCreate(type) {
    const createTypes = this.get('response.createTypes')||{};
    const createTypeArray = Object.keys(createTypes);
    const createDefaults = this.get('response.createDefaults')||{};

    let resourceType = type || this.get('response.resourceType');
    let path = this.get('response.links.self');

    if ( createTypeArray.length && !createTypeArray.includes(resourceType) ) {
      resourceType = createTypeArray[0];
      path = createTypes[resourceType];
    }

    const body = Object.assign({}, createDefaults);
    body.type = resourceType;

    const resource = this.get('store')._typeify(body, { updateStore: false });

    return [path, resource];
  },
});
