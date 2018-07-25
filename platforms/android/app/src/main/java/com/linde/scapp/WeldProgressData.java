package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.packet.LiveDataPacket;

import java.util.ArrayList;

public class WeldProgressData
{
    @Expose
    private final MinMaxValue scwdscurrent = new MinMaxValue();

    @Expose
    private final MinMaxValue scwdsvoltage = new MinMaxValue();

    @Expose
    private final MinMaxValue scwdspower = new MinMaxValue();

    @Expose
    private final MinMaxValue scwdsflow = new MinMaxValue();

    @Expose
    private final MinMaxValue scwdswirespeed = new MinMaxValue();

    @Expose
    private final MinMaxValue scwdsambienttemp = new MinMaxValue();

    private final ArrayList<Boolean> mPolarityCurrent = new ArrayList<Boolean>();

    public WeldProgressData()
    {
        // Stub
    }

    public void addLiveDataPacket(@NonNull LiveDataPacket packet)
    {
        scwdscurrent.addValue(packet.getAverageCurrent());
        scwdsvoltage.addValue(packet.getAverageVoltage());
        scwdspower.addValue(packet.getAveragePower());
        scwdsflow.addValue(packet.getAverageGasFlow());
        scwdswirespeed.addValue(packet.getAverageWireFeedRate());
        scwdsambienttemp.addValue(packet.getAverageTemperature());
        mPolarityCurrent.add(packet.getPolarityCurrent());
    }

    public int size()
    {
        return scwdscurrent.getValues().size();
    }

    public float getCurrent(int index)
    {
        return scwdscurrent.getValues().get(index);
    }

    public float getVoltage(int index)
    {
        return scwdsvoltage.getValues().get(index);
    }

    public float getPower(int index)
    {
        return scwdspower.getValues().get(index);
    }

    @NonNull
    public ArrayList<Float> getFlows()
    {
        return scwdsflow.getValues();
    }

    public float getFlow(int index)
    {
        return scwdsflow.getValues().get(index);
    }

    @NonNull
    public ArrayList<Float> getWirespeeds()
    {
        return scwdswirespeed.getValues();
    }

    public float getWirespeed(int index)
    {
        return scwdswirespeed.getValues().get(index);
    }

    public float getTemperature(int index)
    {
        return scwdsambienttemp.getValues().get(index);
    }

    public boolean getPolarityCurrent(int index)
    {
        return mPolarityCurrent.get(index);
    }
}
