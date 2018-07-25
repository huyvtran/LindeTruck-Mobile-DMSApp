package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

public class MachineIDResponse extends SuccessResponse
{
    @Expose
    private final String machineID;

    public MachineIDResponse(@NonNull String machineID)
    {
        super();
        this.machineID = machineID;
    }
}
