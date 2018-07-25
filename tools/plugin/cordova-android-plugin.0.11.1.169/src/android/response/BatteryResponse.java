package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.packet.LiveDataPacket;
import com.linde.scapp.packet.StatusPacket;

public class BatteryResponse extends SuccessResponse
{
    @Expose
    private int battery;

    public BatteryResponse(@NonNull LiveDataPacket packet)
    {
        super();
        battery = packet.getBatteryLevel();
    }

    public BatteryResponse(@NonNull StatusPacket packet)
    {
        super();
        battery = packet.getBattery();
    }
}
