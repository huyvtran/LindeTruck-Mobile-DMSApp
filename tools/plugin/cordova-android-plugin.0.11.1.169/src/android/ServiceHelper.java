package com.linde.scapp;

import android.app.ActivityManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.StartStopResponse;
import com.linde.scapp.response.SuccessResponse;

import org.apache.cordova.PluginResult;

public class ServiceHelper
{
    private static final String TAG = ServiceHelper.class.getName();

    private final Context mContext;

    private Boolean mServiceConnected = null;
    private final Object mServiceConnectedLock = new Object();

    private SCService mService;

    public ServiceHelper(@NonNull Context context)
    {
        mContext = context;
    }

    @NonNull
    public PluginResult startPlugin()
    {
        if (getService() != null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to start service - service is already running");
        }

        if (bindToService())
        {
            return SuccessResponse.create();
        }

        return ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR,
                "Failed to start plugin");
    }

    @NonNull
    public PluginResult stopPlugin()
    {
        if (getService() == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to stop plugin - plugin is not running");
        }

        mContext.unbindService(mConnection);
        return SuccessResponse.create();
    }

    private boolean bindToService()
    {
        boolean result = false;
        Intent intent = new Intent(mContext, SCService.class);
        mServiceConnected = null;
        if (mContext.bindService(intent, mConnection, Context.BIND_AUTO_CREATE))
        {
            synchronized(mServiceConnectedLock)
            {
                while (mServiceConnected == null)
                {
                    try
                    {
                        mServiceConnectedLock.wait();
                    }
                    catch (InterruptedException e)
                    {
                        Log.e(TAG, e.getMessage());
                        return false;
                    }
                }
                result = this.mServiceConnected;
            }
        }
        return result;
    }

    private ServiceConnection mConnection = new ServiceConnection()
    {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service)
        {
            mService = ((SCService.LocalBinder) service).getService();
            synchronized(mServiceConnectedLock)
            {
                mServiceConnected = true;
                mServiceConnectedLock.notify();
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name)
        {
            mService = null;
            synchronized(mServiceConnectedLock)
            {
                mServiceConnected = false;
                mServiceConnectedLock.notify();
            }
        }
    };

    @Nullable
    public SCService getService()
    {
        if (isServiceRunning())
        {
            return mService;
        }
        return null;
    }

    private boolean isServiceRunning()
    {
        ActivityManager manager = (ActivityManager) mContext.getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE))
        {
            if (service.service.getClassName().equals(SCService.class.getName()))
            {
                return true;
            }
        }
        return false;
    }
}
