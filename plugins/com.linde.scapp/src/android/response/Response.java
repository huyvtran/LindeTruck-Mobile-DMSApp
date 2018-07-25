package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.Utils;

import org.apache.cordova.PluginResult;
import org.json.JSONException;
import org.json.JSONObject;

public class Response
{
    @Expose
    private final boolean success;

    @NonNull
    protected static PluginResult create(@NonNull Response response, @NonNull PluginResult.Status status)
    {
        String jsonString = Utils.sGsonExternal.toJson(response);
        try
        {
            JSONObject json = new JSONObject(jsonString);
            return new PluginResult(status, json);
        }
        catch (JSONException e)
        {
            return new PluginResult(status);
        }
    }

    protected Response(boolean success)
    {
        this.success = success;
    }
}
