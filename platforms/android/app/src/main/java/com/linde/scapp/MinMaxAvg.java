package com.linde.scapp;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;

public class MinMaxAvg
{
    @Expose
    private float min;

    @Expose
    private float max;

    @Expose
    private float avg;

    private boolean mLowError;

    private boolean mHighError;

    private WeldDataset.Status mStatus = WeldDataset.Status.UNKNOWN;

    public MinMaxAvg(@NonNull ArrayList<Float> values, @Nullable WeldInputData.Limits limits)
    {
        float sum = 0;
        float minAvg = 0;
        float maxAvg = 0;
        for (int i = 0; i < values.size(); i++)
        {
            boolean forceOverride = (i == 0);

            float value = values.get(i);
            if (forceOverride || (value < min))
            {
                min = value;
            }
            if (forceOverride || (value > max))
            {
                max = value;
            }

            sum += values.get(i);
            avg = sum / (i + 1);

            if (forceOverride || (avg < minAvg))
            {
                minAvg = avg;
            }
            if (forceOverride || (avg > maxAvg))
            {
                maxAvg = avg;
            }
        }

        if ((values.size() > 0) && (limits != null))
        {
            // Note that we use mMinAvg and mMaxAvg as the low/high error flags should be set if, at any
            // point during the weld, the average goes too low/high
            mLowError = (minAvg < limits.getLower());
            mHighError = (maxAvg > limits.getUpper());

            if (mLowError || mHighError)
            {
                mStatus = WeldDataset.Status.ERROR;
            }
            else
            {
                mStatus = WeldDataset.Status.SUCCESS;
            }
        }
    }

    public void reset()
    {
        min = 0;
        max = 0;
        avg = 0;
        mLowError = false;
        mHighError = false;
        mStatus = WeldDataset.Status.UNKNOWN;
    }

    public float getMin()
    {
        return min;
    }

    public float getMax()
    {
        return max;
    }

    public float getAvg()
    {
        return avg;
    }

    public boolean getLowError()
    {
        return mLowError;
    }

    public boolean getHighError()
    {
        return mHighError;
    }

    @NonNull
    public WeldDataset.Status getStatus()
    {
        return mStatus;
    }
}
