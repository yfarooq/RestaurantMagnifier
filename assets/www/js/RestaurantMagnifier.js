// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.

/**
 * This is the core coordinator for the application, and initial entry point
 * @author Yama Farooq (yama.farooq@gmail.com)
 */
// var LOG = buildLogger("Apperture.js");
// LOG.setLogLevel(LOG.TRACE);
//--------------------------------------------------
/**
 * Called when Cordova has finished initialisation
 */
function onDeviceReady() {
	console.log("onDeviceReady called");
	try {
		// Checking if codvia is running
		console.log("Device Id is : " + device.uuid);
		LAUNCH_MONITOR.displayGlobalState();
		LAUNCH_MONITOR.displayMessages();
		console.log("Let see if we are coming here");
		declareGlobalContainer(window);
		console.log("Let see if we are coming here2");
		APP.initManager = buildInitManager();
		console.log("Let see if we are coming here3");
		APP.initManager.startInitialisation();
		console.log("Init switched off...");
	} catch (error) {
		console.log("Failed during initalisation");
		for ( var x in error) {
			console.log("  " + x + " ->" + error[x]);
		}
	}
}
// --------------------------------------
// Global name space for the app
// --------------------------------------

function declareGlobalContainer(target) {
	console.log("declareGlobalContainer called");
	target.APP = {
		database : null,
		dataSchema : null,
		dataStructures : null,
		initManager : null,
		device : {
			name : null,
			platform : null,
			uuid : null,
			version : null,
			simulator : false
		},
		fileSystem : null,
		fileTools : null,
		online : false,
		persistence : null,
		types : null,
	};
}
// --------------------------------------
// Initialisation management method
// --------------------------------------

