import Ember from 'ember';

export default Ember.Mixin.create({
  reservedKeys: ['_propertyChanged'],
  _propertyChanged: 1,

  init() {
    this._super(...arguments);
  },

  set: function(key, value) {
    if ( key !== '_propertyChanged' ) {
      console.log('Property Changed:',key,value);
      this.incrementProperty('_propertyChanged');
    }

    return this._super(...arguments);
  }
});
