package com.linde.scapp;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.linde.scapp.response.ConnectionResponse;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.GasMixtureResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;

import org.apache.cordova.CordovaPlugin;

public class SCAppPlugin extends CordovaPlugin
{
    private static final String ACTION_START_PLUGIN     = "startPlugin";
    private static final String ACTION_STOP_PLUGIN      = "stopPlugin";
    private static final String ACTION_IS_PLUGIN_ACTIVE = "isPluginActive";

    private static final String ACTION_GET_BONDED_DEVICES = "getBondedDevices";

    private static final String ACTION_START_DISCOVERY = "startDiscovery";
    private static final String ACTION_STOP_DISCOVERY = "stopDiscovery";
    private static final String ACTION_IS_DISCOVERING = "isDiscovering";

    private static final String ACTION_CONNECT = "connect";
    private static final String ACTION_DISCONNECT = "disconnect";
    private static final String ACTION_GET_CONNECTION_STATUS = "getConnectionStatus";

    private static final String ACTION_IDENTIFY = "identify";

    private static final String ACTION_READ_SCID = "readSCID";

    private static final String ACTION_READ_MACHINE_ID = "readMachineID";
    private static final String ACTION_WRITE_MACHINE_ID = "writeMachineID";
    private static final String ACTION_DELETE_MACHINE_ID = "deleteMachineID";

    private static final String ACTION_READ_NICKNAME = "readNickname";
    private static final String ACTION_WRITE_NICKNAME = "writeNickname";
    private static final String ACTION_DELETE_NICKNAME = "deleteNickname";

    private static final String ACTION_READ_UNIQUE_ID = "readUniqueID";

    private static final String ACTION_REGISTER_FOR_BATTERY_NOTIFICATIONS      = "registerForBatteryNotifications";
    private static final String ACTION_DEREGISTER_FROM_BATTERY_NOTIFICATIONS   = "deregisterFromBatteryNotifications";
    private static final String ACTION_IS_REGISTERED_FOR_BATTERY_NOTIFICATIONS = "isRegisteredForBatteryNotifications";

    private static final String ACTION_REGISTER_FOR_STATUS_NOTIFICATIONS      = "registerForStatusNotifications";
    private static final String ACTION_DEREGISTER_FROM_STATUS_NOTIFICATIONS   = "deregisterFromStatusNotifications";
    private static final String ACTION_IS_REGISTERED_FOR_STATUS_NOTIFICATIONS = "isRegisteredForStatusNotifications";

    private static final String ACTION_REGISTER_FOR_WELDING_NOTIFICATIONS      = "registerForWeldingNotifications";
    private static final String ACTION_DEREGISTER_FROM_WELDING_NOTIFICATIONS   = "deregisterFromWeldingNotifications";
    private static final String ACTION_IS_REGISTERED_FOR_WELDING_NOTIFICATIONS = "isRegisteredForWeldingNotifications";

    private static final String ACTION_GET_MISSED_DATASETS = "getMissedDatasets";
    private static final String ACTION_GET_MISSED_DATASET = "getMissedDataset";
    private static final String ACTION_GET_UNASSOCIATED_DATASETS = "getUnassociatedDatasets";
    private static final String ACTION_GET_UNASSOCIATED_DATASET = "getUnassociatedDataset";

    private static final String ACTION_GET_DEFAULT_GAS_MIXTURE = "getDefaultGasMixture";
    private static final String ACTION_SET_DEFAULT_GAS_MIXTURE = "setDefaultGasMixture";

    private static final String ACTION_GET_ALLOWED_GASES = "getAllowedGases";

