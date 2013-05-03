// Copyright: Yama Ghulam Farooq. 2013.
// All rights reserved.
/**
 * This either creates or updates the database schema,so we always have the latest database and the latest default data
 *
 * @author Yama Ghulam Farooq (yama.farooq@gmail.com)
 */

LAUNCH_MONITOR.addMessage("Loading data schema");

function buildDataSchema(completionCallback) {
	// var LOG = buildLogger("AppertureDataSchema.js");
	// LOG.setLogLevel(LOG.TRACE);

	var log = function(message) {
		console.log("DataSchema.js: " + message);
	};

	log("INFO: Build data schema started");

	var LATEST_DATABASE_VERSION = 1;
	var databaseVersion = -1;

	var action = "No action required";
	var message = "Database mounted";

	function manageSchemaVersioning(tx) {
		// Check to see if we have a database at all
		if (databaseVersion < 1) {
			// Latest build script goes here always
			log("INFO: Creating initial database tables");

			tx
					.executeSql(

					"CREATE TABLE Resturant ("
							+ "  id                            TEXT          UNIQUE, "
							+ "  name                         TEXT, "
							+ "  summary                       TEXT, "
							+ "  broadcast                     TEXT, "
							+ "  broadcastIcon                 TEXT, "
							+ "  broadcastType                 TEXT, "
							+ "  parts                         INTEGER, "
							+ "  partsDownloaded               INTEGER, "
							+ "  partsUnpacked                 INTEGER, "
							+ "  partsStitched                 INTEGER, "
							+ "  downloaded                    INTEGER       DEFAULT 0, "
							+ "  unpacked                      INTEGER       DEFAULT 0, "
							+ "  stitched                      INTEGER       DEFAULT 0, "
							+ "  opened                        INTEGER       DEFAULT 0, "
							+ "  removed                       INTEGER       DEFAULT 0, "
							+ "  favourite                     INTEGER       DEFAULT 0, "
							+ "  notified                      INTEGER       DEFAULT 0)");

			tx
					.executeSql(

					"CREATE TABLE cacheLocally ("
							+ "  ownerId                       TEXT, "
							+ "  key                           TEXT, "
							+ "  objectType                    TEXT, "
							+ "  URL                           TEXT, "
							+ "  path                          TEXT, "
							+ "  partOf                        TEXT, "
							+ "  partNumber                    INTEGER       DEFAULT 0, "
							+ "  failures                      INTEGER       DEFAULT 0, "
							+ "  lastFailure                   DATE          DEFAULT 0, "
							+ "  downloaded                    INTEGER       DEFAULT 0, "
							+ "  unpacked                      INTEGER       DEFAULT 0, "
							+ "  stitched                      INTEGER       DEFAULT 0)");

			log("DEBUG: - Setting database version to: "
					+ LATEST_DATABASE_VERSION);
			tx.executeSql("INSERT INTO databaseVersion (version) VALUES (?)",
					[ LATEST_DATABASE_VERSION ]);
			databaseVersion = LATEST_DATABASE_VERSION;

			action = "Created database";

			log("Database created");

			// See if we need to upgrade the database
		} else if (databaseVersion < LATEST_DATABASE_VERSION) {
			// Need to upgrade database...
			message = "Original version: " + databaseVersion;

			// Template method
			// Runs the supplied script function with added logging, and updating the versions
			function runUpgradeScript(priorVersion, newVersion, script) {
				if (databaseVersion !== priorVersion) {
					return;
				}
				log("INFO: Upgrading database to version {}", version);
				script();
				databaseVersion = version;
				tx.executeSql("UPDATE databaseVersion SET version = ?",
						[ version ]);
				log("INFO: Database at version {}", version);
			}

			log("INFO: Upgrading database");
			runUpgradeScript(1, 2, function() {
				// V1 to V2 Upgrade script goes here
				// tx.executeSQL(...);
			});
			runUpgradeScript(2, 3, function() {
				// V2 to V3 Upgrade script goes here
				// tx.executeSQL(...);
			});
			// .. until we get to LATEST_DATABASE_VERSION

			if (databaseVersion < LATEST_DATABASE_VERSION) {
				// Looks like a reinstall is in order..
				action = "Schema update failed";
			} else {
				action = "Updated database";
			}
		} else {
			log("DEBUG: Database up to date no changes required");
		}

		// Database has been created or upgraded at this point
		log("DEBUG: Init data schema complete");

		// Force all SQL to be executed before we return
		tx.executeSql("SELECT version from databaseVersion", [], function(tx,
				rs) {
			databaseVersion = (rs.rows.length == 0) ? 0
					: rs.rows.item(0).version;
			log("DEBUG: Init data schema complete, version is: V"
					+ databaseVersion);
			completionCallback();
		});

	}

	// Check the database version, then execute the function that updates the DB schem if required
	APP.database.transaction(function(tx) {

		tx.executeSql(
				"CREATE TABLE IF NOT EXISTS databaseVersion (version INTEGER)",
				[], function() {
					tx.executeSql("SELECT version from databaseVersion", [],
					// success
					function(tx, rs) {
						databaseVersion = (rs.rows.length == 0) ? 0 : rs.rows
								.item(0).version;
						manageSchemaVersioning(tx);
					});
				});

	}, true); // debug enabled

	return {
		action : action,
		version : databaseVersion,
		message : message
	};

}