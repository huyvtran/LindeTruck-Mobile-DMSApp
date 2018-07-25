package com.linde.scapp;

import com.google.gson.annotations.Expose;

public class GasCalibration
{
    @Expose
    private float gain;

    @Expose
    private float offset;

    public GasCalibration(float gain, float offset)
    {
        this.gain = gain;
        this.offset = offset;
    }

    public float getGain()
    {
        return gain;
    }

    public float getOffset()
    {
        return offset;
    }

    public float getCalibratedGasFlowRate(float gasFlowRate)
    {
        return gain * gasFlowRate + offset;
    }
}
