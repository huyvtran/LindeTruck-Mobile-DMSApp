cordova.define("com.linde.scapp.SCApp", function(require, exports, module) {
var exec = require("cordova/exec");
	
var SCApp = function () {

	/**
	  * Start the plugin
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.startPlugin = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'startPlugin',      
						[]);
	};

	/**
	  * Stop the plugin
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.stopPlugin = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'stopPlugin',      
						[]);
	};

	/**
	  * Query whether the plugin is active
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "result" : <result>} where <result> is a boolean
	  */
	this.isPluginActive = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'isPluginActive',      
						[]);
	};

	/**
	  * Get bluetooth devices that we have previously bonded with
	  * This will not filter the bluetooth devices and will report every device (SC or otherwise) that is known
	  * Filtering should take place on the client side e.g. device.name.startsWith("Smart")
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "devices" : <devices>} where the format of <devices> is defined in devices.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.getBondedDevices = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'getBondedDevices',      
						[]);
	};

	/**
	  * Start discovery of bluetooth devices
	  * This will not filter the visible bluetooth devices and will report every device (SC or otherwise) that is discovered
	  * Filtering should take place on the client side e.g. device.name.startsWith("Smart")
	  * Note that discovery will automatically stop after ~20s
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "started" : true} when discovery is successfully started
	  							data = {"success" : true, "device" : <device>} where the format of <device> is defined in device.schema.json
	  							data = {"success" : true, "stopped" : true} when discovery is automatically stopped
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.startDiscovery = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'startDiscovery',      
						[]);
	};

	/**
	  * Stop discovery of bluetooth devices
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.stopDiscovery = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'stopDiscovery',      
						[]);
	};

	/**
	  * Query whether we are discovering bluetooth devices
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "result" : <result>} where <result> is a boolean
	  */
	this.isDiscovering = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'isDiscovering',      
						[]);
	};

	/**
	  * Connect to a SC
	  * Upon connecting, the plugin will first get SCID data from the SC to determine the protocol version
	  * * If the protocol version is compatible with the plugin then the plugin will first read the gas calibration before requesting the status of the SC to determine if it is welding, or has any archived data
	  * * * If welding, the plugin will not do anything for now, but will sync time when it receives a stop packet
	  * * * If not welding, the plugin will first sync time with the SC and then request archived data if available
	  * * If the protocol version is not compatible with the plugin then the app will disconnect and report the error
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "bonding" : true} when bonding to the SC
	  							data = {"success" : true, "connecting" : true} when connecting to the SC
	  							data = {"success" : true, "connected" : true} when connected to the SC
	  							data = {"success" : true, "disconnected" : true} when disconnected from the SC
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param address 			The address of the SC to which we should connect
	  */
	this.connect = function(successCallback, failureCallback, address) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'connect',      
						[address]);
	};

	/**
	  * Disconnect from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.disconnect = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'disconnect',      
						[]);
	};

	/**
	  * Query the connection status
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "bonding" : true} if bonding to a SC
	  							data = {"success" : true, "connecting" : true} if connecting to a SC
	  							data = {"success" : true, "connected" : true} if connected to a SC
	  							data = {"success" : true, "disconnected" : true} if disconnected from a SC
	  */
	this.getConnectionStatus = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'getConnectionStatus',      
						[]);
	};

	/**
	  * Identify the connected SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.identify = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'identify',      
						[]);
	};

	/**
	  * Read SCID data from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "scid" : <scid>} where the format of <scid> is defined in scid.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.readSCID = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'readSCID',      
						[]);
	};

	/**
	  * Read the machine ID from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "machineID" : <machineID>} where <machineID> is a string
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.readMachineID = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'readMachineID',      
						[]);
	};

	/**
	  * Write the machine ID on the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "machineID" : <machineID>} where <machineID> is a string and denotes the new machineID
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param machineID 		The machine ID to write
	  */
	this.writeMachineID = function(successCallback, failureCallback, machineID) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'writeMachineID',      
						[machineID]);
	};

	/**
	  * Delete the machine ID on the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "machineID" : <machineID>} where <machineID> is a string and denotes the new machineID
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.deleteMachineID = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'deleteMachineID',      
						[]);
	};

	/**
	  * Read the nickname from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "nickname" : <nickname>} where <nickname> is a string
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.readNickname = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'readNickname',      
						[]);
	};

	/**
	  * Write the nickname on the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "nickname" : <nickname>} where <nickname> is a string and denotes the new nickname
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param nickname 		The nickname to write
	  */
	this.writeNickname = function(successCallback, failureCallback, nickname) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'writeNickname',      
						[nickname]);
	};

	/**
	  * Delete the nickname on the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "nickname" : <nickname>} where <nickname> is a string and denotes the new nickname
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.deleteNickname = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'deleteNickname',      
						[]);
	};

	/**
	  * Read the unique ID from the SC
	  *
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "uniqueID" : <uniqueID>} where <uniqueID> is a long
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.readUniqueID = function(successCallback, failureCallback) {
		return exec(	successCallback,
						failureCallback,
						'SCAppPlugin',
						'readUniqueID',
						[])
	};

	/**
	  * Register to receive battery notifications from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true} is an immediate callback that the app has successfully registered for battery notifications
	  							data = {"success" : true, "battery" : <battery>} when battery level values are received from live data or status packets where <battery> is an integer
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.registerForBatteryNotifications = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'registerForBatteryNotifications',      
						[]);
	};

	/**
	  * Deregister to stop receiving battery notifications from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.deregisterFromBatteryNotifications = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'deregisterFromBatteryNotifications',      
						[]);
	};

	/**
	  * Query whether we are registered to receive battery notifications
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "result" : <result>} where <result> is a boolean
	  */
	this.isRegisteredForBatteryNotifications = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'isRegisteredForBatteryNotifications',      
						[]);
	};

	/**
	  * Register to receive status notifications from the SC
	  * Upon successfully registering, the plugin will immediately request the status from the SC
	  * After this, the plugin will only report status changes as the SC reports them
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true} is an immediate callback that the app has successfully registered for status notifications
	  							data = {"success" : true, "status" : <status>} when status updates are received where the format of <status> is defined in status.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.registerForStatusNotifications = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'registerForStatusNotifications',      
						[]);
	};

	/**
	  * Deregister to stop receiving status notifications from the SC
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.deregisterFromStatusNotifications = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'deregisterFromStatusNotifications',      
						[]);
	};

	/**
	  * Query whether we are registered to receive status notifications
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "result" : <result>} where <result> is a boolean
	  */
	this.isRegisteredForStatusNotifications = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'isRegisteredForStatusNotifications',      
						[]);
	};

	/**
	  * Register to receive welding notifications from the SC
	  * See associatingDatasetswithWelds.txt
	  * Assuming registering is successful
	  * * If welding is currently in progress then a warning WILL be returned
	  * * * If the current dataset is already associated with a weld (which can occur if registering/deregistering/registering happens during the same dataset) then the weld input data will be ignored
	  * * * Otherwise, the current dataset will be associated with the weld BUT the gas mixture (if any) will be ignored as the default gas mixture is being used
	  * * If welding is not currently in progress then a warning MAY be returned if, for example, the specified gas mixture is invalid
	  * * Whether currently welding or not, subsequent datasets WILL then use the weld input data and gas mixture (or default gas mixture if invalid)
	  *
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "warning" : <warning>} is an immediate callback that the app has successfully registered for welding notifications where <warning> is optional with format defined in warning.schema.json. Note that this DOES NOT indicate that welding has started
	  							data = {"success" : true, "started" : true} when a start packet is received. Note that if welding is already in progress when registering then this callback will be executed immediately after the above
	  							data = {"success" : true, "progress" : <progress>} when a live data packet is received (after having received a start packet) where the format of <progress> is defined in progress.schema.json
	  							data = {"success" : true, "dataset" : <dataset>} when a stop packet is received (after having received a start packet) where the format of <dataset> is defined in dataset.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param step				The weld step that datasets will be associated with
	  							The format of step is defined in step.schema.json
	  */
	this.registerForWeldingNotifications = function(successCallback, failureCallback, step) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'registerForWeldingNotifications',      
						[step]);
	};

	/**
	  * Deregister to stop receiving welding notifications from the SC
	  * See associatingDatasetswithWelds.txt
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true}
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.deregisterFromWeldingNotifications = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'deregisterFromWeldingNotifications',      
						[]);
	};

	/**
	  * Query whether we are registered to receive welding notifications
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "result" : <result>} where <result> is a boolean
	  */
	this.isRegisteredForWeldingNotifications = function(successCallback) { 
		return exec(	successCallback,      
						null,      
						'SCAppPlugin',      
						'isRegisteredForWeldingNotifications',      
						[]);
	};

	/**
	  * Query for any missed datasets as a result of deregistering for notifications before the weld had finished
	  * See associatingDatasetswithWelds.txt
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "datasets" : <datasets>} where <datasets> is an array of start timestamps
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param Id 				The Id of the weld of interest
	  */
	this.getMissedDatasets = function(successCallback, failureCallback, Id) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'getMissedDatasets',      
						[Id]);
	};

	/**
	  * Download the dataset as identified from getMissedDatasets() with the specified Id and timestamp
	  * This will delete the dataset from plugin
	  * See associatingDatasetswithWelds.txt
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : "dataset" : <dataset>} where the format of <dataset> is defined in dataset.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param Id 				The Id of the weld of interest
	  * @param timestamp 		The timestamp of the dataset of interest
	  */
	this.getMissedDataset = function(successCallback, failureCallback, Id, timestamp) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'getMissedDataset',      
						[Id, timestamp]);
	};

	/**
	  * Query for any missed datasets which were not able to be associated with a weld
	  * See associatingDatasetswithWelds.txt
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "datasets" : <datasets>} where <datasets> is an array of start timestamps
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  */
	this.getUnassociatedDatasets = function(successCallback, failureCallback) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'getUnassociatedDatasets',      
						[]);
	};

	/**
	  * Download the dataset as identified from getUnassociatedDatasets() with the specified timestamp and assoicate with a weld
	  * This will delete the dataset from plugin
	  * See associatingDatasetswithWelds.txt
	  * Note that this, if successful, will always present the warning that the gas mixture (if any) is ignored
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "dataset" : <dataset>, "warning" : <warning>} where the format of <dataset> is defined in dataset.schema.json and the format of <warning> is defined in warning.schema.json
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "error" : <error>} where the format of <error> is defined in error.schema.json
	  * @param timestamp 		The timestamp of the dataset of interest
	  * @param step				The weld step that the dataset should be associated with
	  							The format of step is defined in step.schema.json
	  */
	this.getUnassociatedDataset = function(successCallback, failureCallback, timestamp, step) { 
		return exec(	successCallback,      
						failureCallback,      
						'SCAppPlugin',      
						'getUnassociatedDataset',      
						[timestamp, step]);
	};

	/**
	  * Get the default gas mixture
	  * If no default gas mixture has yet been supplied via setDefaultGasMixture then the default is 100% Argon
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "gasmixture" : <gasmixture>} where the format of <gasmixture> is defined in gasmixture.schema.json
	  */
	this.getDefaultGasMixture = function(successCallback) {
		return exec(	successCallback,
						null,
						'SCAppPlugin',
						'getDefaultGasMixture',
						[]);
	}

	/**
	  * Set the default gas mixture
	  * 
	  * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "gasmixture" : <gasmixture>} where the format of <gasmixture> is defined in gasmixture.schema.json and denotes the new default gas mixture
	  * @param failureCallback	The callback which will be executed if the method encounters an error
	  							data = {"success" : false, "gasmixture" : <gasmixture>, "warning" : <warning>} where the format of <gasmixture> is defined in gasmixture.schema.json and denotes the current (old) default gas mixture. <warning> is defined in warning.schema.json and may indicate, for example, that the specified gas mixture is invalid
	  * @param gasMixture 		The new default gas mixture with format as defined in gasmixture.schema.json
	  */
	this.setDefaultGasMixture = function(successCallback, failureCallback, gasMixture) {
		return exec(	successCallback,
						failureCallback,
						'SCAppPlugin',
						'setDefaultGasMixture',
						[gasMixture]);
	}

	/*
	 * Get the allowed gases for use in a gas mixture
	 *
	 * @param successCallback	The callback which will be executed if the method is successful
	  							data = {"success" : true, "gases" : <gases>} where <gases> is an array of gas name strings
	 */
	this.getAllowedGases = function(successCallback) {
	 	return exec(	successCallback,
						null,
						'SCAppPlugin',
						'getAllowedGases',
						[]);
	}
}; 

module.exports = new SCApp()

});
