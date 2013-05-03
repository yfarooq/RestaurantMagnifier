// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.

/**
 * Wraps the database and enforces error trapping and reporting
 *
 * @author Yama Ghulam Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading database controller");

function buildDatabaseController() {
	// "use strict";

	var log = function(message) {
		console.log("Database.js: " + message);
	};

	log("Initialising Database Manager");

	// Private stuff
	var ALL_DEBUG_ENABLED = false;
	log("Extended debugging enabled: " + ALL_DEBUG_ENABLED);

	var dbName = APP.defaults.agency + "-" + APP.defaults.client + "-"
			+ APP.defaults.name;
	var dbVersion = APP.defaults.dbVersion;
	var dbSize = APP.defaults.dbSize;

	log("DB Name: " + dbName);

	// Internal reference to the database
	var db = openDatabase(dbName, dbVersion, dbName, dbSize);

	// Default handler for errors that occur
	var standardSuccessHandler = function(results) {
		log("SQL executed OK");
	};

	// Default handler for errors that occur
	var standardErrorHandler = function(error) {
		log("SQL failed:");

		for ( var key in error) {
			log("  " + key + " : " + error[key]);
		}
	};

	// Default handler for transaction errors that occur
	var standardTXErrorHandler = function(error) {
		log("Transaction failed:");

		var matchedErrorCode = false;
		if (error.code) {
			var code = error.code;
			// log("Trying to decode : " + code);
			for ( var key in error) {
				if (key === "code") {
					continue;
				}
				if (code === error[key]) {
					log("  code : " + key + " (" + code + ")");
					matchedErrorCode = true;
				}
			}
		}

		for ( var key in error) {
			// Skip code if we have already displayed the decode of the code
			if (key === "code" && matchedErrorCode) {
				continue;
			}
			// Skip the constants
			if (key === key.toUpperCase()) {
				continue;
			}
			log("  " + key + " : " + error[key]);
		}
	};

	// Default handler for transaction errors that occur
	var standardTXSuccessHandler = function() {
		// log("Transaction Success");
	};

	// Transaction identification
	var wrappedTransactionCounter = 0;

	/**
	 * Validates parameters and executes SQL in supplied transaction
	 *
	 * @param tx Mandatory Transaction to run in
	 * @param sql Mandatory SQL to execute
	 * @param parameters Optional: SQL binding values, auto coerced into an array if a single value is passed
	 * @param success Optional: Method to call on success
	 * @param error Optional: Method to call on failure
	 */
	function publicExecuteSqlInTransaction(tx, sql, parameters, success, error) {
		var _sql = sql;
		var _parameters = parameters;
		var _success = standardSuccessHandler;
		var _error = standardErrorHandler;

		// Validate
		if (!tx) {
			_error({
				message : "No Transaction supplied for SQL: " + _sql
			});
			return;
		}

		if (!sql) {
			_error({
				message : "No SQL supplied"
			});
			return;
		}

		// Coerce
		if (!parameters) {
			_parameters = [];
		} else if (!Array.isArray(parameters)) {
			_parameters = [ parameters ];
		}

		// Set optional parameters if present
		if (arguments.length > 3) {
			_success = success;
		}
		if (arguments.length > 4) {
			_error = error;
		}

		validatedExecuteSqlInTransaction(tx, _sql, _parameters, _success,
				_error);
	}

	/**
	 * Executes SQL in supplied transaction, all parameters are assumed validated
	 *
	 * @param tx Mandatory Transaction to run in
	 * @param sql Mandatory SQL ro execute
	 * @param parameters Mandatory: SQL binding values, auto coerced into an array if a single value is passed
	 * @param success Mandatory: Method to call on success
	 * @param error Mandatory: Method to call on failure
	 */
	function validatedExecuteSqlInTransaction(tx, sql, parameters,
			successCallback, errorCallback) {
		log("validatedExecuteSqlInTransaction called");
		try {
			log("SQL:    " + sql);
			log("Params: " + parameters);
		} catch (error) {
			log("Failed to log request");
		}

		// Transaction free response if a result set is generated
		var result = new Array();

		tx.executeSql(sql, parameters,
		// SQL executed successfully
		function(tx, resultSet) {
			// Extract Result Set
			if (resultSet && resultSet.rows.length > 0) {
				for ( var i = 0; i < rs.rows.length; i++) {
					result.push(resultSet.rows.item(i));
				}
			}
			// And send it off to the success callback
			successCallback(result);
		},
		// SQL execution failure
		function(error) {
			error.sql = sql;
			error.parameters = parameters;
			errorCallback(error);
		});
	}

	/**
	 * Execute a piece of SQL in a new transaction
	 *
	 * @param sql Mandatory: SQL to execute
	 * @param parameters Mandatory: Parameters required for SQL, null, and single objects wil be autocoersed into an array
	 * @param success Optional: Callback for execution success, takes array of results from a result set
	 * @param error Optional: Callback for execution failure, takes error object
	 * @param txError Optional: Callback for transaction failure, takes error object
	 * @param txSuccess Optional: Callback for transaction success, takes no arguments
	 */
	function publicExecuteMultipleSql(sqlArray, parametersArray, success,
			error, txError, txSuccess) {
		var _sqlArray = sqlArray;
		var _parametersArray = parametersArray;
		var _success = success;
		var _error = error;
		var _txError = txError;
		var _txSuccess = txSuccess;

		// Validation
		if (!sqlArray || !Array.isArray(sqlArray)) {
			error({
				message : "Invalid SQL array"
			});
			return;
		}
		if (!parametersArray || !Array.isArray(parametersArray)) {
			error({
				message : "Invalid parameters array"
			});
			return;
		}

		if (sqlArray.length != parametersArray.length) {
			error({
				message : "Arrays must be the same length"
			});
			return;
		}

		// Optional arguments
		if (arguments.length > 2) {
			_success = success;
		}
		if (arguments.length > 3) {
			_error = error;
		}
		if (arguments.length > 4) {
			_txError = txError;
		}
		if (arguments.length > 5) {
			_txSuccess = txSuccess;
		}

		var fullResult = new Array();

		db.transaction(function(tx) {
			for ( var index = 0; index < _sqlArray.length; index++) {
				// Get current command
				var sql = _sqlArray[index];
				var parameters = _parametersArray[index];

				// Process Success
				var localSuccess = function(singleResult) {
					fullResult.push(singleResult);
				};

				// Process Error
				var localError = function(singleError) {
					singleError.index = i;
					_error(singleError);
				};

				// Execute
				validatedExecuteSqlInTransaction(tx, sql, parameters,
						localSuccess, localError);
			}
		},
		// Transaction Error
		function(error) {
			_txError(error);
		},
		// Transaction Success
		function() {
			// Respond with result of whole transaction
			_success(fullResult);
			_txSuccess();
		});
	}

	/**
	 * Validate parameters and then execute a piece of SQL in a new transaction
	 *
	 * @param sql Mandatory: SQL to execute
	 * @param parameters Mandatory: Parameters required for SQL, null, and single objects wil be autocoersed into an array
	 * @param success Optional: Callback for execution success, takes array of results from a result set
	 * @param failure Optional: Callback for execution failure, takes error object
	 * @param txFailure Optional: Callback for transaction failure, takes error object
	 * @param txSuccess Optional: Callback for transaction success, takes no arguments
	 */
	function publicExecuteSql(sql, parameters, success, failure, txFailure,
			txSuccess) {
		var _sql = sql;
		var _parameters = parameters;
		var _success = standardSuccessHandler;
		var _failure = standardErrorHandler;
		var _txFailure = standardTXErrorHandler;
		var _txSuccess = standardTXSuccessHandler;

		// Coerse single parameter
		if (parameters === null) {
			_paramaters = [];
		} else if (!Array.isArray(parameters)) {
			_paramaters = [ paramaters ];
		}

		// Set optional arguments
		if (arguments.length > 2 && success) {
			_success = success;
		}
		if (arguments.length > 3 && failure) {
			_failure = failure;
		}
		if (arguments.length > 4 && txFailure) {
			_txFailure = txFailure;
		}
		if (arguments.length > 5 && txSuccess) {
			_txSuccess = txSuccess;
		}

		validatedExecuteSql(_sql, _parameters, _success, _failure, _txFailure,
				_txSuccess);
	}

	/**
	 * Execute a single piece of SQL in its own transaction, all parameters are assumed validated
	 *
	 * @param sql Mandatory: SQL to execute
	 * @param parameters Mandatory: Parameters required for SQL, null, and single objects wil be autocoersed into an array
	 * @param success Mandatory: Callback for execution success, takes array of results from a result set
	 * @param failure Mandatory: Callback for execution failure, takes error object
	 * @param txFailure Mandatory: Callback for transaction failure, takes error object
	 * @param txSuccess Mandatory: Callback for transaction success, takes no arguments
	 */
	function validatedExecuteSql(sql, parameters, success, failure, txFailure,
			txSuccess) {
		log("validatedExecuteSql called");
		// Build Transaction, and execute our SQL
		db.transaction(
		// Run in transaction
		function(tx) {
			validatedExecuteSqlInTransaction(tx, sql, parameters, success,
					failure);
		},
		// Transaction failure
		function(error) {
			error.sql = sql;
			error.parameters = _parameters;
			txFailure(error);
		},
		// Transaction success
		function() {
			txSuccess();
		});
	}

	/**
	 * Validates inputs, then selects all data from a table or view
	 * @param tableOrViewName Mandatory
	 * @param success Mandatory: Callback with transaction-free data array of results
	 * @param failure Optional
	 *
	 */
	function publicSelectAllFrom(tableOrViewName, success, failure) {
		if (!tableOrViewName) {
			throw "Invalid table or view name suppied";
		}
		if (argumentsLength > 1) {
			throw "Must supply a success callback";
		}
		var SQL = "SELECT * FROM " + tableOrViewName;
		localExecuteSql(SQL, null, success, failure);
	}

	/**
	 * Validates parameters, then inserts into a table, or updates a row in a table atomically
	 *
	 * @param tableName Mandatory: Table to insert into or update
	 * @param keyName Mandatory: Table column that identifies the target row
	 * @param keyValue Mandatory: Value of table column that identifies the target row
	 * @param fieldNameArray Mandatory: Array of other column names in the table (single values coerced into an array)
	 * @param fieldValueArray Mandatory: Array of values for column names in the table (single values coerced into an
	 *          array)
	 * @param success Optional: Success callback, will get the result set of either the insert or update that is executed
	 * @param error Optional: Success callback, will get the result set of either the insert or update that is executed
	 */
	function publicInsertOrUpdate(tableName, keyName, keyValue, fieldNameArray,
			fieldValuesArray, success, error) {
		var _tableName = tableName;
		var _keyName = keyName;
		var _keyValue = keyValue;
		var _fieldNamesArray = fieldNameArray;
		var _fieldValuesArray = fieldValueArray;
		var _success = standardSuccessHandler;
		var _error = standardErrorHandler;

		// Validation
		if (!tableName) {
			throw "Invalid table name suppied";
		}
		if (!keyName || !keyValue) {
			throw "Invalid key details";
		}
		if (!fieldNameArray || !fieldValuesArray) {
			throw "fieldNames and/or values are invalid";
		}

		// Optional arguments
		if (arguments.length > 5) {
			_success = success;
		}
		if (arguments.length > 6) {
			_error = error;
		}

		// Coercion of values
		if (!Array.isArray(fieldNameArray)) {
			_fieldNamesArray = [ fieldNameArray ];
		}
		if (!Array.isArray(fieldValuesArray)) {
			_fieldValuesArray = [ fieldValuesArray ];
		}

		// Build the SQL to Select/Insert and update
		var selectSQL = "SELECT * FROM " + _tableName + " WHERE " + _keyName
				+ " = ?";
		log("Select SQL built: " + selectSQL);

		var insertSQL = "INSERT INTO " + _tableName + " (";
		var insertValues = new Array();

		var updateSQL = "UPDATE " + _tableName + " SET ";
		var updateValues = new Array();

		// Build insert SQL
		var insertFields = _keyName;
		var insertPlaceholders = "?";

		insertValues.push(_keyValue);
		for ( var i = 0; i < _fieldNamesArray.length; i++) {
			insertFields += ", " + _fieldNamesArray[i];
			insertPlaceholders += ", ?";
			insertValues.push(_fieldValuesArray[i]);
		}
		insertSQL += insertFields + ") VALUES (" + insertPlaceholders + ")";

		log("Insert SQL built: " + insertSQL);

		// Build Update SQL
		var updateFields = "";
		for ( var i = 0; i < _fieldNamesArray.length; i++) {
			if (i > 0) {
				updateFields += ", ";
			}
			updateFields += _fieldNamesArray[i] + " = ?";
			updateValues.push(_fieldValuesArray[i]);
		}
		updateSQL += updateFields + " WHERE (" + _keyName + " = ?";
		updateValues.push(_keyValue);

		log("Update SQL built: " + insertSQL);

		function enhance(object, action, values) {
			object.action = action;
			object.tableName = _tableName;
			if (arguments.length > 2) {
				object.sqlValues = values;
			}
		}

		// TODO Single transaction

		// If the ID does not exist, we call this
		function executeInsert() {
			localExecuteSql(insertSQL, insertValues, function(result) {
				enhance(result, "INSERT");
				_success(result);
			}, function(error) {
				enhance(error, "INSERT", insertValues);
				_error(error);
			});
		}

		// If the ID does exist we call this
		function executeUpdate() {
			localExecuteSql(updateSQL, updateValues, function(result) {
				enhance(result, "UPDATE");
				_success(result);
			}, function(error) {
				enhance(error, "UPDATE", updateValues);
				_error(error);
			});
		}

		// Determine if the key exists
		localExecuteSql(selectSQL, _keyValue, function(result) {
			if (result.length > 0) {
				executeUpdate();
			} else {
				executeInsert();
			}
		}, function(error) {
			enhance(error, "UPDATE", [ _keyValue ]);
			_error(error);
		});
	}

	/**
	 * Gets rid of all the white space in the SQL
	 * @param sql
	 * @returns
	 */
	function getTidySQL(sql) {
		var tidySql = sql;
		try {
			tidySql = tidySql.replace(/^\s+/g, "");
			tidySql = tidySql.replace(/\s+/g, " ");
		} catch (error) {
			dumpError("Failed to tidy SQL", error);
		}
		return tidySql;
	}

	/**
	 * Wraps the transaction, so we can intercept SQL and parameters and adde them to error messages
	 * @param transactionId
	 * @param debugEnabled
	 * @param callback
	 * @returns
	 */
	function WrappedTransaction(transactionId, debugEnabled, callback) {
		// log("Building wrapped transaction: " + transactionId);

		// Currently running SQL
		var _sql = "";
		var _params = [];

		// requested transaction
		db
				.transaction(
						// Execute in transaction
						function(tx) {
							// log("Transaction requested");

							var wrapper = new Object();
							for (key in tx) {
								wrapper[key] = tx[key];
							}

							// Override the executeSql function
							wrapper.executeSql = function(sql, params, success,
									failure) {
								// log("Arguments: " + arguments.length);
								// Trap what sql is being called
								_sql = null;
								_params = null;
								var _success = standardSuccessHandler;
								var _failure = standardErrorHandler;

								if (arguments.length > 0) {
									_sql = sql;
								}
								if (arguments.length > 1) {
									_params = params;
								}
								if (arguments.length > 2) {
									_success = success;
								}
								if (arguments.length > 3) {
									_failure = failure;
								}

								// Log what is being called
								var tidySql = getTidySQL(_sql);

								// Fix params
								if (typeof params == "function") {
									// Looks like someone forgot to add an empty parameter array, fix params
									log("DEBUG: Auto inserted empty parameter set for "
											+ tidySql);
									_params = []; // Insert
									_success = params; // shift
									_failure = success; // shift
								} else if (!Array.isArray(params)) {
									log("DEBUG: Converted single object parameter to array for: "
											+ tidySql);
									_params = [ params ];
								}

								if (ALL_DEBUG_ENABLED || debugEnabled) {
									log("Execute called with: " + tidySql);
									if (params) {
										log("Transaction " + transactionId
												+ ": Executing SQL: " + tidySql);
										if (params.length > 0) {
											// Debug params
											for ( var i = 0; i < params.length; i++) {
												log("  Bind "
														+ i
														+ " is: "
														+ (typeof params[i] === "string" ? '"'
																+ params[i]
																+ '"'
																: params[i]));
											}
										}
									}
								}

								// Success
								function awesome(tx, rs) {
									// log("Transaction " + transactionId + ": SQL OK: " + tidySql);
									// log("Params: " + (_params ? _params : "None"));
									if (_success) {
										_success(tx, rs);
									}
								}
								;
								// Failure
								function dagnabit(error) {
									log("Transaction " + transactionId
											+ ": SQL failed: " + tidySql);
									log("Params: "
											+ (_params ? _params : "None"));
									if (_failure) {
										_failure(error);
									}
								}

								// Now actually do it
								tx.executeSql(sql, params, awesome, dagnabit);
							};

							callback(wrapper);
						},
						// On transaction error
						function(error) {
							// log("Transaction " + transactionId + " failed!");
							error.transactionId = transactionId;
							error.sql = _sql;
							error.params = _params;
							standardTXErrorHandler(error);
						},
						// On transaction success
						function() {
							// log("Transaction " + transactionId + " completed OK");
							standardTXSuccessHandler();
						});
	}

	// Get a transaction for general usage
	function transaction(callback, debugEnabled) {
		var transactionId = wrappedTransactionCounter++;
		var _debugEnabled = false;
		if (arguments.lenth > 1) {
			_debugEnabled = debugEnabled;
		}
		return new WrappedTransaction(transactionId, _debugEnabled, callback);
	}

	return {
		transaction : transaction,
		execute : publicExecuteSql,
		selectAllFrom : publicSelectAllFrom,
		insertOrUpdate : publicInsertOrUpdate
	};
};
