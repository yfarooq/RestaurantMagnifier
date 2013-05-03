// Copyright: Omni Communication Products Limited. 2013.
// All rights reserved.

/**
 * This is a simple debug tool for dumping an object
 *
 * @author Christian Cooper (chris@thisisomni.com)
 */

//--------------------------------------
// Initialisation monitoring method
//--------------------------------------

window.debug = function buildDebugTools() {
  "use strict";

  var log = function(message) {
    console.log("DebugTools.js: " + message);
  };

  /**
   * Display the state of the global namespace, only call this when the console is up and running
   */
  function displayGlobalState(target) {
    log("Global state:");
    var _target = window;
    if (arguments.length > 0) {
      _target = target;
    }
    displayObjectState("  ", _target, 0, 1);
  }

  // Public
  function displayObject(target, levels) {
    if (!target) {
      log("displayObject: Invalid target");
      return;
    }
    var _maxDepth = 0;
    if (arguments.length > 1) {
      if (levels == -1) {
        _maxDepth = -1;
      } else {
        _maxDepth = levels + 1;
      }
    }
    var _previouslyVisited = [];
    displayObjectState(" ", target, 1, _maxDepth, _previouslyVisited);
  }

  // Private
  function displayObjectState(indent, target, depth, maxDepth, previouslyVisited) {
    var prefix = "";
    for (var i = 0; i < depth; i++) {
      prefix += indent;
    }

    var type, value;
    for (var name in target) {
      value = target[name];
      if (previouslyVisited.indexOf(value) > -1) {
        type = 'loop';
      } else {
        type = typeof target[name];
      }
      switch (type) {
        case 'string' :
        case 'number' :
        case 'boolean' :
          log(prefix + name + " -> " + target[name]);
          break;
        case 'object' :
          if (depth < maxDepth || maxDepth == -1) {
            log(prefix + name + " -> ");
            previouslyVisited.push(target);
            displayObjectState(indent, target[name], depth + 1, maxDepth, previouslyVisited);
          } else {
            log(prefix + name + " -> (object)");
          }
          break;
        case 'function' :
          log(prefix + name + " -> (function)");
          break;
        case 'loop' :
          log(prefix + name + " -> (back reference)");
          break;
        case 'undefined' :
          log(prefix + name + " -> UNDEFINED");
          break;
      }
    }
  }

  return {
    displayGlobalState : displayGlobalState,
    displayObject : displayObject
  };
}();

