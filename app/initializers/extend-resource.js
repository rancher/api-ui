import Resource from 'ember-api-store/models/resource';
import WatchPropertyChange from 'api-ui/mixins/watch-property-change';

export function initialize(/*application */) {
//  Resource.reopen(WatchPropertyChange);
}

export default {
  name: 'extend-resource',
  initialize: initialize
};

