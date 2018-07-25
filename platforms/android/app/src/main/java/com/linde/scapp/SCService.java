package com.linde.scapp;

import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;

public class SCService extends Service
{
    private DiscoveryHelper mDiscoveryHelper;
    private ConnectionHelper mConnectionHelper;

    // onStartCommand will only execute if the service is explicitly started
    // http://stackoverflow.com/a/10585077
//	@Override
//	public int onStartCommand(Intent intent, int flags, int startId)
//	{
//	    super.onStartCommand(intent, flags, startId);
//	    return START_STICKY;
//	}

    private final IBinder mBinder = new LocalBinder();

    public class LocalBinder extends Binder
    {
        @NonNull
        public SCService getService()
        {
            return SCService.this;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent)
    {
        return mBinder;
    }

    @Override
    public void onCreate()
    {
        BluetoothManager manager = (BluetoothManager)getSystemService(Context.BLUETOOTH_SERVICE);
        if (manager == null)
        {
            throw new IllegalStateException();
        }
        BluetoothAdapter bluetoothAdapter = manager.getAdapter();
        mDiscoveryHelper = new DiscoveryHelper(this, bluetoothAdapter);
        mConnectionHelper = new ConnectionHelper(this, bluetoothAdapter);
    }

    @Override
    public void onDestroy()
    {
        mDiscoveryHelper.onDestroy();
        mConnectionHelper.onDestroy();
    }

    @NonNull
    public PluginResult getBondedDevices()
    {
        return mDiscoveryHelper.getBondedDevices();
    }

    @NonNull
    public PluginResult startDiscovery(@NonNull CallbackContext callback)
    {
        return mDiscoveryHelper.startDiscovery(callback);
    }

    @NonNull
    public PluginResult stopDiscovery()
    {
        return mDiscoveryHelper.stopDiscovery();
    }

    @NonNull
    public PluginResult isDiscovering()
    {
        return mDiscoveryHelper.isDiscovering();
    }

    @NonNull
    public PluginResult connect(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        return mConnectionHelper.connect(data, callback);
    }

    @NonNull
    public PluginResult disconnect()
    {
        return mConnectionHelper.disconnect();
    }

    @NonNull
    public PluginResult getConnectionStatus()
    {
        return mConnectionHelper.getConnectionStatus();
    }

    @NonNull
    public PluginResult identify()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to identify - not connected to device");
        }
        return stack.identify();
    }

    @NonNull
    public PluginResult readSCID()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to read SCID - not connected to device");
        }
        return stack.readSCID();
    }

    @NonNull
    public PluginResult readMachineID()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to read machineID");
        }
        return stack.readMachineID();
    }

    @NonNull
    public PluginResult writeMachineID(@Nullable JSONArray data)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to write machine ID - not connected to device");
        }
        return stack.writeMachineID(data);
    }

    @NonNull
    public PluginResult deleteMachineID()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to delete machine ID - not connected to device");
        }
        return stack.deleteMachineID();
    }

    @NonNull
    public PluginResult readNickname()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to read nickname - not connected to device");
        }
        return stack.readNickname();
    }

    @NonNull
    public PluginResult writeNickname(@Nullable JSONArray data)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to write nickname - not connected to device");
        }
        return stack.writeNickname(data);
    }

    @NonNull
    public PluginResult deleteNickname()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to delete nickname - not connected to device");
        }
        return stack.deleteNickname();
    }

    @NonNull
    public PluginResult readUniqueID()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to read unique ID - not connected to device");
        }
        return stack.readUniqueID();
    }

    @NonNull
    public PluginResult registerForBatteryNotifications(@NonNull CallbackContext callback)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to register for battery notifications - not connected to device");
        }
        return stack.registerForBatteryNotifications(callback);
    }

    @NonNull
    public PluginResult deregisterFromBatteryNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to deregister from battery notifications - not connected to device");
        }
        return stack.deregisterFromBatteryNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForBatteryNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return stack.isRegisteredForBatteryNotifications();
    }

    @NonNull
    public PluginResult registerForStatusNotifications(@NonNull CallbackContext callback)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to register for status notifications - not connected to device");
        }
        return stack.registerForStatusNotifications(callback);
    }

    @NonNull
    public PluginResult deregisterFromStatusNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to deregister from status notifications - not connected to device");
        }
        return stack.deregisterFromStatusNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForStatusNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return stack.isRegisteredForStatusNotifications();
    }

    @NonNull
    public PluginResult registerForWeldingNotifications(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to register for welding notifications - not connected to device");
        }
        return stack.registerForWeldingNotifications(data, callback);
    }

    @NonNull
    public PluginResult deregisterFromWeldingNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to deregister from welding notifications - not connected to device");
        }
        return stack.deregisterFromWeldingNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForWeldingNotifications()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return SuccessResponse.create(new ResultResponse(false));
        }
        return stack.isRegisteredForWeldingNotifications();
    }

    @NonNull
    public PluginResult getMissedDatasets(@Nullable JSONArray data)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to get missed datasets - not connected to device");
        }
        return stack.getMissedDatasets(data);
    }

    @NonNull
    public PluginResult getMissedDataset(@Nullable JSONArray data)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to get missed dataset - not connected to device");
        }
        return stack.getMissedDataset(data);
    }

    @NonNull
    public PluginResult getUnassociatedDatasets()
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to get unassociated datasets - not connected to device");
        }
        return stack.getUnassociatedDatasets();
    }

    @NonNull
    public PluginResult getUnassociatedDataset(@Nullable JSONArray data)
    {
        Stack stack = mConnectionHelper.getStack();
        if (stack == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.NOT_CONNECTED_TO_DEVICE,
                    "Failed to get unassociated dataset - not connected to device");
        }
        return stack.getUnassociatedDataset(data);
    }
}
