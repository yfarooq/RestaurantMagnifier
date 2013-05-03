// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved..

/**
 * This takes defined objects and persists them to the database
 *
 * Builds a named logging module
 * <br />
 * Default logging level is WARN.  Available levels are: NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, ALL.
 * <br />
 * Setup:
 *     getLogLevel(level) Access the minimum level of a message that will be displayed
 *     setLogLevel(level) Modify the minimum level of a message that will be displayed
 *
 * Log:
 *  fatal(message) Send a message with fatal severity
 *  error(message) Send a message with error severity
 *  warn(message) Send a message with warn severity
 *  info(message) Send a message with info severity
 *  debug(message) Send a message with debug severity
 *  trace(message) Send a message with trace severity
 *
 * Note that all logging messages act in the same way, and are overloaded with the same arguments.
 *  debug(message);                - Message displayed
 *  debug(message, object);     - Message displayed and object JSON.stringified then displayed
 *  debug(message, array);         - Message displayed and each array element JSON.stringified then displayed
 *
 * Usage examples:
 *
 *       Call:       fatal("Message");
 *       Output:     [FATAL] Message
 *
 *       Call:       fatal("Message", "Extras");
 *       Output:     [FATAL] Message
 *                   [FATAL] +> {"Extras"}
 *
 *       Call:       fatal("Message", ["One", "Two", "Three"]);
 *       Output:     [FATAL] Message
 *                   [FATAL] +> {"One"}
 *                   [FATAL] +> {"Two"}
 *                   [FATAL] +> {"Three"}
 *
 * Substitution within the message using the object or array passed is also possible:
 *
 *       Call:       fatal("Missing cheese: {}!", "Edam");
 *       Output:     [FATAL] Missing cheese: Edam!
 *
 *       Call:       fatal("Message: {}, {} & {}!", ["One", "Two", "Three"]);
 *       Output:     [FATAL] Message: One, Two & Three!
 *
 * However, no checking is done to confirm the array size matches with the number of substitutions, so output like this is possible:
 *
 *       Call:       fatal("Message: {}!", ["One", "Two", "Three"]); // Array too big
 *       Output:     [FATAL] Message: One!
 *
 *       Call:       fatal("Message: {}, {} & {}!", ["One"]); // Array too small
 *       Output:     [FATAL] Message: One, {} & {}!
 *
 *
 * @param name Mandatory: String appended to each log statement
 * @param level Optional: Initial level that logging is performed at, defaults to INFO if unset
 * @author Yama Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading RestaurantMagnifier logging");
function buildLogger(name, level) {
	"use strict";

	var result = new function() {
	};

	result.name = name;

	// And so the naughtiness begins
	var namePrefix = (name) ? (name + ": ") : "";

	result.toString = function() {
		return "Logger:" + namePrefix;
	};

	//-------------------------------------
	//Constants
	//-------------------------------------
	var NONE = "NONE";
	var FATAL = "FATAL";
	var ERROR = "ERROR";
	var WARN = "WARN";
	var INFO = "INFO";
	var DEBUG = "DEBUG";
	var TRACE = "TRACE";
	var ALL = "ALL";

	var NONE_LEVEL = -1;
	var FATAL_LEVEL = 0;
	var ERROR_LEVEL = 1;
	var WARN_LEVEL = 2;
	var INFO_LEVEL = 3;
	var DEBUG_LEVEL = 4;
	var TRACE_LEVEL = 5;
	var ALL_LEVEL = 6;

	var LOG_LEVELS = {
		NONE : NONE_LEVEL,
		FATAL : FATAL_LEVEL,
		ERROR : ERROR_LEVEL,
		WARN : WARN_LEVEL,
		INFO : INFO_LEVEL,
		DEBUG : DEBUG_LEVEL,
		TRACE : TRACE_LEVEL,
		ALL : ALL_LEVEL
	};

	var LEVEL_NAMES = {
		NONE_LEVEL : NONE,
		FATAL_LEVEL : FATAL,
		ERROR_LEVEL : ERROR,
		WARN_LEVEL : WARN,
		INFO_LEVEL : INFO,
		DEBUG_LEVEL : DEBUG,
		TRACE_LEVEL : TRACE,
		ALL_LEVEL : ALL
	};

	var FATAL_PREFIX = namePrefix + "[" + FATAL + "] ";
	var ERROR_PREFIX = namePrefix + "[" + ERROR + "] ";
	var WARN_PREFIX = namePrefix + "[ " + WARN + "] ";
	var INFO_PREFIX = namePrefix + "[ " + INFO + "] ";
	var DEBUG_PREFIX = namePrefix + "[" + DEBUG + "] ";
	var TRACE_PREFIX = namePrefix + "[" + TRACE + "] ";

	// ---------------------------------------------------
	// Don't use until fixed - Starts here
	// ---------------------------------------------------

	/*
	 * Get the first of the supplied loggers that actually exists
	 */
	/*
	function getFirstLogger(name, loggerArray) {
	    for (var i = 0; i < loggerArray.length; i++) {
	        var loggerMember = loggerArray[i];
	        if (typeof loggerMember !== "undefined") {
	            console.log("Logger " + name + " mapped to preference " + i);
	            // console.log("Found alternate logger");
	            return loggerMember;
	        }
	    }
	    // Default to console log
	    console.log("Logger " + name + " mapped to default log");
	    return console.log;
	}
	 */
	/*
	var internalLogger = function() {
	    return {
	        // Set the loggers
	        fatal : getFirstLogger("fatal", [console.fatal, console.error, console.warn, console.info, console.debug, console.trace]),
	        error : getFirstLogger("error", [console.error, console.warn, console.info, console.debug, console.trace]),
	        warn : getFirstLogger("warn", [console.warn, console.info, console.debug, console.trace]),
	        info : getFirstLogger("info", [console.info, console.debug, console.trace]),
	        debug : getFirstLogger("debug", [console.debug, console.trace]),
	        trace : getFirstLogger("trace", [console.trace]),
	        // Set default for missed hits
	        log : console.log,
	        // Log a message at the given level
	        logIt : function(level, message) {
	            console.log("Level: " + level + ", message: " + message);
	            try {
	                switch(level) {
	                case FATAL_LEVEL:
	                    fatal(message);
	                    break;
	                case ERROR_LEVEL:
	                    error(message);
	                    break;
	                case WARN_LEVEL:
	                    warn(message);
	                    break;
	                case INFO_LEVEL:
	                    info(message);
	                    break;
	                case DEBUG_LEVEL:
	                    debug(message);
	                    break;
	                case TRACE_LEVEL:
	                    trace(message);
	                    break;
	                default:
	                    log(message);
	                }
	            } catch (error) {
	                console.log(message);
	                console.log("Logging error:");
	                for (var e in error) {
	                    console.log("  " + e + " -> " + error[e]);
	                }
	            }
	        }
	    };
	};
	 */
	// ---------------------------------------------------
	// Don't used until fixed - ends here
	// ---------------------------------------------------

	// -------------------------------------
	// Private
	// -------------------------------------
	// The current log level, default to showing warnings, errors and fatals only
	var logLevel = LOG_LEVELS[WARN];
	if (arguments.length > 1) {
		try {
			for ( var lev in LEVEL_NAMES) {
				if (lev === level) {
					logLevel = LOG_LEVELS[lev];
					break;
				}
			}
		} catch (error) {
			console.log("Invalid log option: " + level);
		}
	}

	// -------------------------------------
	// Public
	// -------------------------------------

	result.NONE = "NONE";
	result.FATAL = "FATAL";
	result.ERROR = "ERROR";
	result.WARN = "WARN";
	result.INFO = "INFO";
	result.DEBUG = "DEBUG";
	result.TRACE = "TRACE";
	result.ALL = "ALL";

	/**
	 * Public method setLogLevel(level)
	 * Sets the minimum level of a message for it to be logged
	 * @param level Valid values are: NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, ALL
	 */
	result.setLogLevel = function(level) {
		try {
			var newLevel = LOG_LEVELS[level];
			if (typeof newLevel === "undefined" || newLevel === null) {
				console
						.log("Attempted to set logging level to an invalid value: "
								+ level + " defaulting to " + ALL);
				newLevel = LOG_LEVELS[ALL];
			}
			logLevel = newLevel;
		} catch (error) {
			console.log("Initialisation failed");
			dump(error);
		}
	};

	/**
	 * Public method getLogLevel()
	 * Gets the minimum level of a message in order for output to be generated, the default value is WARN if not previously set
	 * @returns Will return one of the following values: NONE, FATAL, ERROR, WARN, INFO, DEBUG, TRACE, ALL
	 */
	result.getLogLevel = function() {
		return LEVEL_NAMES[logLevel];
	};

	/**
	 * Log a fatal message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.fatal = function(message, array) {
		try {

		} catch (error) {

		}
		if (logLevel < FATAL_LEVEL) {
			return;
		}
		log(FATAL_LEVEL, FATAL_PREFIX, message, array);
	};

	/**
	 * Log an error message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.error = function(message, array) {
		if (logLevel < ERROR_LEVEL) {
			return;
		}
		log(ERROR_LEVEL, ERROR_PREFIX, message, array);
	};

	/**
	 * Log an warn message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.warn = function(message, array) {
		if (logLevel < WARN_LEVEL) {
			return;
		}
		log(WARN_LEVEL, WARN_PREFIX, message, array);
	};

	/**
	 * Log an info message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.info = function(message, array) {
		if (logLevel < INFO_LEVEL) {
			return;
		}
		log(INFO_LEVEL, INFO_PREFIX, message, array);
	};

	/**
	 * Log an debug message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.debug = function(message, array) {
		if (logLevel < DEBUG_LEVEL) {
			return;
		}
		log(DEBUG_LEVEL, DEBUG_PREFIX, message, array);
	};

	/**
	 * Log an trace message with attached objects to dump too
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	result.trace = function(message, array) {
		if (logLevel < TRACE_LEVEL) {
			return;
		}
		log(TRACE_LEVEL, TRACE_PREFIX, message, array);
	};

	// -------------------------------------
	// Private Methods
	// -------------------------------------

	function loglog(msg) {
		console.log("LOGGER: " + msg);
	}
	;

	/**
	 * Actual code that does the logging
	 * @param prefix The severity prefix prepended to the message
	 * @param message Message to display
	 * @param array A single object or an array of objects to log too
	 */
	function log(level, prefix, message, array) {
		// loglog("Start");

		// loglog("Prefix: " + (typeof prefix));
		// loglog("Message: " + (typeof message));
		// loglog("Array: " + (typeof array));

		var i;
		var indent = "+> ";

		// See if the array has any contents
		if (typeof array !== "undefined" && array !== null) {
			// loglog("Array present");

			// See if we are substituting
			if (message.indexOf("{}") > -1) {
				// loglog("Requires substitution");
				// Looks like we are doing substitutions!

				// Convert array to an Array if required
				var certainArray = array;
				if (!Array.isArray(array)) {
					// loglog("Array is an array");

					certainArray = new Array();
					certainArray.push(array);
				}

				// loglog("Apply substitutions");
				// Substitute
				var newMessage = message;
				for (i = 0; i < certainArray.length; i++) {
					newMessage = newMessage.replace("{}", certainArray[i]);
				}

				// loglog("Display");
				// Display
				try {
					console.log(prefix + newMessage);
				} catch (error) {
					console.log(namePrefix
							+ "LOG ERROR: Unable to display message");
				}

			} else {
				// loglog("No substitutions");
				// Not substituting, so just display the addition(s) after the message
				if (Array.isArray(array)) {
					// loglog("Array is an array");
					// Dump each element separately
					console.log(prefix + message);
					for (i = 0; i < array.length; i++) {
						var o = array[i];
						try {
							console.log(prefix + indent + JSON.stringify(o));
						} catch (error) {
							console
									.log(namePrefix
											+ "LOG ERROR: Unable to serialise object in array element "
											+ i);
						}
					}

				} else {
					// loglog("Array is a single object");
					// Dump a single object
					console.log(prefix + message);
					try {
						var stringified = JSON.stringify(array);
						if (typeof stringified !== "undefined") {
							console.log(prefix + indent + stringified);
						} else {
							if (typeof array.name !== "undefined") {
								console.log(prefix + indent + array);
							} else {
								console.log(prefix + indent
										+ "Anonymous function");
							}
						}
					} catch (error) {
						console
								.log(namePrefix
										+ "LOG ERROR: Unable to serialise additional object");
					}
				}
			}

		} else {
			// loglog("Simple message");
			// No array content so just dump the message
			console.log(prefix + message);
			/*
			try {
			    internalLogger.logIt(level, message);
			} catch (error) {
			    console.log(namePrefix + "LOG ERROR: invalid message");
			}
			 */
		}
	}
	;

	// Super debug option....
	if ("SUPER" === "SUPER") {
		return {
			setLogLevel : new function() { /* does nothing */
			},
			getLogLevel : new function() {
				return "SUPER DEBUG";
			},
			trace : console.log,
			debug : console.log,
			info : console.log,
			warn : console.log,
			error : console.log,
			fatal : console.log
		};
	}
	// Return a reference to the logger
	return result;
};
console.log("Installed ResturantMagnifier logger");