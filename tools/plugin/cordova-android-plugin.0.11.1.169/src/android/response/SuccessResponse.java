package com.linde.scapp.response;

import android.support.annotation.NonNull;

import org.apache.cordova.PluginResult;

public class SuccessResponse extends Response
{
    @NonNull
    public static PluginResult create()
    {
        return create(new SuccessResponse());
    }

    @NonNull
    public static PluginResult create(@NonNull SuccessResponse response)
    {
        return Response.create(response, PluginResult.Status.OK);
    }

    protected SuccessResponse()
    {
        super(true);
    }
}
