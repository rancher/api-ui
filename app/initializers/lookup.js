export function initialize(application) {
  // Shortcuts for debugging.  These should never be used in code.
  const container = application.__container__;

  window.l = function(name) {
    return container.lookup(name);
  };

  window.lc = function(name) {
    return container.lookup('controller:'+name);
  };

  window.s = container.lookup('service:store');
}

export default {
  name: 'lookup',
  initialize: initialize,
};
