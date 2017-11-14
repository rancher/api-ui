import Ember from 'ember';

const PRIORITY_FIELDS = {
  type: 1,
  id: 2,
  name: 3,
  description: 4,
  OTHER: 99
}

const SIMPLE_COMPONENTS = [
  'blob',
  'boolean',
  'date',
  'enum',
  'float',
  'host',
  'int',
  'masked',
  'multiline',
  'number',
  'password',
  'reference',
  'string',
  'map',
  'array',
];

export default Ember.Component.extend({
  // Inputs
  initialModel: null,
  schemas: null,
  parent: null,
  method: null,
  path: null,

  // Component Options
  classNames: ['box'],

  // Locals
  model: null,
  schema: null,
  editableFields: null,

  isUpdate: Ember.computed.equal('method','PUT'),

  init() {
    this._super(...arguments);
    if ( this.get('initialModel') ) {
      this.set('model', this.get('initialModel').clone());
    } else {
      this.set('model', this.get('store').createRecord({
        type: this.get('schema._id'),
      }));
    }

    this.updateSchema();

    if ( !this.get('isUpdate') ) {
      this.applySchemaDefaults();
      this.applyCreateDefaults();
    }

    this.set('editableFields', this.getEditableFields());
  },

  actions: {
    changeType(type) {
    },
  },

  applySchemaDefaults() {
    const model = this.get('model');
    const schema = this.get('schema');
    if ( !schema ) {
      return;
    }

    const defaults = this.get('schema').getCreateDefaults();
    model.setProperties(defaults);
  },

  applyCreateDefaults() {
    let defaults = this.get('parent.createDefaults');
    if ( defaults ) {
      // Make a copy so objects from the defaults aren't reused.
      const copy = JSON.parse(JSON.stringify(defaults));
      this.get('model').setProperties(copy);
    }
  },

  updateSchema: Ember.observer('model.type', function() {
    if ( !this.get('schema') ) {
      const type = this.get('model.type')||'';
      const schema = this.get('schemas').findBy('id', type.toLowerCase());
      this.set('schema', schema);
    }
  }),

  getEditableFields() {
    const model = this.get('model');
    const schemas = this.get('schemas');
    const schema = this.get('schema');
    const fields = schema.get('resourceFields')||{};
    const out = [];

    let check = 'create';
    if ( this.get('isUpdate') ) {
      check = 'update';
    }

    Object.keys(fields).forEach((key) => {
      const field = fields[key];

      let priority = PRIORITY_FIELDS[key];
      if ( !priority ) {
        priority = PRIORITY_FIELDS.OTHER;
      }

      const primary = schema.primaryTypeFor(key);
      let primarySchema = schemas.findBy('id', (primary||'').toLowerCase());

      const sub = schema.subTypeFor(key);
      let subSchema = schemas.findBy('id', (sub||'').toLowerCase());

      let value = model.get(key);
      if ( value === undefined ) {
        if ( field.nullable ) {
          value = null;
        } else {
          value = '';
        }
      }

      let component = null;
      let isResource = false;
      if ( SIMPLE_COMPONENTS.includes(primary) ) {
        component = 'input-' + primary;
      } else if ( schemas.findBy('id', (primary||'').toLowerCase()) ) {
        component = 'input-resource';
        isResource = true;
      }


      if ( field[check] ) { // create or update
        out.pushObject(Ember.Object.create({
          name: key,
          description: field.description,
          value: value,
          isNull: value === null && field.nullable,
          priority: priority,
          required: field.required||false,
          nullable: field.nullable||false,
          options: field.options,
          type: field.type,
          primaryType: schema.primaryTypeFor(key),
          subType: schema.subTypeFor(key),
          primarySchema: primarySchema,
          subSchema: subSchema,
          component: component,
          isResource: isResource,
        }));
      }
    });

    return out.sortBy('priority','name');
  },

  isNullChanged: Ember.observer('editableFields.@each.isNull', function() {
    this.get('editableFields').filterBy('nullable').forEach((field) => {
      if ( field.isNull && field.value !== null) {
        field.set('value', null);
        this.valueChanged();
      }
    });
  }),

  valueChanged: Ember.observer('editableFields.@each.value', function() {
    Ember.run.debounce(this, 'syncEditableFields', 1000);
  }),

  syncEditableFields() {
    const model = this.get('model');
    this.get('editableFields').forEach((field) => {
      const cur = model[field.name];
      const neu = field.value;

      if ( field.isNull ) {
        if ( neu === null || neu === '' ) {
          if ( typeof cur !== 'undefined' && cur !== null ) {
            model.set(field.name, null);
          }
        } else {
          field.set('isNull', false);
          model.set(field.name, neu);
        }
      } else if ( cur !== neu ) {
        model.set(field.name, neu);
      }
    });

    this.sendAction('valueChanged', model);
  },

});
