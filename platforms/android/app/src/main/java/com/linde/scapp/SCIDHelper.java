package com.linde.scapp;

import android.support.annotation.NonNull;
import android.util.Log;

import com.linde.scapp.packet.ReadSCIDPacket;
import com.linde.scapp.packet.SCIDPacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.SCIDResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.PluginResult;

public class SCIDHelper
{
    private static final String TAG = SCIDHelper.class.getName();

    private Stack mStack;

    private       boolean    mWaitingForReadSCIDResponse = false;
    private       SCIDPacket mSCIDPacket                 = null;
    private final Object     mReadSCIDResponseLock       = new Object();

    public SCIDHelper(@NonNull Stack stack)
    {
        mStack = stack;
    }

    public void onDestroy()
    {
        mStack = null;
    }

    @NonNull
    public PluginResult readSCID()
    {
        mWaitingForReadSCIDResponse = true;
        mSCIDPacket = null;
        mStack.send(new ReadSCIDPacket());
        synchronized (mReadSCIDResponseLock)
        {
            while (mWaitingForReadSCIDResponse)
            {
                try
                {
                    mReadSCIDResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to read SCID");
                }
            }
        }
        return SuccessResponse.create(new SCIDResponse(mSCIDPacket));
    }

    public void processSCIDPacket(@NonNull SCIDPacket packet)
    {
        if (mWaitingForReadSCIDResponse)
        {
            synchronized (mReadSCIDResponseLock)
            {
                mSCIDPacket = packet;
                mWaitingForReadSCIDResponse = false;
                mReadSCIDResponseLock.notify();
            }
        }
    }
}
