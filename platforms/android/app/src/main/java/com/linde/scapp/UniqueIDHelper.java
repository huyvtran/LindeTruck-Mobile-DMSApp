package com.linde.scapp;

import android.support.annotation.NonNull;
import android.util.Log;

import com.linde.scapp.packet.ReadUniqueIDPacket;
import com.linde.scapp.packet.UniqueIDPacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.SuccessResponse;
import com.linde.scapp.response.UniqueIDResponse;

import org.apache.cordova.PluginResult;

public class UniqueIDHelper
{
    private static final String TAG = UniqueIDHelper.class.getName();

    private Stack mStack;

    private       boolean        mWaitingForReadUniqueIDResponse = false;
    private       UniqueIDPacket mUniqueIDPacket                 = null;
    private final Object         mReadUniqueIDResponseLock       = new Object();

    public UniqueIDHelper(@NonNull Stack stack)
    {
        mStack = stack;
    }

    public void onDestroy()
    {
        mStack = null;
    }

    @NonNull
    public PluginResult readUniqueID()
    {
        mWaitingForReadUniqueIDResponse = true;
        mUniqueIDPacket = null;
        mStack.send(new ReadUniqueIDPacket());
        synchronized (mReadUniqueIDResponseLock)
        {
            while (mWaitingForReadUniqueIDResponse)
            {
                try
                {
                    mReadUniqueIDResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to read unique ID");
                }
            }
        }
        return SuccessResponse.create(new UniqueIDResponse(mUniqueIDPacket));
    }

    public void processUniqueIDPacket(@NonNull UniqueIDPacket packet)
    {
        if (mWaitingForReadUniqueIDResponse)
        {
            synchronized (mReadUniqueIDResponseLock)
            {
                mUniqueIDPacket = packet;
                mWaitingForReadUniqueIDResponse = false;
                mReadUniqueIDResponseLock.notify();
            }
        }
    }
}
