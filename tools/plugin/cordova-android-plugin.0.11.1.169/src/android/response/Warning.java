package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import org.apache.cordova.PluginResult;

public class Warning
{
    public enum Code
    {
        NO_GAS_MIXTURE_PROVIDED(-1, PluginResult.Status.INVALID_ACTION),
        UNRECOGNISED_GAS_NAME_PROVIDED(-2, PluginResult.Status.INVALID_ACTION),
        INVALID_GAS_PERCENTAGES_PROVIDED(-3, PluginResult.Status.INVALID_ACTION),
        WELD_INPUT_DATA_IGNORED(-4, PluginResult.Status.INVALID_ACTION),
        GAS_MIXTURE_DATA_IGNORED(-5, PluginResult.Status.INVALID_ACTION),
        OTHER_ERROR(-99, PluginResult.Status.ERROR);

        private int intValue;
        private PluginResult.Status status;

        private Code(int intValue, @NonNull PluginResult.Status status)
        {
            this.intValue = intValue;
            this.status = status;
        }

        @NonNull
        public PluginResult.Status getStatus()
        {
            return status;
        }
    }

    private final Code codeEnum;

    @Expose
    private final int code;

    @Expose
    private final String message;

    public Warning(@NonNull Code code, @NonNull String message)
    {
        codeEnum = code;
        this.code = code.intValue;
        this.message = message;
    }

    @NonNull
    public Code getCode()
    {
        return codeEnum;
    }
}
