// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.
/**
 * Useful extended data structures, currently: SingleKeyCache TwinKeyCache Which
 * are both basically Maps or Dictionaries.
 * 
 * @author Yama Ghulam Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading data structures");

/**
 * Builds a cache, idField is the name of the field that is the key for
 * autoPut-ed objects
 * 
 * @param cacheName
 *            Mandatory
 * @param idField
 *            Optional
 * @returns
 */
function buildDataStructures() {
	"use strict";

	var log = function(message) {
		console.log("DataStructures.js: " + message);
	};

	function SingleKeyCache(cacheName, autoPutKeyField) {

		// log("Constructing cache for: " + cacheName);

		if (arguments.length < 1) {
			throw "Cache must at least have a name!";
		}

		// Actual cache
		var name = cacheName;
		var cache = new Object();
		var keyField = null;
		var size = 0;
		if (arguments.length > 1) {
			keyField = autoPutKeyField;
		}

		if (keyField) {
			log("Constructed cache for " + name
					+ ", autoPut enabled using field: " + keyField);
		} else {
			log("Constructed cache for " + name
					+ ", autoPut is not enabled, no key field nominated");
		}

		// Export of public methods
		return {

			getName : function() {
				return name;
			},

			getSize : function() {
				return size;
			},

			/**
			 * Add an object to the cache, using the default field to supply the
			 * object's ID
			 * 
			 * @param object
			 * @returns Previous associated value if one was present
			 */
			autoPut : function(value) {
				if (!keyField) {
					throw "autoPut not enabled on this cache, needs the field name used to extract the key at construction";
				}
				var id = value[keyField];
				if (id) {
					return this.put(id, value);
				}
				throw "Unable to get key: " + keyField + " from object: "
						+ value;
			},

			/**
			 * Add an object to the cache
			 * 
			 * @param key
			 *            Key to insert in the map with
			 * @param value
			 *            Value to insert into the cache
			 * @return Previous value associated with this key
			 */
			put : function(key, value) {
				if (arguments.length < 2) {
					throw "SingleKeyCache.put requires 2 parameters";
				}
				var oldValue = this.get(key);
				cache[key] = value;
				if (!oldValue) {
					size++;
				}
				return oldValue;
			},

			/**
			 * Get an object by its ID from the cache
			 * 
			 * @param id
			 * @returns
			 */
			get : function(id) {
				return cache[id];
			},

			/**
			 * Remove an object (by its ID) from the cache
			 * 
			 * @param id
			 * @returns Value in the cache before deletion
			 */
			removeKey : function(id) {
				var result = cache[id];
				delete cache[id];
				if (result) {
					size--;
				}
				return result;
			},

			/**
			 * Remove an object and its associated key from the cache
			 * 
			 * @param value
			 *            Value to be removed
			 * @returns <code>true</code> if one or more values were removed
			 */
			removeValue : function(value) {
				var result = false;
				for ( var id in cache) {
					if (cache[id] === value) {
						delete cache[id];
						result = true;
						size--;
					}
					;
				}
				return result;
			},

			/**
			 * Indicates if an ID is in the cache
			 * 
			 * @param id
			 * @returns
			 */
			isCached : function(id) {
				return typeof cache[id] !== "undefined";
			},

			/**
			 * Get an array with a copy of all IDs in the cache at the moment
			 * 
			 * @returns
			 */
			getKeys : function() {
				var result = new Array();
				for ( var key in cache) {
					log("getAll: " + key);
					result.push(key);
				}
				return result;
			},

			/**
			 * Get an array with a copy of all values the cache at the moment
			 * 
			 * @returns
			 */
			getValues : function() {
				var result = new Array();
				for ( var key in cache) {
					result.push(cache[key]);
				}
				return result;
			},

			/**
			 * Call back is executed with each key as a parameter
			 * 
			 * @param callback
			 * @returns
			 */
			visitKeys : function(callback) {
				for ( var key in cache) {
					callback(key);
				}
			},

			/**
			 * Call back is executed with each value as a parameter
			 * 
			 * @param callback
			 * @returns
			 */
			visitValues : function(callback) {
				for ( var key in cache) {
					callback(cache[key]);
				}
			},

			/**
			 * Call back is executed with each value as a parameter
			 * 
			 * @param callback
			 * @returns
			 */
			visitEntries : function(callback) {
				for ( var key in cache) {
					callback(key, cache[key]);
				}
			}
		};
	}

	/**
	 * Builds a cache, idField/idField2 are the names of the fields that are the
	 * key for autoPut-ed objects
	 * 
	 * @param cacheName
	 *            Mandatory
	 * @param idField
	 *            Optional
	 * @param idField2
	 *            Optional
	 * @returns
	 */
	function TwinKeyCache(cacheName, autoPutKeyField, autoPutKeyField2) {
		"use strict";

		// log("Constructing cache for: " + cacheName);

		if (arguments.length < 1) {
			throw "Cache must at least have a name!";
		}

		// Actual cache
		var name = cacheName;
		var cache = new Object();
		var size = 0;

		var keyField = null;
		var keyField2 = null;
		if (arguments.length > 2) {
			keyField = autoPutKeyField;
			keyField2 = autoPutKeyField2;
		} else if (arguments.length > 2) {
			throw "Use a SingleKeyCache or supply two keys";
		}

		if (keyField2) {
			log("Constructed cache for " + name
					+ ", autoPut enabled using fields: " + keyField + " and "
					+ keyField2);
		} else {
			log("Constructed cache for " + name
					+ ", autoPut is not enabled, no key fields nominated");
		}

		// Export of public methods
		return {

			getName : function() {
				return name;
			},

			getSize : function() {
				return size;
			},

			/**
			 * Add an object to the cache, using the default field to supply the
			 * object's ID
			 * 
			 * @param object
			 * @returns Previous associated value if one was present
			 */
			autoPut : function(value) {
				if (!keyField) {
					throw "autoPut not enabled on this cache, needs the field name used to extract the key at construction";
				}
				return this.put(value[keyField], value[keyField2], value);
			},

			/**
			 * Add an object to the cache
			 * 
			 * @param key
			 *            Key to insert in the map with
			 * @param key2
			 *            Key to insert in the map with
			 * @param value
			 *            Value to insert into the cache
			 * @return Previous value associated with this key
			 */
			put : function(key, key2, value) {
				if (arguments.length < 3) {
					throw "TwinKeyCache.put requires 3 parameters";
				}
				// log("Put: " + key + ", " + key2 + " for " +
				// JSON.stringify(value));
				var oldValue = this.get(key, key2);
				var subCache = cache[key];
				if (!subCache) {
					subCache = new Object();
					cache[key] = subCache;
					// log(" First key created");
				} else {
					// log(" First key exists");
				}
				subCache[key2] = value;
				if (!oldValue) {
					size++;
				}
				return oldValue;
			},

			/**
			 * Get an object by its IDs from the cache
			 * 
			 * @param id
			 * @returns
			 */
			get : function(key, key2) {
				var subCache = cache[key];
				if (!subCache) {
					return null;
				}
				return subCache[key2];
			},

			/**
			 * Get the first value in the cache that corresponds with the
			 * supplued key2
			 * 
			 * @param key2
			 * @returns <code>null</code> if no value found
			 */
			getBySubKey : function(key2) {
				// log("getBySubKey: " + name + "/*/" + key2);
				for ( var key in cache) {
					// log("Checking: " + name + "/" + key);
					var subCache = cache[key];
					if (subCache[key2]) {
						return subCache[key2];
					}
				}
				return null;
			},

			/**
			 * Remove an object (by its ID) from the cache
			 * 
			 * @param id
			 * @returns Value in the cache before deletion
			 */
			removeKey : function(key, key2) {
				var result = this.get(key, key2);
				var subCache = cache[key];
				if (!subCache) {
					return null;
				}
				if (subCache[key2]) {
					delete subCache[key2];
					var found = false;
					for ( var val in cache) {
						// Shush compiler warnings!
						if (val) {
							found = true;
							break;
						}
					}
					if (!found) {
						delete cache[key];
					}
				}
				if (result) {
					size--;
				}
				return result;
			},

			/**
			 * Remove an object and its associated key from the cache
			 * 
			 * @param value
			 *            Value to be removed
			 * @returns <code>true</code> if one or more values were removed
			 */
			removeValue : function(value) {
				var result = false;

				var id = null;
				var id2 = null;
				var subCache = null;

				for (id in cache) {
					subCache = cache[id];
					for (id2 in subCache) {
						if (subCache[id2] === value) {
							delete subCache[id2];
							result = true;
							size--;
						}
					}
				}

				if (result) {
					// Clean up any empty top level cache keys
					for ( var id in cache) {
						subCache = cache[id];
						var found = false;
						for (id2 in subCache) {
							found = true;
							break;
						}
						if (!found) {
							delete cache[id];
						}
					}
				}
				return result;
			},

			/**
			 * Indicates if an ID is in the cache
			 * 
			 * @param id
			 * @returns
			 */
			isCached : function(key, key2) {
				return this.get(key, key2) != null;
			},

			/**
			 * Get an array with a copy of all first keys in the cache at the
			 * moment
			 * 
			 * @returns
			 */

			getKeys : function() {
				var result = new Array();
				for ( var key in cache) {
					result.push(key);
				}
				return result;
			},

			getSubKeys : function(id) {
				var result = new Array();
				var subCache = cache[id];
				if (!subCache) {
					return result; // empty array
				}
				for ( var key2 in subCache) {
					result.push(key2);
				}
				return result;
			},

			/**
			 * Get an array with a copy of all values the cache at the moment
			 * 
			 * @returns
			 */
			getValues : function() {
				var result = new Array();
				for ( var key in cache) {
					for ( var key2 in cache[key]) {
						result.push(cache[key][key2]);
					}
				}
				return result;
			},

			/**
			 * Call back is executed with each key pair as parameters
			 * 
			 * @param callback
			 * @returns
			 */
			visitKeys : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						callback(id, id2);
					}
				}
			},

			/**
			 * Call back is executed with each value as a parameter
			 * 
			 * @param callback
			 * @returns
			 */
			visitValues : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						callback(subCache[id2]);
					}
				}
			},

			/**
			 * Call back is executed with each key, key2 and value as a
			 * parameter tuple
			 * 
			 * @param callback
			 * @returns
			 */
			visitEntries : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						callback(id, id2, subCache[id2]);
					}
				}
			}

		};
	}

	/**
	 * Builds a cache, idField/idField2/idField3 are the names of the fields
	 * that are the key for autoPut-ed objects
	 * 
	 * @param cacheName
	 *            Mandatory
	 * @param idField
	 *            Optional
	 * @param idField2
	 *            Optional
	 * @param idField3
	 *            Optional
	 * @returns
	 */
	function TripleKeyCache(cacheName, autoPutKeyField, autoPutKeyField2,
			autoPutKeyField3) {
		"use strict";

		// log("Constructing cache for: " + cacheName);

		if (arguments.length < 1) {
			throw "Cache must at least have a name!";
		}

		// Actual cache
		var name = cacheName;
		var cache = new Object();
		var size = 0;

		var keyField = null;
		var keyField2 = null;
		var keyField3 = null;
		if (arguments.length > 3) {
			keyField = autoPutKeyField;
			keyField2 = autoPutKeyField2;
			keyField3 = autoPutKeyField3;
		} else if (arguments.length > 3) {
			throw "Use a SingleKeyCache/TwinKeyCache or supply three keys";
		}

		if (keyField3) {
			log("Constructed cache for " + name
					+ ", autoPut enabled using fields: " + keyField + ", "
					+ keyField2 + ", and " + keyField3);
		} else {
			log("Constructed cache for " + name
					+ ", autoPut is not enabled, no key fields nominated");
		}

		// Export of public methods
		return {

			getName : function() {
				return name;
			},

			getSize : function() {
				return size;
			},

			/**
			 * Add an object to the cache, using the default field to supply the
			 * object's ID
			 * 
			 * @param object
			 * @returns Previous associated value if one was present
			 */
			autoPut : function(value) {
				if (!keyField) {
					throw "autoPut not enabled on this cache, needs the field name used to extract the key at construction";
				}
				return this.put(value[keyField], value[keyField2],
						value[keyField3], value);
			},

			/**
			 * Add an object to the cache
			 * 
			 * @param key
			 *            Key to insert in the map with
			 * @param key2
			 *            Key to insert in the map with
			 * @param value
			 *            Value to insert into the cache
			 * @return Previous value associated with this key
			 */
			put : function(key, key2, key3, value) {
				if (arguments.length < 4) {
					throw "TripleKeyCache.put requires 4 parameters";
				}
				// log("Put: " + key + ", " + key2 + " for " +
				// JSON.stringify(value));
				var oldValue = this.get(key, key2);
				var subCache = cache[key];
				if (!subCache) {
					subCache = new Object();
					cache[key] = subCache;
					// log(" First key created");
				} else {
					// log(" First key exists");
				}
				var subSubCache = subCache[key2];
				if (!subSubCache) {
					subSubCache = new Object();
					subCache[key2] = subSubCache;
					// log(" First key created");
				} else {
					// log(" First key exists");
				}
				subSubCache[key3] = value;
				if (!oldValue) {
					size++;
				}
				return oldValue;
			},

			/**
			 * Get an object by its IDs from the cache
			 * 
			 * @param id
			 * @returns
			 */
			get : function(key, key2, key3) {
				var subCache = cache[key];
				if (!subCache) {
					return null;
				}
				var subSubCache = subCache[key2];
				if (!subSubCache) {
					return null;
				}
				return subSubCache[key3];
			},

			/**
			 * Get the first value in the cache that corresponds with the
			 * supplued key2
			 * 
			 * @param key2
			 * @returns <code>null</code> if no value found
			 */
			getBySubKey : function(key2) {
				// log("getBySubKey: " + name + "/*/" + key2);
				for ( var key in cache) {
					// log("Checking: " + name + "/" + key);
					var subCache = cache[key];
					if (subCache[key2]) {
						return subCache[key2][0];
					}
				}
				return null;
			},

			/**
			 * Remove an object (by its ID) from the cache
			 * 
			 * @param id
			 * @returns Value in the cache before deletion
			 */
			removeKey : function(key, key2, key3) {
				var result = this.get(key, key2, key3);
				var subCache = cache[key];
				if (!subCache) {
					return null;
				}
				if (subCache[key2]) {
					var subSubCache = subCache[key2];
					if (!subSubCache) {
						return null;
					}
					delete subSubCache[key3];
					if (subSubCache.length == 0) {
						delete subCache[key2];
						if (subCache.length == 0) {
							delete cche[key];
						}
					}
				}
				if (result) {
					size--;
				}
				return result;
			},

			/**
			 * Remove an object and its associated key from the cache
			 * 
			 * @param value
			 *            Value to be removed
			 * @returns <code>true</code> if one or more values were removed
			 */
			removeValue : function(value) {
				var result = false;

				var id = null;
				var id2 = null;
				var id3 = null;
				var subCache = null;
				var subSubCache = null;

				for (id in cache) {
					subCache = cache[id];
					for (id2 in subCache) {
						subSubCache = subCache[id2];
						for (id3 in subSubCache) {
							if (subSubCache[id3] === value) {
								delete subSubCache[id2];
								result = true;
								size--;
							}
						}
					}
				}

				if (result) {
					for ( var id in cache) {
						subCache = cache[id];
						for ( var id2 in subCache) {
							subSubCache = subCache[id2];
							for ( var id3 in subSubCache) {
								if (subSubCache[id3].length == 0) {
									delete subSubCache[id3];
								}
							}
							if (subCache[id2].length == 0) {
								delete subCache[id2];
							}
						}
						if (cache[id].length == 0) {
							delete cache[id];
						}
					}
				}
				return result;
			},

			/**
			 * Indicates if an ID is in the cache
			 * 
			 * @param id
			 * @returns
			 */
			isCached : function(key, key2, key3) {
				return this.get(key, key2, key3) != null;
			},

			/**
			 * Get an array with a copy of all first keys in the cache at the
			 * moment
			 * 
			 * @returns
			 */

			getKeys : function() {
				var result = new Array();
				for ( var key in cache) {
					result.push(key);
				}
				return result;
			},

			getSubKeys : function(id) {
				var result = new Array();
				var subCache = cache[id];
				if (!subCache) {
					return result; // empty array
				}
				for ( var key2 in subCache) {
					result.push(key2);
				}
				return result;
			},

			getSubSubKeys : function(id, id2) {
				var result = new Array();
				var subCache = cache[id];
				if (!subCache) {
					return result; // empty array
				}
				var subSubCache = subCache[id2];
				if (!subSubCache) {
					return result; // empty array
				}
				for ( var key3 in subSubCache) {
					result.push(key3);
				}
				return result;
			},

			/**
			 * Get an array with a copy of all values the cache at the moment
			 * 
			 * @returns
			 */
			getValues : function() {
				var result = new Array();
				for ( var key in cache) {
					for ( var key2 in cache[key]) {
						for ( var key3 in cache[key][key2]) {
							result.push(cache[key][key2][key3]);
						}
					}
				}
				return result;
			},

			/**
			 * Call back is executed with each key pair as parameters
			 * 
			 * @param callback
			 * @returns
			 */
			visitKeys : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						var subSubCache = subCache[i2];
						for ( var id3 in subSubCache) {
							callback(id, id2, id3);
						}
					}
				}
			},

			/**
			 * Call back is executed with each value as a parameter
			 * 
			 * @param callback
			 * @returns
			 */
			visitValues : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						var subSubCache = subCache[id2];
						for ( var id3 in subSubCache) {
							callback(subSubCache[id3]);
						}
					}
				}
			},

			/**
			 * Call back is executed with each key, key2 and value as a
			 * parameter tuple
			 * 
			 * @param callback
			 * @returns
			 */
			visitEntries : function(callback) {
				for ( var id in cache) {
					var subCache = cache[id];
					for ( var id2 in subCache) {
						var subSubCache = subCache[id2];
						for ( var id3 in subSubCache) {
							callback(id, id2, id3, subSubCache[id3]);
						}
					}
				}
			}

		};
	}

	return {
		SingleKeyCache : SingleKeyCache,
		TwinKeyCache : TwinKeyCache,
		TripleKeyCache : TripleKeyCache
	};
}
