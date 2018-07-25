package com.linde.scapp;

import android.support.annotation.NonNull;
import android.util.Log;

import com.linde.scapp.packet.IdentifyPacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.PluginResult;

public class IdentifyHelper
{
    private static final String TAG = IdentifyHelper.class.getName();

    private Stack mStack;

    private boolean      mWaitingForIdentifyResponse = false;
    private final Object mIdentifyResponseLock       = new Object();

    public IdentifyHelper(@NonNull Stack stack)
    {
        mStack = stack;
    }

    public void onDestroy()
    {
        mStack = null;
    }

    @NonNull
    public PluginResult identify()
    {
        mWaitingForIdentifyResponse = true;
        mStack.send(new IdentifyPacket());
        synchronized (mIdentifyResponseLock)
        {
            while (mWaitingForIdentifyResponse)
            {
                try
                {
                    mIdentifyResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to identify");
                }
            }
        }
        return SuccessResponse.create();
    }

    public void processIdentifyPacketResponse()
    {
        if (mWaitingForIdentifyResponse)
        {
            synchronized (mIdentifyResponseLock)
            {
                mWaitingForIdentifyResponse = false;
                mIdentifyResponseLock.notify();
            }
        }
    }
}