function buildInitManager() {
	console.log("BuildInitManager called");
	"use strict";
	console.log("BuildInitManager processing");
	var log = function(message) {
		console.log("RestaurantMagnifier.js: " + message);
	};

	// Current phase of initialisation
	var phase = 0;
	var taskCount = 0;
	var taskCompleteCount = 0;
	// Little structure for each task
	function Bundle(name, initMethod) {
		this.name = name;
		this.initialised = false;
		this.method = initMethod;
		// log("Createdbundle: " + name);
		taskCount++;
	}

	// Phase tasks, and their current completion state and the method to
	// initialise them
	var databaseBundle = new Bundle("Database", initDatabase);
	var dataSchemaBundle = new Bundle("Data schema", initDataSchema);
	var dataStructuresBundle = new Bundle("Data structures", initDataStructures);
	var deviceInfoBundle = new Bundle("Device info", initDeviceInfo);
	var displayBundle = new Bundle("Display", initDisplay);
	var downloadBundle = new Bundle("Download", initDownload);
	var downloadManagerBundle = new Bundle("Download manager",
			initDownloadManager);
	var persistenceBundle = new Bundle("Persistence manager",
			initPersistenceManager);
	var splashScreenBundle = new Bundle("Splash screen", initSplashScreen);

	// Phases, and their overall completion state
	var phases = new Array();
	phases.addPhase = function() {
		var tasks = new Array();
		for ( var i = 0; i < arguments.length; i++) {
			tasks.push(arguments[i]);
		}
		this[this.length] = tasks;
	};

	// -----------------
	// Set up the phases
	// ------------------

	// Determine if we are online or offline
	phases.addPhase(connectivityBundle);
	// Data and complex data types
	phases.addPhase(typesBundle);
	phases.addPhase(dataStructuresBundle);
	// Local database
	phases.addPhase(dataSchemaBundle);
	// Identifies display size for CSS
	phases.addPhase(displayBundle);
	// Generate metrics and manage the UI
	phases.addPhase(listenerBundle);
	phases.addPhase(uiManagerBundle)
	// Manage background downloading
	phases.addPhase(contentManagerBundle);
	// Greeting/authentication
	phases.addPhase(splashScreenBundle);

	function isPhaseComplete(phaseNumber) {
		// log("Started isPhaseComplete");
		for ( var task = 0; task < phases[phaseNumber].length; task++) {
			// log("Testing task " + task);
			if (!phases[phaseNumber][task].initialised) {
				// log("Is incomplete");
				return false;
			}
		}
		// log("Phase is complete");
		return true;
	}

	/**
	 * Called each time a phase task completes to see if we should kick off the
	 * next phase
	 */
	function taskComplete() {
		taskCompleteCount++;
		var completion = (taskCompleteCount / taskCount * 100);
		completion = Math.round(completion * 10) / 10;
		log("Initialisation is: " + completion + "% complete");
		// log("Started task complete");
		if (isPhaseComplete(phase)) {
			log("*** Phase complete: " + phase + " ***");
			phase++;
			startPhase(phase);
		}
	}
	/**
	 * Kick off a phase
	 */
	function startPhase(phaseNumber) {
		if (phaseNumber >= phases.length) {
			APP.metrics.saveMetric("AppOpen");

			var a = "aaaaaaaaaaaaaaaaaaaaaaaa";
			var l = a.replace(/a/g, "\\");
			var r = a.replace(/a/g, "/");

			log(l + r);
			log("INFO: Phased start is complete");
			log(r + l);
			return;
		}

		log("================================================");
		log("Starting phase: " + phaseNumber);
		log("================================================");

		var phaseTasks = phases[phaseNumber];

		log("INFO: Launching init phase: " + phaseNumber);
		// log("INFO: Phase: " + phaseNumber + " contains " + phaseTasks.length
		// + " tasks");

		for ( var t = 0; t < phaseTasks.length; t++) {
			var phaseTask = phaseTasks[t];

			/*
			 * for (var k in phaseTask) { log(k + "-> " + phaseTask[k]); }
			 */

			try {
				log("*** INFO: Phase: " + phaseNumber + " launching init for "
						+ phaseTask.name + " ***");

				var onComplete = function() {
					log("DEBUG: Phase: " + phaseNumber
							+ " - Completed initialisation of: "
							+ phaseTask.name);
					phaseTask.initialised = true;
					taskComplete();
				};

				phaseTask.method(onComplete);
			} catch (error) {
				// log("ERROR: Failed to launch init method: " +
				// phaseTask.name);
				dumpError("ERROR: Failed to launch init method: "
						+ phaseTask.name, error);
			}
		}
	}

	/**
	 * Logs the phase startup order
	 */
	function logPhases() {
		log("Phases are:");
		var msg;
		for ( var p = 0; p < phases.length; p++) {
			msg = "  Phase " + p + ": ";
			for ( var pp = 0; pp < phases[p].length; pp++) {
				if (pp > 0) {
					msg += ", ";
				}
				msg += phases[p][pp].name;
			}
			log(msg);
		}
	}

	// /-------------------------------------------------------------
	/**
	 * Mount APP.online
	 */
	function initConnectivity(completionCallback) {
		log("DEBUG:  Initialising connectivity monitor");

		// Process for online
		function onOnline() {
			APP.online = true;
			log("DEBUG: Connected to network");
		}

		// Process for offline
		function onOffline() {
			APP.online = false;
			log("DEBUG: Not connected to network");
		}

		document.addEventListener("offline", onOffline, false);
		document.addEventListener("online", onOnline, false);

		completionCallback();
	}
	/**
	 * Mount APP.dataStructures
	 */
	function initDataStructures(completionCallback) {
		log("DEBUG:  Initialising data structures");
		APP.dataStructures = buildDataStructures();
		completionCallback();
	}

	/**
	 * Mount APP.database
	 */
	function initDatabase(completionCallback) {
		log("DEBUG:  Initialising database controller");
		APP.database = buildDatabaseController();
		completionCallback();
	}
	/**
	 * Make sure we have a data schema, or upgrade the one we have to the latest
	 * version
	 */
	function initDataSchema(completionCallback) {
		log("DEBUG:  Initialising data schema");
		APP.dataSchema = buildDataSchema(completionCallback);
	}
	/**
	 * Build and mount the persistence manager
	 */
	function initPersistenceManager(completionCallback) {
		log("DEBUG:  Initialising persistence tooling");
		// Build the tools for coordinating the cache and the DB
		APP.persistence = buildPersistenceManager();
		completionCallback();
	}
	/**
	 * Grab all the device information we can
	 */
	function initDeviceInfo(completionCallback) {
		// Copy everything from the Cordova device object, should give us uuid,
		// platform, version and name
		for ( var val in device) {
			if (typeof device[val] !== "function") {
				APP.device[val] = device[val];
			}
		}

		// Decide on hardware
		APP.device.iOS = device.platform.startsWith("iOS")
				|| device.platform.startsWith("iPhone")
				|| device.platform.startsWith("iPad")
				|| device.platform.startsWith("iPod");
		APP.device.android = device.platform.startsWith("Android");
		APP.device.blackBerry = device.platform.startsWith("BlackBerry");

		// Make sure we have a consistent platform identifier for use in
		// Homunculus
		if (APP.device.iOS) {
			APP.device.platform = "iOS";
		} else if (APP.device.blackBerry) {
			APP.device.platform = "BlackBerry";
		} else if (APP.device.android) {
			APP.device.platform = "Android";
		} else {
			APP.device.platform = device.platform;
		}

		// Is this the real world, or is it a fantasy...
		var simulator = device.platform.indexOf("Simulator") > -1;
		if (simulator) {
			var msg = "|  Running in a simulated environment  |";
			var box = msg.replace(/./g, "-");
			log(box);
			log(msg);
			log(box);
		}
		APP.device.simulator = simulator;
		completionCallback();
	}
	function initUIManager(completionCallback) {
		APP.ui = buildUIManager();
		APP.ui.selectActiveUIConfig();
		completionCallback();
	}

	function initContentManager(completionCallback) {
		APP.contentManager = buildContentManager();
		completionCallback();
	}
	function initDownloadManager(completionCallback) {
		APP.downloadManager = buildDownloadManager();
		completionCallback();
	}

	function initDownload(completionCallback) {
		APP.contentManager.initDownloadQueue();
		completionCallback();
	}
	function initSync(completionCallback) {
		APP.contentManager.downloadSync();
		completionCallback();
	}

	// ---------------------------------------------------------------------------
	// Public access method to kick off init
	// ---------------------------------------------------------------------------

	return {
		// Method to kick off initialisation
		startInitialisation : function() {
			log("Kicking off init");
			logPhases();
			startPhase(0);
		}
	};
};
