import Ember from 'ember';
import Util from 'api-ui/utils/util';

const SORT_ORDER = {
  '': 1,
  'eq': 2,
  'ne': 3,
  'lte': 4,
  'lt': 5,
  'gt': 6,
  'gte': 7,
  'prefix': 8,
  'like': 9,
  'notlike': 10,
  'null': 11,
  'notnull': 12,
};


function displayModifier(modifier) {
  let str = '';
  switch (modifier)
  {
    case ""       : str = '='; break;
    case "eq"     : str = '='; break;
    case "ne"     : str = '&ne;'; break;
    case "lt"     : str = '&lt;'; break;
    case "lte"    : str = '&le;'; break;
    case "gt"     : str = '&gt;'; break;
    case "gte"    : str = '&ge;'; break;
    case "null"   : str = 'NULL'; break;
    case "notnull": str = 'Not NULL'; break;
    case "like"   : str = 'Like'; break;
    case "notlike": str = 'Not like'; break;
    case "prefix" : str = 'Starts with'; break;
    case "suffix" : str = 'Ends with'; break;
  }

  return str;
}

function mapModifiers(modifiers) {
  return modifiers.sort(function(a,b) {
    var ia = SORT_ORDER[a];
    if ( !ia ) {
      return 1;
    }

    var ib = SORT_ORDER[b];
    if ( !ib ) {
      return -1;
    }

    return ia-ib;
  }).map(function(value) {
    return {
      label: displayModifier(value),
      value: value,
    };
  });
}

export default Ember.Component.extend({
  history: Ember.inject.service(),

  model: null, // filters
  parent: null, // collection
  schemas: null,
  collapsible: true,
  expanded: true,

  tagName: '',

  all: null,
  allKeys: null,
  list: null,

  init() {
    this._super(...arguments);

    const schema = this.get('schemas').findBy('id', (this.get('parent.resourceType')||'').toLowerCase());
    const definitions = schema.collectionFilters;
    const applied = this.get('model');
    const allKeys = Object.keys(definitions);
    const all = {};
    const list = [];

    allKeys.forEach((key) => {
      const definition = definitions[key];
      const entry = applied[key];

      all[key] = {
        modifiers: mapModifiers(definition.modifiers||{}),
        options: definition.options
      };

      if ( entry ) {
        entry.forEach((item) => {
          list.push({
            field: key,
            modifier: item.modifier||'eq',
            value: item.value,
          });
        });
      }
    });

    this.setProperties({
      allKeys,
      all,
      list
    });
  },

  keyChanged: Ember.observer('list.@each.field', function() {
    this.get('list').forEach((entry) => {
      const def = this.get('all')[entry.field];
      if ( !def.modifiers.findBy('value', entry.modifier) ) {
        Ember.set(entry, 'modifier', def.modifiers[0].value);
      }

      if ( def.options && !def.options.includes(entry.value) ) {
        Ember.set(entry, 'value', def.options[0]);
      }
    });
  }),

  actions: {
    add() {
      const key = this.get('allKeys.firstObject');
      const entry = this.get('all')[key];
      this.get('list').pushObject({
        field: key,
        modifier: entry.modifiers[0].value,
        value: '',
      });
    },

    remove(obj) {
      this.get('list').removeObject(obj);
    },

    go() {
      let url = this.get('parent.links.self').replace(/\?.*$/,'');
      this.get('list').forEach((item) => {
        let key = item.field;

        if ( item.value || ['null','notnull'].includes(item.modifier)) {
          // Ok
        } else {
          // Skip empty values
          return;
        }

        if ( item.modifier && item.modifier !== 'eq' ) {
          key += '_' + item.modifier;
        }

        url = Util.addQueryParam(url, key, item.value);
      });

      this.get('history').follow(url);
    }
  },

  length: Ember.computed.alias('list.length'),
});
