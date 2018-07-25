package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

public class Gas
{
    @Expose
    private String name;

    @Expose
    private Float percentage;

    public Gas(@NonNull String name, float percentage)
    {
        this.name = name;
        this.percentage = percentage;
    }

    public boolean validate()
    {
        return (name != null) && (percentage != null);
    }

    @NonNull
    public String getName()
    {
        return name;
    }

    public float getPercentage()
    {
        return percentage;
    }
}
