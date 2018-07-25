package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

public class WarningResponse extends SuccessResponse
{
    @Expose
    private final Warning warning;

    public WarningResponse(@NonNull Warning warning)
    {
        super();
        this.warning = warning;
    }
}
