package com.linde.scapp;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.linde.scapp.response.ConnectionResponse;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

public class ConnectionHelper
{
    private static final UUID UUID_SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private final Context mContext;
    private final BluetoothAdapter mBT;
    private Stack mStack;

    private CallbackContext mCallback;

    private ConnectingThread mConnectingThread;
    private ConnectionState mConnectionState;
    private String mBondingAddress;
    private BluetoothDevice mConnectedDevice;

    private final BroadcastReceiver mReceiver = new BroadcastReceiver()
    {
        public void onReceive(Context context, Intent intent)
        {
            String action = intent.getAction();
            if (BluetoothDevice.ACTION_BOND_STATE_CHANGED.equals(action))
            {
                if (mConnectionState != ConnectionState.BONDING)
                {
                    // Ignore
                    return;
                }

                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                String address = device.getAddress();
                if (!address.equals(mBondingAddress))
                {
                    // Ignore
                    return;
                }

                int state = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
                int prevState = intent.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, BluetoothDevice.ERROR);
                if (state == BluetoothDevice.BOND_BONDED && prevState == BluetoothDevice.BOND_BONDING)
                {
                    connectBonded(device);
                }
                else if (state == BluetoothDevice.BOND_NONE)
                {
                    setState(ConnectionState.DISCONNECTED);
                }
            }
            else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action))
            {
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (mConnectedDevice != null && device.equals(mConnectedDevice))
                {
                    setState(ConnectionState.DISCONNECTED);
                }
            }
            else if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action))
            {
                int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1);
                if (state == BluetoothAdapter.STATE_OFF)
                {
                    setState(ConnectionState.DISCONNECTED);
                }
            }
        }
    };

    public enum ConnectionState
    {
        DISCONNECTED,
        DISCOVERY,
        BONDING,
        CONNECTING,
        CONNECTED
    }

    public ConnectionHelper(@NonNull Context context, @NonNull BluetoothAdapter bluetoothAdapter)
    {
        mContext = context;
        mBT = bluetoothAdapter;
        mConnectionState = ConnectionState.DISCONNECTED;
        IntentFilter filter = new IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
        filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
        filter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
        context.registerReceiver(mReceiver, filter);
    }

    public void onDestroy()
    {
        mContext.unregisterReceiver(mReceiver);
        disconnect();
    }

    @NonNull
    public PluginResult connect(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        if (mConnectionState != ConnectionState.DISCONNECTED)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to connect - already connecting/connected");
        }

        if (mBT.getState() != BluetoothAdapter.STATE_ON)
        {
            return ErrorResponse.create(ErrorResponse.Code.BLUETOOTH_SWITCHED_OFF,
                    "Failed to start bonding to device - bluetooth switched off");
        }

        String address = null;
        if (data != null && data.length() == 1)
        {
            try
            {
                Object object = data.get(0);
                if (object instanceof String)
                {
                    address = (String) object;
                }
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        if (address == null || address.length() == 0)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to connect - expected one string parameter");
        }

        Set<BluetoothDevice> bonded = mBT.getBondedDevices();
        BluetoothDevice device = mBT.getRemoteDevice(address);
        if (bonded != null && bonded.contains(device))
        {
            // Note that we set mCallback *after* calling connectBonded (which call setState) so
            // that the result is not sent twice
            connectBonded(device);
            mCallback = callback;
            PluginResult result = SuccessResponse.create(new ConnectionResponse(ConnectionState.CONNECTING));
            result.setKeepCallback(true);
            return result;
        }

        mBondingAddress = address;
        if (device.createBond())
        {
            // Note that we set mCallback *after* calling setState so that the result is not sent twice
            setState(ConnectionState.BONDING);
            mCallback = callback;
            PluginResult result = SuccessResponse.create(new ConnectionResponse(ConnectionState.BONDING));
            result.setKeepCallback(true);
            return result;
        }

        return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                "Failed to start bonding to device");
    }

    @NonNull
    public PluginResult disconnect()
    {
        if (mConnectionState == ConnectionState.DISCONNECTED)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to disconnected - already disconnected");
        }

        // Note that we remove mCallback *before* calling setState so that the result is not sent twice
        mCallback = null;
        setState(ConnectionState.DISCONNECTED);
        return SuccessResponse.create();
    }

    public void stackRequestsDisconnect(@NonNull PluginResult result)
    {
        // Note that we first remove the callback before calling setState, then manually send
        // the disconnectResult and then send result
        // The reason for doing this can be explained by considering what would happen if we didn't
        // If we were simply to just setState first, then mCallback will be null afterwards
            /*
             * setState(ConnectionState.DISCONNECTED); // disconnectResult sent to app
             * mCallback.sendPluginResult(result); // NPE because mCallback was nulled
             */
        // If we were to keep a copy of mCallback before calling setState, we would find that,
        // although the disconnectResult would send, because setKeepCallback(true) was not
        // executed on it then result will not be received by the app
            /*
             * CallbackContext callback = mCallback;
             * setState(ConnectionState.DISCONNECTED); // disconnectResult sent to app
             * callback.sendPluginResult(result); // result not received by app
             */
        CallbackContext callback = mCallback;
        mCallback = null;
        if (mConnectionState != ConnectionState.DISCONNECTED)
        {
            setState(ConnectionState.DISCONNECTED);
        }
        if (callback != null)
        {
            PluginResult disconnectResult = SuccessResponse.create(new ConnectionResponse(
                    ConnectionState.DISCONNECTED));
            disconnectResult.setKeepCallback(true);
            callback.sendPluginResult(disconnectResult);
            callback.sendPluginResult(result);
        }
    }

    @NonNull
    public PluginResult getConnectionStatus()
    {
        return SuccessResponse.create(new ConnectionResponse(mConnectionState));
    }

    @Nullable
    public Stack getStack()
    {
        if (mConnectionState == ConnectionState.CONNECTED)
        {
            return mStack;
        }
        return null;
    }

    private synchronized void connectBonded(BluetoothDevice device)
    {
        mConnectingThread = new ConnectingThread(device);
        mConnectingThread.start();
        setState(ConnectionState.CONNECTING);
    }

    private void setState(ConnectionState connectionState)
    {
        mConnectionState = connectionState;

        if (connectionState == ConnectionState.DISCONNECTED)
        {
            resetConnectingThread();
            if (mStack != null)
            {
                mStack.onDestroy();
                mStack = null;
            }
            mConnectedDevice = null;
        }

        if (mCallback != null)
        {
            CallbackContext callback = mCallback;
            PluginResult result = SuccessResponse.create(new ConnectionResponse(connectionState));
            if (connectionState == ConnectionState.DISCONNECTED)
            {
                mCallback = null;
            }
            else
            {
                result.setKeepCallback(true);
            }
            callback.sendPluginResult(result);
        }
    }

    private synchronized void resetConnectingThread()
    {
        if (mConnectingThread != null)
        {
            mConnectingThread.cancel();
            mConnectingThread = null;
        }
    }

    private class ConnectingThread extends Thread
    {
        private final String TAG = ConnectingThread.class.getSimpleName();

        private final BluetoothSocket mSocket;
        private final BluetoothDevice mDevice;

        public ConnectingThread(@NonNull BluetoothDevice device)
        {
            mDevice = device;
            BluetoothSocket socket = null;
            try
            {
                socket = device.createRfcommSocketToServiceRecord(UUID_SPP);
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
            mSocket = socket;
        }

        public void run()
        {
            boolean success = false;
            try
            {
                // This is a blocking call
                if (mSocket != null)
                {
                    mSocket.connect();
                    success = true;
                }
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }

            if (!success)
            {
                resetConnectingThread();
                setState(ConnectionState.DISCONNECTED);
                return;
            }

            synchronized (this)
            {
                mConnectingThread = null;
            }
            mConnectedDevice = mDevice;
            mStack = new Stack(mContext, ConnectionHelper.this, mSocket);
            setState(ConnectionState.CONNECTED);
        }

        public void cancel()
        {
            try
            {
                if (mSocket != null)
                {
                    mSocket.close();
                }
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
        }
    }
}
