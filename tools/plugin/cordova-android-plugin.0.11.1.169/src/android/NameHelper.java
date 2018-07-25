package com.linde.scapp;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.linde.scapp.packet.MachineIDAndNicknamePacket;
import com.linde.scapp.packet.Packet;
import com.linde.scapp.packet.ReadMachineIDAndNicknamePacket;
import com.linde.scapp.packet.ResponsePacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public abstract class NameHelper
{
    private final String TAG = this.getClass().getName();

    private Stack mStack;

    private boolean       mWaitingForReadResponse = false;
    private String        mName                   = null;
    private final Object  mReadResponseLock       = new Object();

    private boolean      mWaitingForWriteResponse = false;
    private int          mWriteResponse           = -1;
    private final Object mWriteResponseLock       = new Object();

    private boolean      mWaitingForDeleteResponse = false;
    private int          mDeleteResponse           = -1;
    private final Object mDeleteResponseLock       = new Object();

    public NameHelper(@NonNull Stack stack)
    {
        mStack = stack;
    }

    public void onDestroy()
    {
        mStack = null;
    }

    @NonNull
    public PluginResult readName()
    {
        mWaitingForReadResponse = true;
        mName = null;
        mStack.send(new ReadMachineIDAndNicknamePacket());
        synchronized (mReadResponseLock)
        {
            while (mWaitingForReadResponse)
            {
                try
                {
                    mReadResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to read " + getResultName());
                }
            }
        }
        return SuccessResponse.create(getReadSuccessResponseWithName(mName));
    }

    @NonNull
    public PluginResult writeName(@Nullable JSONArray data)
    {
        String name = null;
        if (data != null && data.length() == 1)
        {
            try
            {
                Object object = data.get(0);
                if (object instanceof String)
                {
                    name = (String) object;
                }
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        // We allow name to be an empty string
        if (name == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to write " + getResultName() + " - expected one string parameter");
        }

        mWaitingForWriteResponse = true;
        mWriteResponse = -1;
        mStack.send(getWritePacket(name));
        synchronized (mWriteResponseLock)
        {
            while (mWaitingForWriteResponse)
            {
                try
                {
                    mWriteResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to write " + getResultName());
                }
            }
        }

        if (mWriteResponse == ResponsePacket.ERROR_OK)
        {
            return readName();
        }
        if (mWriteResponse == ResponsePacket.ERROR_CANNOT_EXECUTE_WHILST_WELDING)
        {
            return ErrorResponse.create(ErrorResponse.Code.WELDING_IN_PROGRESS,
                    "Failed to write " + getResultName() + " - welding in progress");
        }
        return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                "Failed to write " + getResultName());
    }

    @NonNull
    public PluginResult deleteName()
    {
        mWaitingForDeleteResponse = true;
        mDeleteResponse = -1;
        mStack.send(getDeletePacket());
        synchronized (mDeleteResponseLock)
        {
            while (mWaitingForDeleteResponse)
            {
                try
                {
                    mDeleteResponseLock.wait();
                }
                catch (InterruptedException e)
                {
                    Log.e(TAG, e.getMessage());
                    return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                            "Failed to delete " + getResultName());
                }
            }
        }

        if (mDeleteResponse == ResponsePacket.ERROR_OK)
        {
            return readName();
        }
        if (mDeleteResponse == ResponsePacket.ERROR_CANNOT_EXECUTE_WHILST_WELDING)
        {
            return ErrorResponse.create(ErrorResponse.Code.WELDING_IN_PROGRESS,
                    "Failed to delete " + getResultName() + " - welding in progress");
        }
        return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                "Failed to delete " + getResultName());
    }

    public void processMachineIDAndNicknamePacket(@NonNull MachineIDAndNicknamePacket packet)
    {
        if (mWaitingForReadResponse)
        {
            synchronized (mReadResponseLock)
            {
                mName = getNameFromPacket(packet);
                mWaitingForReadResponse = false;
                mReadResponseLock.notify();
            }
        }
    }

    public void processWriteResponse(@NonNull ResponsePacket packet)
    {
        if (mWaitingForWriteResponse)
        {
            synchronized (mWriteResponseLock)
            {
                mWriteResponse = packet.errorCode();
                mWaitingForWriteResponse = false;
                mWriteResponseLock.notify();
            }
        }
    }

    public void processDeleteResponse(@NonNull ResponsePacket packet)
    {
        if (mWaitingForDeleteResponse)
        {
            synchronized (mDeleteResponseLock)
            {
                mDeleteResponse = packet.errorCode();
                mWaitingForDeleteResponse = false;
                mDeleteResponseLock.notify();
            }
        }
    }

    protected abstract SuccessResponse getReadSuccessResponseWithName(@NonNull String name);

    @NonNull
    protected abstract Packet getWritePacket(@NonNull String name);

    @NonNull
    protected abstract Packet getDeletePacket();

    @NonNull
    protected abstract String getResultName();

    @NonNull
    protected abstract String getNameFromPacket(@NonNull MachineIDAndNicknamePacket packet);
}