    private ServiceHelper mServiceHelper;

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView)
    {
        super.initialize(cordova, webView);
        Context context = cordova.getActivity().getApplicationContext();
        GasMixture.loadGasLookupTables(context);
        mServiceHelper = new ServiceHelper(context);
    }

    @Override
	public boolean execute(final String action, final JSONArray data, final CallbackContext callback)
	{
        if (!isActionValid(action) || (callback == null))
        {
            return false;
        }

        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                PluginResult result = null;
                if (ACTION_START_PLUGIN.equals(action))
                {
                    result = startPlugin();
                }
                else if (ACTION_STOP_PLUGIN.equals(action))
                {
                    result = stopPlugin();
                }
                else if (ACTION_IS_PLUGIN_ACTIVE.equals(action))
                {
                    result = isPluginActive();
                }
                if (ACTION_GET_BONDED_DEVICES.equals(action))
                {
                    result = getBondedDevices();
                }
                else if (ACTION_START_DISCOVERY.equals(action))
                {
                    result = startDiscovery(callback);
                }
                else if (ACTION_STOP_DISCOVERY.equals(action))
                {
                    result = stopDiscovery();
                }
                else if (ACTION_IS_DISCOVERING.equals(action))
                {
                    result = isDiscovering();
                }
                else if (ACTION_CONNECT.equals(action))
                {
                    result = connect(data, callback);
                }
                else if (ACTION_DISCONNECT.equals(action))
                {
                    result = disconnect();
                }
                else if (ACTION_GET_CONNECTION_STATUS.equals(action))
                {
                    result = getConnectionStatus();
                }
                else if (ACTION_IDENTIFY.equals(action))
                {
                    result = identify();
                }
                else if (ACTION_READ_SCID.equals(action))
                {
                    result = readSCID();
                }
                else if (ACTION_READ_MACHINE_ID.equals(action))
                {
                    result = readMachineID();
                }
                else if (ACTION_WRITE_MACHINE_ID.equals(action))
                {
                    result = writeMachineID(data);
                }
                else if (ACTION_DELETE_MACHINE_ID.equals(action))
                {
                    result = deleteMachineID();
                }
                else if (ACTION_READ_NICKNAME.equals(action))
                {
                    result = readNickname();
                }
                else if (ACTION_WRITE_NICKNAME.equals(action))
                {
                    result = writeNickname(data);
                }
                else if (ACTION_DELETE_NICKNAME.equals(action))
                {
                    result = deleteNickname();
                }
                else if (ACTION_READ_UNIQUE_ID.equals(action))
                {
                    result = readUniqueID();
                }
                else if (ACTION_REGISTER_FOR_BATTERY_NOTIFICATIONS.equals(action))
                {
                    result = registerForBatteryNotifications(callback);
                }
                else if (ACTION_DEREGISTER_FROM_BATTERY_NOTIFICATIONS.equals(action))
                {
                    result = deregisterFromBatteryNotifications();
                }
                else if (ACTION_IS_REGISTERED_FOR_BATTERY_NOTIFICATIONS.equals(action))
                {
                    result = isRegisteredForBatteryNotifications();
                }
                else if (ACTION_REGISTER_FOR_STATUS_NOTIFICATIONS.equals(action))
                {
                    result = registerForStatusNotifications(callback);
                }
                else if (ACTION_DEREGISTER_FROM_STATUS_NOTIFICATIONS.equals(action))
                {
                    result = deregisterFromStatusNotifications();
                }
                else if (ACTION_IS_REGISTERED_FOR_STATUS_NOTIFICATIONS.equals(action))
                {
                    result = isRegisteredForStatusNotifications();
                }
                else if (ACTION_REGISTER_FOR_WELDING_NOTIFICATIONS.equals(action))
                {
                    result = registerForWeldingNotifications(data, callback);
                }
                else if (ACTION_DEREGISTER_FROM_WELDING_NOTIFICATIONS.equals(action))
                {
                    result = deregisterFromWeldingNotifications();
                }
                else if (ACTION_IS_REGISTERED_FOR_WELDING_NOTIFICATIONS.equals(action))
                {
                    result = isRegisteredForWeldingNotifications();
                }
                else if (ACTION_GET_MISSED_DATASETS.equals(action))
                {
                    result = getMissedDatasets(data);
                }
                else if (ACTION_GET_MISSED_DATASET.equals(action))
                {
                    result = getMissedDataset(data);
                }
                else if (ACTION_GET_UNASSOCIATED_DATASETS.equals(action))
                {
                    result = getUnassociatedDatasets();
                }
                else if (ACTION_GET_UNASSOCIATED_DATASET.equals(action))
                {
                    result = getUnassociatedDataset(data);
                }
                else if (ACTION_GET_DEFAULT_GAS_MIXTURE.equals(action))
                {
                    result = getDefaultGasMixture();
                }
                else if (ACTION_SET_DEFAULT_GAS_MIXTURE.equals(action))
                {
                    result = setDefaultGasMixture(data);
                }
                else if (ACTION_GET_ALLOWED_GASES.equals(action))
                {
                    result = getAllowedGases();
                }
                if (result != null)
                {
                    callback.sendPluginResult(result);
                }
            }
        });
        return true;
	}

    private boolean isActionValid(@Nullable String action)
    {
        if (action == null)
        {
            return false;
        }
        if (ACTION_START_PLUGIN.equals(action))
        {
            return true;
        }
        if (ACTION_STOP_PLUGIN.equals(action))
        {
            return true;
        }
        if (ACTION_IS_PLUGIN_ACTIVE.equals(action))
        {
            return true;
        }
        if (ACTION_GET_BONDED_DEVICES.equals(action))
        {
            return true;
        }
        if (ACTION_START_DISCOVERY.equals(action))
        {
            return true;
        }
        if (ACTION_STOP_DISCOVERY.equals(action))
        {
            return true;
        }
        if (ACTION_IS_DISCOVERING.equals(action))
        {
            return true;
        }
        if (ACTION_CONNECT.equals(action))
        {
            return true;
        }
        if (ACTION_DISCONNECT.equals(action))
        {
            return true;
        }
        if (ACTION_GET_CONNECTION_STATUS.equals(action))
        {
            return true;
        }
        if (ACTION_IDENTIFY.equals(action))
        {
            return true;
        }
        if (ACTION_READ_SCID.equals(action))
        {
            return true;
        }
        if (ACTION_READ_MACHINE_ID.equals(action))
        {
            return true;
        }
        if (ACTION_WRITE_MACHINE_ID.equals(action))
        {
            return true;
        }
        if (ACTION_DELETE_MACHINE_ID.equals(action))
        {
            return true;
        }
        if (ACTION_READ_NICKNAME.equals(action))
        {
            return true;
        }
        if (ACTION_WRITE_NICKNAME.equals(action))
        {
            return true;
        }
        if (ACTION_DELETE_NICKNAME.equals(action))
        {
            return true;
        }
        if (ACTION_READ_UNIQUE_ID.equals(action))
        {
            return true;
        }
        if (ACTION_REGISTER_FOR_BATTERY_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_DEREGISTER_FROM_BATTERY_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_IS_REGISTERED_FOR_BATTERY_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_REGISTER_FOR_STATUS_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_DEREGISTER_FROM_STATUS_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_IS_REGISTERED_FOR_STATUS_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_REGISTER_FOR_WELDING_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_DEREGISTER_FROM_WELDING_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_IS_REGISTERED_FOR_WELDING_NOTIFICATIONS.equals(action))
        {
            return true;
        }
        if (ACTION_GET_MISSED_DATASETS.equals(action))
        {
            return true;
        }
        if (ACTION_GET_MISSED_DATASET.equals(action))
        {
            return true;
        }
        if (ACTION_GET_UNASSOCIATED_DATASETS.equals(action))
        {
            return true;
        }
        if (ACTION_GET_UNASSOCIATED_DATASET.equals(action))
        {
            return true;
        }
        if (ACTION_GET_DEFAULT_GAS_MIXTURE.equals(action))
        {
            return true;
        }
        if (ACTION_SET_DEFAULT_GAS_MIXTURE.equals(action))
        {
            return true;
        }
        if (ACTION_GET_ALLOWED_GASES.equals(action))
        {
            return true;
        }
        return false;
    }

    @NonNull
    private PluginResult startPlugin()
    {
        return mServiceHelper.startPlugin();
    }

    @NonNull
    private PluginResult stopPlugin()
    {
        return mServiceHelper.stopPlugin();
    }

    @NonNull
    private PluginResult isPluginActive()
    {
        SCService service = mServiceHelper.getService();
        boolean pluginActive = (service != null);
        return SuccessResponse.create(new ResultResponse(pluginActive));
    }

    @NonNull
    private PluginResult getBondedDevices()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to get bonded devices - plugin is not running");
        }
        return service.getBondedDevices();
    }

    @NonNull
    private PluginResult startDiscovery(@NonNull CallbackContext callback)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to start discovery - plugin is not running");
        }
        return service.startDiscovery(callback);
    }

    @NonNull
    private PluginResult stopDiscovery()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to stop discovery - plugin is not running");
        }
        return service.stopDiscovery();
    }

    @NonNull
    private PluginResult isDiscovering()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return service.isDiscovering();
    }

    @NonNull
    private PluginResult connect(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to connect - plugin is not running");
        }
        return service.connect(data, callback);
    }

    @NonNull
    private PluginResult disconnect()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to disconnect - plugin is not running");
        }
        return service.disconnect();
    }

    @NonNull
    private PluginResult getConnectionStatus()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return SuccessResponse.create(new ConnectionResponse(ConnectionHelper.ConnectionState.DISCONNECTED));
        }
        return service.getConnectionStatus();
    }

    @NonNull
    private PluginResult identify()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to identify - plugin is not running");
        }
        return service.identify();
    }

    @NonNull
    private PluginResult readSCID()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to read SCID - plugin is not running");
        }
        return service.readSCID();
    }

    @NonNull
    private PluginResult readMachineID()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to read machineID - plugin is not running");
        }
        return service.readMachineID();
    }

    @NonNull
    private PluginResult writeMachineID(@Nullable JSONArray data)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to write machine ID - plugin is not running");
        }
        return service.writeMachineID(data);
    }

    @NonNull
    private PluginResult deleteMachineID()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to delete machine ID - plugin is not running");
        }
        return service.deleteMachineID();
    }

    @NonNull
    private PluginResult readNickname()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to read nickname - plugin is not running");
        }
        return service.readNickname();
    }

    @NonNull
    private PluginResult writeNickname(@Nullable JSONArray data)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to write nickname - plugin is not running");
        }
        return service.writeNickname(data);
    }

    @NonNull
    private PluginResult deleteNickname()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to delete nickname - plugin is not running");
        }
        return service.deleteNickname();
    }

    @NonNull
    private PluginResult readUniqueID()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to read unique ID - plugin is not running");
        }
        return service.readUniqueID();
    }

    @NonNull
    private PluginResult registerForBatteryNotifications(@NonNull CallbackContext callback)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to register for battery notifications - plugin is not running");
        }
        return service.registerForBatteryNotifications(callback);
    }

    @NonNull
    private PluginResult deregisterFromBatteryNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to deregister from battery notifications - plugin is not running");
        }
        return service.deregisterFromBatteryNotifications();
    }

    @NonNull
    private PluginResult isRegisteredForBatteryNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return service.isRegisteredForBatteryNotifications();
    }

    @NonNull
    private PluginResult registerForStatusNotifications(@NonNull CallbackContext callback)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to register for status notifications - plugin is not running");
        }
        return service.registerForStatusNotifications(callback);
    }

    @NonNull
    private PluginResult deregisterFromStatusNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to deregister from status notifications - plugin is not running");
        }
        return service.deregisterFromStatusNotifications();
    }

    @NonNull
    private PluginResult isRegisteredForStatusNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return service.isRegisteredForStatusNotifications();
    }

    @NonNull
    private PluginResult registerForWeldingNotifications(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to register for welding notifications - plugin is not running");
        }
        return service.registerForWeldingNotifications(data, callback);
    }

    @NonNull
    private PluginResult deregisterFromWeldingNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to deregister from welding notifications - plugin is not running");
        }
        return service.deregisterFromWeldingNotifications();
    }

    @NonNull
    private PluginResult isRegisteredForWeldingNotifications()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return service.isRegisteredForWeldingNotifications();
    }

    @NonNull
    private PluginResult getMissedDatasets(@Nullable JSONArray data)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to get missed datasets - plugin is not running");
        }
        return service.getMissedDatasets(data);
    }

    @NonNull
    private PluginResult getMissedDataset(@Nullable JSONArray data)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to get missed dataset - plugin is not running");
        }
        return service.getMissedDataset(data);
    }

    @NonNull
    private PluginResult getUnassociatedDatasets()
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to get unassociated datasets - plugin is not running");
        }
        return service.getUnassociatedDatasets();
    }

    @NonNull
    private PluginResult getUnassociatedDataset(@Nullable JSONArray data)
    {
        SCService service = mServiceHelper.getService();
        if (service == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PLUGIN_NOT_RUNNING,
                    "Failed to get unassociated dataset - plugin is not running");
        }
        return service.getUnassociatedDataset(data);
    }

    @NonNull
    private PluginResult getDefaultGasMixture()
    {
        GasMixture gasMixture = GasMixture.getDefaultGasMixture(cordova.getActivity());
        return GasMixtureResponse.createSuccess(gasMixture);
    }

    @NonNull
    private PluginResult setDefaultGasMixture(@Nullable JSONArray data)
    {
        return GasMixture.setDefaultGasMixture(cordova.getActivity(), data);
    }

    @NonNull
    private PluginResult getAllowedGases()
    {
        return GasMixture.getAllowedGases();
    }
}
