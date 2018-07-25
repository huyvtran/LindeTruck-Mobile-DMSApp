package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;

public class MinMaxValue
{
    @Expose
    private Float min;

    @Expose
    private Float max;

    @Expose
    private Float value;

    private final ArrayList<Float> values = new ArrayList<Float>();

    public MinMaxValue()
    {
        // Stub
    }

    public void addValue(float value)
    {
        this.value = value;
        if ((min == null) || (value < min))
        {
            min = value;
        }
        if ((max == null) || value > max)
        {
            max = value;
        }
        values.add(value);
    }

    @NonNull
    public ArrayList<Float> getValues()
    {
        return values;
    }
}
