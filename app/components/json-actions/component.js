import Ember from 'ember';
import JsonMap from 'api-ui/components/json-map/component';

export default JsonMap.extend({
  history: Ember.inject.service(),

  actions: {
    generate(actionName) {
    },
  }
});
