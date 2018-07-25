package com.linde.scapp;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.annotation.NonNull;
import android.util.Log;

import com.linde.scapp.response.DeviceResponse;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.StartStopResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

public class DiscoveryHelper
{
    private static final String TAG = DiscoveryHelper.class.getName();

    private final Context mContext;
    private final BluetoothAdapter mBT;

    private CallbackContext mCallback;

    private boolean mWaitingForStart = false;
    private final Object mStartDiscoveryLock = new Object();

    private boolean mWaitingForStop = false;
    private final Object mStopDiscoveryLock = new Object();

    private final BroadcastReceiver mReceiver = new BroadcastReceiver()
    {
        public void onReceive(Context context, Intent intent)
        {
            String action = intent.getAction();
            if (BluetoothAdapter.ACTION_DISCOVERY_STARTED.equals(action))
            {
                // Discovery runs for ~20s before automatically stopping
                if (mWaitingForStart)
                {
                    synchronized (mStartDiscoveryLock)
                    {
                        mWaitingForStart = false;
                        mStartDiscoveryLock.notify();
                    }
                }
            }
            else if (BluetoothDevice.ACTION_FOUND.equals(action))
            {
                if (mCallback != null)
                {
                    BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                    int rssi = intent.getShortExtra(BluetoothDevice.EXTRA_RSSI, Short.MIN_VALUE);
                    PluginResult result = SuccessResponse.create(new DeviceResponse(device, rssi));
                    result.setKeepCallback(true);
                    mCallback.sendPluginResult(result);
                }
            }
            else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action))
            {
                if (mWaitingForStop)
                {
                    synchronized (mStopDiscoveryLock)
                    {
                        mWaitingForStop = false;
                        mStopDiscoveryLock.notify();
                    }
                }
                else
                {
                    if (mCallback != null)
                    {
                        // Discovery automatically stops after about 20s, not just when we call
                        // stopDiscovery()
                        // Discovery also stops when bluetooth is turned off
                        CallbackContext callback = mCallback;
                        mCallback = null;
                        PluginResult result = SuccessResponse.create(new StartStopResponse(false));
                        callback.sendPluginResult(result);
                    }
                }
            }
        }
    };

    public DiscoveryHelper(@NonNull Context context, @NonNull BluetoothAdapter bluetoothAdapter)
    {
        mContext = context;
        mBT = bluetoothAdapter;

        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_DISCOVERY_STARTED);
        filter.addAction(BluetoothDevice.ACTION_FOUND);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        context.registerReceiver(mReceiver, filter);
    }

    public void onDestroy()
    {
        mContext.unregisterReceiver(mReceiver);
        mCallback = null;
        mBT.cancelDiscovery();
    }

    @NonNull
    public PluginResult getBondedDevices()
    {
        if (mBT.getState() != BluetoothAdapter.STATE_ON)
        {
            // If bluetooth is not turned on then getBondedDevices() seems to return an empty set
            return ErrorResponse.create(ErrorResponse.Code.BLUETOOTH_SWITCHED_OFF,
                    "Failed to get bonded devices - bluetooth switched off");
        }
        return SuccessResponse.create(new DeviceResponse(mBT.getBondedDevices()));
    }

    @NonNull
    public PluginResult startDiscovery(@NonNull CallbackContext callback)
    {
        if (mCallback != null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to start discovery - already discovering");
        }

        if (mBT.getState() != BluetoothAdapter.STATE_ON)
        {
            return ErrorResponse.create(ErrorResponse.Code.BLUETOOTH_SWITCHED_OFF,
                    "Failed to start discovery - bluetooth switched off");
        }

        mWaitingForStart = true;
        if (!mBT.startDiscovery())
        {
            mWaitingForStart = false;
            return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                    "Failed to start discovery");
        }

        synchronized(mStartDiscoveryLock)
        {
            while (mWaitingForStart)
            {
                try
                {
                    mStartDiscoveryLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to start discovery");
                }
            }
        }

        mCallback = callback;
        PluginResult result = SuccessResponse.create(new StartStopResponse(true));
        result.setKeepCallback(true);
        return result;
    }

    @NonNull
    public PluginResult stopDiscovery()
    {
        if (mCallback == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to stop discovery - not discovering");
        }

        mWaitingForStop = true;
        if (!mBT.cancelDiscovery())
        {
            mWaitingForStop = false;
            return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                    "Failed to stop discovery");
        }

        synchronized(mStopDiscoveryLock)
        {
            while (mWaitingForStop)
            {
                try
                {
                    mStopDiscoveryLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to stop discovery");
                }
            }
        }

        mCallback = null;
        return SuccessResponse.create();
    }

    @NonNull
    public PluginResult isDiscovering()
    {
        boolean isDiscovering = (mCallback != null);
        return SuccessResponse.create(new ResultResponse(isDiscovering));
    }
}
