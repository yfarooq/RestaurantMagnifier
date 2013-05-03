// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.

/**
 * This takes defined objects and persists them to the database
 *
 * @author Yama Ghulam Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading cache loader");
function loadCacheFromDatabase(completionCallback) {
  "use strict";

  var log = function(message) {
    console.log("CacheLoader.js: " + message);
  };

  var loadedTypes = {
		  Resturant : false,
		  cacheLocally : false,

  };

  // Only inform the initManager when all types have loaded
  function typeLoadComplete() {
    log("--------------------------------------------------------------");
    log("Cache loader: a stage has completed...");
    for (var loaded in loadedTypes) {
      if (!loadedTypes[loaded]) {
        log("Cache loader: still waiting for " + loaded);
        return;
      }
    }
    // All done.
    log("Cache load complete");
    completionCallback();
  }

  /**
   * Copy all fields from the source to the destination object
   * @param source
   * @param destination
   */
  function copyFields(objectType, source, destination) {
    // log("Copying " + objectType);
    for (var field in source) {
      if (destination.hasOwnProperty(field)) {
        destination[field] = source[field];
        // log("  " + field + " = " + source[field]);
      } else {
        log("WARN: Unrecognised field from database table " + objectType + "." + field);
      }
    }
    log("Loaded: " + JSON.stringify(destination));
  }

  function loadRestaurant() {
    log("Requesting broadcasts");

    // Load broadcasts
    APP.persistence.Restaurant.getAll(function(resultsArray){
      log("Loading broadcasts into cache, found " + resultsArray.length + " row(s)");
      for (var i = 0; i < resultsArray.length; i++) {
        var broadcast = new APP.types.Broadcast();
        var row = resultsArray[i];
        copyFields("broadcast", row, broadcast);
        APP.cache.broadcast.autoPut(broadcast);
        log("Loaded broadcast: " + broadcast.id);
      }
      loadedTypes.Restaurant = true;
      typeLoadComplete();
    });
  }
  /**
   * Loads cache locally records into the cache, also deletes records that are obsolete
   */
  function loadCacheLocallies() {
    log("Requesting cacheLocalies");

    // Load cacheLocally
    APP.persistence.cacheLocally.getAll(function(resultsArray){
      log("Loading cacheLocalies into cache, found " + resultsArray.length + " row(s)");
      for (var i = 0; i < resultsArray.length; i++) {
        var cacheLocally = new APP.types.CacheLocally();
        var row = resultsArray[i];
        copyFields("cacheLocally", row, cacheLocally);

        if (cacheLocally.isComplete()) {
          cacheLocally.unpersist();
          log("Removed obsolete cacheLocally: " + cacheLocally.getDesignation());
        } else {
          APP.cache.cacheLocally.autoPut(cacheLocally);
          log("Loaded cacheLocally: " + cacheLocally.getDesignation());
        }
      }
      loadedTypes.cacheLocally = true;
      typeLoadComplete();
    });
  }
  loadRestaurant();
  loadCacheLocallies();
}
