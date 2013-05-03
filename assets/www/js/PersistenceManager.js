// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.

/**
 * This takes defined objects and persists them to the database
 *
 * @author Yama Ghulam Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading persistence manager");

function buildPersistenceManager() {
  "use strict";

  var log = function(message) {
    console.log("PersistenceManager.js: " + message);
  };

  /**
   * To extend
   * <ol>
   * <li>Add a bundle</li>
   * <li>Add the new bundle to the bundles array</li>
   * </ol>
   * This function will then add a new object to its result:
   * <pre>
   * {
   *   broadcast : {
   *     get: function...,
   *     getAll: function...,
   *     add: function...,
   *     persist: function...,
   *     update: function...,
   *     remove: function... },
   *   Restaurant : {...},
   *   -Your bundle's table name- : {
   *     get: function...,
   *     getAll: function...,
   *     add: function...,
   *     persist: function...,
   *     update: function...,
   *     remove: function... }
   * }
   * </pre>
   */

  // Example bundle, to add a new supported 'data type' create another of these
  /*
  var exampleBundle = {
      table : "example",                                // SQL table name
      keyColumns : ["id", "ego"],                       // multiple key columns supported
      otherColumns : ["monkey", "buffoon", "cheese"]    // All non key columns
  };
  */

  // Bundles representing each of the object types

  var RestaurantBundle = {
      table : "Restaurant",
      keyColumns : ["id"],
      otherColumns : ["distributionTime", "validFrom", "validTo", "title", "summary",
                      "broadcast", "broadcastIcon", "broadcastType",
                      "parts", "partsDownloaded", "partsUnpacked", "partsStitched",    // Download and assembly count
                      "downloaded", "unpacked", "stitched",                            // Completion flags
                      "opened", "removed", "favourite", "notified"]                    // Usage flags
  };

  var cacheLocallyBundle = {
      table : "cacheLocally",
      keyColumns : ["ownerId", "key", "partNumber"],
      otherColumns : ["URL", "path",                                                    // Content locations
                      "objectType",                                                     // The type of object this represents
                      "partOf",                                                         // Contribution identification
                      "failures", "lastFailure",                                        // Error management
                      "downloaded", "unpacked", "stitched"]                             // Completion flags
  };

  // Add the new bundle in here
  var bundles = [RestaurantBundle,
                 cacheLocallyBundle];

  /**
   * Get all the common names from the source object and build a value array for all the named fields.
   * Where there is no name, or no value, a <code>null</code> is substituted.
   * @param sourceObject Object to extract values from
   * @param bindingNames Array of value names to extract from sourceObject
   * @returns Array of values, or where no value is available a <code>null</code>
   */
  function buildBindings(sourceObject, bindingNames) {
    var result = [];

    var name, val;
    for (var i = 0; i < bindingNames.length; i++) {
      name = bindingNames[i];
      val = null;
      if (typeof sourceObject[name] !== "undefined") {
        val = sourceObject[name];
      } else {
        log("WARN: Unable to get value for " + sourceObject.type + "." + name);
      }
      result.push(val);
    }
    // log("Bindings: " + result);
    return result;
  }

  /**
   * Builds a string defining the object we are looking
   * @param sourceObject Object to extract values from
   * @param bindingNames Array of value names to extract from sourceObject
   * @returns String
   */
  function buildKeyDescription(sourceObject, bindingNames) {
    var result = "";

    for (var i = 0; i < bindingNames.length; i++) {
      if (i > 0) {
        result += " & ";
      }
      var name = bindingNames[i];
      result += name + "=";
      result += typeof sourceObject[name] !== "undefined" ? sourceObject[name] : "undefined";
    }

    return result;
  }

  /**
   * Return a default success callback if one is not supplied
   * @param callback
   * @returns
   */
  function getSafeSuccessCallback(callback) {
    if (typeof callback != "undefined" && callback) {
      return callback;
    }
    return function(tx, rs) {
      // Do nothing
      // log("SQL success");
    };
  }

  /**
   * Return a default error callback if one is not supplied
   * @param callback
   * @returns
   */
  function getSafeErrorCallback(callback) {
    if (typeof callback != "undefined" && callback) {
      return callback;
    }
    return function(error) {
      log("SQL failure:");
      for (var e in error) {
        log("  " + e + " -> " + error[e]);
      }
    };
  }



  /**
   * Persistence mechanism for inserting/updating a modified object
   * @param bundle SQL and binding details for this type of object
   * @param object Object to be persisted
   * @param successCallback Called with response containing {action : "Inserted|Updated"}
   * @param errorCallback Called with response containing {SQL : "SQL that errored", ... originating error info}
   */
  function insertOrUpdateObject(bundle, object, successCallback, errorCallback) {
    APP.database.transaction(
        function(tx) {
          log("insertOrUpdateObject called for " + bundle.table + ", " + buildKeyDescription(object, bundle.queryExistsBindKeys));

          // See if it exists
          tx.executeSql(
              bundle.queryExistsSQL,
              buildBindings(object, bundle.queryExistsBindKeys),
              // Success
              function(tx, rs) {
                if (rs.rows.length == 1) {
                  // Update existing record
                  tx.executeSql(
                      bundle.updateSQL,
                      buildBindings(object, bundle.updateBindKeys),
                      // Success
                      function(tx, rs) {
                        if (successCallback) {
                          successCallback({action : "Updated"});
                        }
                      },
                      // Error
                      function(error) {
                        error.SQL = bundle.updateSQL;
                        getSafeErrorCallback(errorCallback)(error);
                      });

                } else {
                  // Insert new record
                  tx.executeSql(
                      bundle.insertSQL,
                      buildBindings(object, bundle.insertBindKeys),
                      // Success
                      function(tx, rs) {
                        if (successCallback) {
                          getSafeSuccessCallback(successCallback)({action : "Inserted"});
                        }
                      },
                      // Error
                      function(error) {
                        error.SQL = bundle.insertSQL;
                        getSafeErrorCallback(errorCallback)(error);
                      });
                }
              },
              // Error
              function(error) {
                error.SQL = bundle.queryExistsSQL;
                getSafeErrorCallback(errorCallback)(error);
              });

        });

  }

  /**
   * Persistence mechanism for updating a modified object
   * @param bundle SQL and binding details for this type of object
   * @param object Object to be persisted
   * @param successCallback Called with response containing {action : "Updated"}
   * @param errorCallback Called with response containing {SQL : "SQL that errored", ... originating error info}
   */
  function updateObject(bundle, object, successCallback, errorCallback) {
    APP.database.transaction(
        function(tx) {
          log("updateObject called for " + bundle.table + ", " + buildKeyDescription(object, bundle.queryExistsBindKeys));
          // See if it exists
          tx.executeSql(
              bundle.queryExistsSQL,
              buildBindings(object, bundle.queryExistsBindKeys),
              // Success
              function(tx, rs) {
                if (rs.rows.length == 1) {
                  // Update existing record
                  tx.executeSql(
                      bundle.updateSQL,
                      buildBindings(object, bundle.updateBindKeys),
                      // Success
                      function(tx, rs) {
                        getSafeSuccessCallback(successCallback)({action : "Updated"});
                      },
                      // Error
                      function(error) {
                        error.SQL = bundle.updateSQL;
                        getSafErrorCallback(errorCallback)(error);
                      });

                } else {
                  getSafeErrorCallback(errorCallback)({message : "No such object " + bundle.table + ": " + buildKeyDescription(object, bundle.queryExistsBindKeys)});
                }
              },
              // Error
              function(error) {
                error.SQL = bundle.queryExistsSQL;
                getSafeErrorCallback(errorCallback)(error);
              });
        });

  }

  /**
   * Persistence mechanism for inserting an object
   * @param bundle SQL and binding details for this type of object
   * @param object Object to be inserted
   * @param successCallback Called with response containing {action : "Inserted"}
   * @param errorCallback Called with response containing {SQL : "SQL that errored if any", ... originating error info}
   */
  function insertObject(bundle, object, successCallback, errorCallback) {
    APP.database.transaction(
        function(tx) {
          log("insertObject called for " + bundle.table + ", " + buildKeyDescription(object, bundle.queryExistsBindKeys));
          // See if it exists
          tx.executeSql(
              bundle.queryExistsSQL,
              buildBindings(object, bundle.queryExistsBindKeys),
              // Success
              function(tx, rs) {
                if (rs.rows.length == 0) {
                  // Insert new record
                  tx.executeSql(
                      bundle.insertSQL,
                      buildBindings(object, bundle.insertBindKeys),
                      // Success
                      function(tx, rs) {
                        if (callback) {
                          callback({action : "Inserted"});
                        }
                      },
                      // Error
                      function(error) {
                        error.SQL = bundle.insertSQL;
                        getSafeErrorCallback(errorCallback)(error);
                      });
                } else {
                  getSafeErrorCallback(errorCallback)({message : "Object already existed in DB"});
                }
              },
              // Error
              function(error) {
                error.SQL = bundle.queryExistsSQL;
                getSafeErrorCallback(errorCallback)(error);
              });

        });
  }


  /**
   * Persistence mechanism for deleting an object
   * @param bundle SQL and binding details for this type of object
   * @param object Object to be deleted
   * @param successCallback Called with response containing {action : "Deleted|None"}
   * @param errorCallback Called with response containing {SQL : "SQL that errored", ... originating error info}
   */
  function deleteObject(bundle, object, successCallback, errorCallback) {
    APP.database.transaction(
        function(tx) {
          log("deleteObject called for " + bundle.table + ", " + buildKeyDescription(object, bundle.queryExistsBindKeys));
          // See if it exists
          tx.executeSql(
              bundle.queryExistsSQL,
              buildBindings(object, bundle.queryExistsBindKeys),
              // Success
              function(tx, rs) {
                if (rs.rows.length == 1) {
                  // Delete existing record
                  tx.executeSql(
                      bundle.deleteSQL,
                      buildBindings(object, bundle.deleteBindKeys),
                      // Success
                      function(tx, rs) {
                        if (successCallback) {
                          successCallback({action : "Deleted"});
                        }
                      },
                      // Error
                      function(error) {
                        error.SQL = bundle.deleteSQL;
                        getSafeErrorCallback(errorCallback)(error);
                      });
                } else {
                  getSafeErrorCallback(errorCallback)({message : "No such object" + bundle.table + ": " + buildKeyDescription(object, bundle.queryExistsBindKeys)});
                }
              },
              // Error
              function(error) {
                error.SQL = bundle.queryExistsSQL;
                getSafeErrorCallback(errorCallback)(error);
              });
        });
  }

  /**
   * Persistence mechanism for selecting an object by its ID
   * @param bundle SQL and binding details for this type of object
   * @param object Object containing the key(s) to identify a row
   * @param successCallback Called with response containing [object]
   * @param errorCallback Called with response containing {SQL : "SQL that errored if apt", ... originating error info}
   */
  function selectObject(bundle, object, successCallback, errorCallback) {
    APP.database.transaction(
        function(tx) {
          log("selectObject called for " + bundle.table + ", " + buildKeyDescription(object, bundle.queryExistsBindKeys));

          tx.executeSql(
              bundle.queryExistsSQL,
              buildBindings(object, bundle.queryExistsBindKeys),
              // Success
              function(tx, rs) {
                log("selected " + rs.rows.length + " rows");
                if (rs.rows.length == 1) {
                  if (successCallback) {
                    successCallback(rs.rows.item(0));
                  }
                } else {
                  getSafeErrorCallback(errorCallback)({message : "No such object " + bundle.table + ": " + buildKeyDescription(object, bundle.queryExistsBindKeys)});
                }
              },
              // Error
              function(error) {
                error.reason = "SQL Problem";
                error.SQL = bundle.queryExistsSQL;
                getSafeErrorCallback(errorCallback)(error);
              });
        });
  }

  /**
   * Persistence mechanism for selecting all objects of a given type
   * @param bundle SQL and binding details for this type of object
   * @param successCallback Called with response containing [object, ...]
   * @param errorCallback Called with response containing {SQL : "SQL that errored", ... originating error info}
   */
  function selectAllObjects(bundle, successCallback, errorCallback) {

    APP.database.transaction(
        function(tx) {
          log("selectAllObjects called for " + bundle.table);

          tx.executeSql(
              bundle.selectAllSQL,
              [],
              // Success
              function(tx, rs) {
                var result = [];
                for (var i = 0; i < rs.rows.length; i++) {
                  result.push(rs.rows.item(i));
                }
                getSafeSuccessCallback(successCallback)(result);
              },
              // Error
              function(error) {
                error.SQL = bundle.selectAllSQL;
                error.parameters = [];
                getSafeErrorCallback(errorCallback)(error);
              });
        });
  }

  /**
   * Builds the SQL and the keys for binding the SQL for each bundle
   * @param bundle
   * @returns
   */
  function FunctionBundle(bundle) {
    // Template SQL for building type specific SQL
    var selectAllSQL = "SELECT * FROM :table";
    var selectSQL = "SELECT * FROM :table WHERE :keyColumns";
    var queryExistsSQL = "SELECT * FROM :table WHERE :keyColumns";
    var updateSQL = "UPDATE :table SET :otherColumns WHERE :keyColumns";
    var deleteSQL = "DELETE FROM :table WHERE :keyColumns";
    var insertSQL = "INSERT INTO :table (:keyColumns, :otherColumns) VALUES (:placeHolders)";

    // Copy template SQL
    var selAll = selectAllSQL;
    var sel = selectSQL;
    var query = queryExistsSQL;
    var upd = updateSQL;
    var del = deleteSQL;
    var ins = insertSQL;

    var selBindKeys = [];
    var queryBindKeys = [];
    var updBindKeys = [];
    var delBindKeys = [];
    var insBindKeys = [];

    var col;
    var j;
    var keyColumns = "";
    var otherColumns = "";
    var placeHolders = "";

    // Start substituting actual values

    // Select All
    selAll = selAll.replace(/:table/g, bundle.table);

    // Select by ID
    sel = sel.replace(/:table/g, bundle.table);
    for (j = 0; j < bundle.keyColumns.length; j++) {
      if (j > 0) {
        keyColumns += " AND ";
      }
      col = bundle.keyColumns[j];
      keyColumns += col + " = ?";
    }
    sel = sel.replace(/:keyColumns/g, keyColumns);
    selBindKeys = selBindKeys.concat(bundle.keyColumns);

    // Query existence
    query = query.replace(/:table/g, bundle.table);
    query = query.replace(/:keyColumns/g, keyColumns);
    queryBindKeys = queryBindKeys.concat(bundle.keyColumns);

    // Update
    upd = upd.replace(/:table/g, bundle.table);
    upd = upd.replace(/:keyColumns/g, keyColumns);
    // Build 'col = ?, col = ?"
    otherColumns = "";
    for (var j = 0; j < bundle.otherColumns.length; j++) {
      if (j > 0) {
        otherColumns += ", ";
      }
      col = bundle.otherColumns[j];
      otherColumns += col + " = ?";
      updBindKeys.push(col);
    }
    upd = upd.replace(/:otherColumns/g, otherColumns);
    updBindKeys = updBindKeys.concat(bundle.keyColumns);

    // Delete
    del = del.replace(/:table/g, bundle.table);
    del = del.replace(/:keyColumns/g, keyColumns);
    delBindKeys = delBindKeys.concat(bundle.keyColumns);

    // Insert
    keyColumns = "";
    placeHolders = "";
    ins = ins.replace(/:table/g, bundle.table);
    for (j = 0; j < bundle.keyColumns.length; j++) {
      if (j > 0) {
        keyColumns += ", ";
        placeHolders += ", ";
      }
      col = bundle.keyColumns[j];
      keyColumns += col;
      placeHolders += "?";
    }
    ins = ins.replace(/:keyColumns/g, keyColumns);
    insBindKeys = insBindKeys.concat(bundle.keyColumns);

    // Build 'col, col, col' and '?, ?, ?'
    otherColumns = "";
    for (j = 0; j < bundle.otherColumns.length; j++) {
      if (j > 0) {
        otherColumns += ", ";
      }
      otherColumns += bundle.otherColumns[j];
      placeHolders += ", ?";
    }
    insBindKeys = insBindKeys.concat(bundle.otherColumns);
    ins = ins.replace(/:otherColumns/g, otherColumns);
    ins = ins.replace(/:placeHolders/g, placeHolders);


    /// Copy all the generated stuff back into the bundle
    bundle.selectAllSQL = selAll;
    bundle.selectSQL = sel;
    bundle.selectBindKeys = selBindKeys;
    bundle.queryExistsSQL = query;
    bundle.queryExistsBindKeys = queryBindKeys;
    bundle.insertSQL = ins;
    bundle.insertBindKeys = insBindKeys;
    bundle.updateSQL = upd;
    bundle.updateBindKeys = updBindKeys;
    bundle.deleteSQL = del;
    bundle.deleteBindKeys = delBindKeys;

    log("Built persistence manager for: " + bundle.table);
    /*
    for (var key in bundle) {
      log("  " + key + " -> " + bundle[key]);
    }
    */

    // Add the functions
    bundle.get = function(keys, successCallback, errorCallback) {
      selectObject(bundle, keys, successCallback, errorCallback);
    };
    bundle.getAll = function(successCallback, errorCallback) {
      selectAllObjects(bundle, successCallback, errorCallback);
    };
    bundle.persist = function(object, successCallback, errorCallback) {
      insertOrUpdateObject(bundle, object, successCallback, errorCallback);
    };
    bundle.add = function(object, successCallback, errorCallback) {
      insertObject(bundle, object, successCallback, errorCallback);
    };
    bundle.update = function(object, successCallback, errorCallback) {
      updateObject(bundle, object, successCallback, errorCallback);
    };
    bundle.remove = function(keyHolder, successCallback, errorCallback) {
      deleteObject(bundle, keyHolder, successCallback, errorCallback);
    };

    // Select what we are going to export
    return {
        name : bundle.table,
        get : bundle.get,
        getAll : bundle.getAll,
        persist : bundle.persist,
        add : bundle.add,
        update: bundle.update,
        remove: bundle.remove
    };
  }


  var finalExport = {};

  // Auto create the SQL for each bundle
  for (var i = 0; i < bundles.length; i++) {
    var bundle = bundles[i];
    var functionBundle = new FunctionBundle(bundle);

    // Add it to the bumper bundle of export
    finalExport[bundle.table] = functionBundle;
  }

  return finalExport;
}