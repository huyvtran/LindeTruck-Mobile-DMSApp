package com.linde.scapp;

import android.support.annotation.NonNull;

import com.linde.scapp.packet.RequestStatusPacket;
import com.linde.scapp.packet.StatusPacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.StatusResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;

public class StatusHelper
{
    private Stack mStack;
    private CallbackContext mStatusCallback;

    public StatusHelper(@NonNull Stack stack)
    {
        mStack = stack;
    }

    public void onDestroy()
    {
        mStack = null;
        mStatusCallback = null;
    }

    @NonNull
    public PluginResult registerForStatusNotifications(@NonNull CallbackContext callback)
    {
        if (mStatusCallback != null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to register for status notifications - already registered");
        }

        mStatusCallback = callback;
        PluginResult result = SuccessResponse.create();
        result.setKeepCallback(true);
        // We request status from the SC
        // The app should first receive that it has successfully registered for status notifications
        // and then receive the current status
        // After that, the app will only receive status updates when the SC sends
        mStack.send(new RequestStatusPacket());
        return result;
    }

    @NonNull
    public PluginResult deregisterFromStatusNotifications()
    {
        if (mStatusCallback == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to deregister from status notifications - not currently registered");
        }

        mStatusCallback = null;
        return SuccessResponse.create();
    }

    @NonNull
    public PluginResult isRegisteredForStatusNotifications()
    {
        boolean isRegistered = (mStatusCallback != null);
        return SuccessResponse.create(new ResultResponse(isRegistered));
    }

    public void processStatusPacket(@NonNull StatusPacket packet)
    {
        if (mStatusCallback != null)
        {
            PluginResult result = SuccessResponse.create(new StatusResponse(packet));
            result.setKeepCallback(true);
            mStatusCallback.sendPluginResult(result);
        }
    }
}
