import Ember from 'ember';

export function baseTypeOf(obj) {
  let t = typeof obj;

  if ( t === 'undefined' || t === 'object' && !obj ) {
    return 'null';
  } else if ( t === 'boolean' ) {
    return 'keyword';
  } else {
    return t;
  }
}

export default Ember.Helper.extend({
  compute(params) {
    return baseTypeOf(params[0]);
  },
});
