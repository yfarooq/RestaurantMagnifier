// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.

/**
 * This is a simple logger for the startup of tha pplication to log those script files that have been loaded
 * and to log the contents of the global namespace
 *
 * @author Yama Ghulam Farooq (yama.farooq@.com)
 */

//--------------------------------------
// Initialisation monitoring method
//--------------------------------------

LAUNCH_MONITOR = function buildLaunchMonitor() {
  "use strict";

  var log = function(message) {
    console.log("LaunchMonitor.js: " + message);
  };

  var messages = [];

  /**
   * Add a timestamped message to the set of messages
   * @param message
   */
  function addMessage(message) {
    var m = new Date().toUTCString() + " - " + message;
    messages.push(m);
  }

  /**
   * Display all the messages, only call this when the console is up and running
   */
  function displayMessages() {
    log("Launch Monitor messages:");
    for (var i = 0; i < messages.length; i++) {
      log("  " + messages[i]);
    }
  }

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
    var _maxDepth = 0;
    if (arguments.length > 1) {
      _maxDepth = levels;
    }
    displayObjectState(" ", target, 0, _maxDepth);
  }

  // Private
  function displayObjectState(indent, target, depth, maxDepth) {
    var prefix = "";
    for (var i = 0; i < depth; i++) {
      prefix += indent;
    }

    var type;
    for (var name in target) {
      type = typeof target[name];
      switch (type) {
        case 'string' :
        case 'number' :
        case 'boolean' :
          log(prefix + name + " -> " + target[name]);
          break;
        case 'object' :
          if (depth < maxDepth) {
            log(prefix + name + " -> ");
            displayObjectState(indent, target[name], depth + 1, maxDepth);
          } else {
            log(prefix + name + " -> (object)");
          }
          break;
        case 'function' :
          log(prefix + name + " -> (function)");
          break;
        case 'undefined' :
          log(prefix + name + " -> UNDEFINED");
          break;
      }
    }
  }

  return {
    addMessage : addMessage,
    displayMessages : displayMessages,
    displayGlobalState : displayGlobalState,
    displayObject : displayObject
  };
}();