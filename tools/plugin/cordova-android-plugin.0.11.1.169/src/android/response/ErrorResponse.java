package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import org.apache.cordova.PluginResult;

public class ErrorResponse extends Response
{
    public enum Code
    {
        PROCESS_ALREADY_STARTED(-1, PluginResult.Status.INVALID_ACTION),
        PROCESS_ALREADY_STOPPED(-2, PluginResult.Status.INVALID_ACTION),
        PLUGIN_NOT_RUNNING(-3, PluginResult.Status.INVALID_ACTION),
        BLUETOOTH_SWITCHED_OFF(-4, PluginResult.Status.INVALID_ACTION),
        NOT_CONNECTED_TO_DEVICE(-5, PluginResult.Status.INVALID_ACTION),
        UNEXPECTED_PARAMS(-6, PluginResult.Status.INVALID_ACTION),
        WELDING_IN_PROGRESS(-7, PluginResult.Status.ERROR),
        PROTOCOL_NOT_COMPATIBLE(-8, PluginResult.Status.ERROR),
        OTHER_ERROR(-99, PluginResult.Status.ERROR);

        private int intValue;
        private PluginResult.Status status;

        private Code(int intValue, PluginResult.Status status)
        {
            this.intValue = intValue;
            this.status = status;
        }
    }

    private class Error
    {
        @Expose
        private final int code;

        @Expose
        private final String message;

        public Error(int code, @NonNull String message)
        {
            this.code = code;
            this.message = message;
        }
    }

    @Expose
    private final Error error;

    @NonNull
    public static PluginResult create(@NonNull Code code, @NonNull String message)
    {
        ErrorResponse response = new ErrorResponse(code.intValue, message);
        PluginResult.Status status = code.status;
        return Response.create(response, status);
    }

    private ErrorResponse(int code, @NonNull String message)
    {
        super(false);
        error = new Error(code, message);
    }
}
