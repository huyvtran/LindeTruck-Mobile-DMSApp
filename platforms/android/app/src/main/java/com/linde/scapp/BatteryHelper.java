package com.linde.scapp;

import android.support.annotation.NonNull;

import com.linde.scapp.packet.LiveDataPacket;
import com.linde.scapp.packet.StatusPacket;
import com.linde.scapp.response.BatteryResponse;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

public class BatteryHelper
{
    private CallbackContext mBatteryCallback;

    public BatteryHelper()
    {
        // Stub
    }

    public void onDestroy()
    {
        mBatteryCallback = null;
    }

    @NonNull
    public PluginResult registerForBatteryNotifications(@NonNull CallbackContext callback)
    {
        if (mBatteryCallback != null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to register for battery notifications - already registered");
        }

        mBatteryCallback = callback;
        PluginResult result = SuccessResponse.create();
        result.setKeepCallback(true);
        return result;
    }

    @NonNull
    public PluginResult deregisterFromBatteryNotifications()
    {
        if (mBatteryCallback == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to deregister from battery notifications - not currently registered");
        }

        mBatteryCallback = null;
        return SuccessResponse.create();
    }

    @NonNull
    public PluginResult isRegisteredForBatteryNotifications()
    {
        boolean isRegistered = (mBatteryCallback != null);
        return SuccessResponse.create(new ResultResponse(isRegistered));
    }

    public void processLiveDataPacket(@NonNull LiveDataPacket packet)
    {
        if (mBatteryCallback != null)
        {
            PluginResult result = SuccessResponse.create(new BatteryResponse(packet));
            result.setKeepCallback(true);
            mBatteryCallback.sendPluginResult(result);
        }
    }

    public void processStatusPacket(@NonNull StatusPacket packet)
    {
        if (mBatteryCallback != null)
        {
            PluginResult result = SuccessResponse.create(new BatteryResponse(packet));
            result.setKeepCallback(true);
            mBatteryCallback.sendPluginResult(result);
        }
    }
}
