package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;

public class Histogram
{
    private final float mBinWidth;

    private final ArrayList<Integer> mBins = new ArrayList<Integer>();

    @Expose
    private final float min;

    @Expose
    private final float max;

    @Expose
    private final float avg;

    @Expose
    private final float std;

    private final boolean mLowError;

    private final boolean mHighError;

    private final boolean mDevError;

    public Histogram(@NonNull ArrayList<Float> values,
                     float binWidth,
                     @NonNull WeldInputData.Limits limits,
                     float maxDev)
    {
        mBinWidth = binWidth;

        ArrayList<Float> sublistValues = createBins(values);
        // Use the sublist of values to calculate min/max, and minAvg/maxAvg (to determine low/high error)
        MinMaxAvg minMaxAvg = new MinMaxAvg(sublistValues, limits);
        min = minMaxAvg.getMin();
        max = minMaxAvg.getMax();
        mLowError = minMaxAvg.getLowError();
        mHighError = minMaxAvg.getHighError();

        avg = calculateAvg();
        std = calculateStd();
        mDevError = (std > maxDev);
    }

    @NonNull
    private ArrayList<Float> createBins(@NonNull ArrayList<Float> values)
    {
        ArrayList<Float> sublistValues = new ArrayList<Float>();
        for (float value : values)
        {
            // Determine the bin corresponding to this value
            // Note that we shouldn't have value < 0 but if we do, it will have to go in the first bin
            int binIndex = Math.max(Math.round(value / mBinWidth), 0);

            // Get the current count for this bin
            int count = -1;
            while (count < 0)
            {
                try
                {
                    count = mBins.get(binIndex);
                }
                catch (IndexOutOfBoundsException e)
                {
                    // Extend the bins array
                    mBins.add(0);
                }
            }

            // Update the count
            count++;
            mBins.set(binIndex, count);

            if (binIndex > 0)
            {
                // Store the values which are not in the first bin
                sublistValues.add(getMiddleOfBin(binIndex));
            }
        }
        return sublistValues;
    }

    // 'avg' actually refers to 'mode'
    private float calculateAvg()
    {
        // Determine the non-zero mode(s)
        ArrayList<Integer> modes = new ArrayList<Integer>();
        int maxCount = 0;
        for (int i = 1; i < mBins.size(); i++)
        {
            int count = mBins.get(i);
            if ((count > 0) && (count >= maxCount))
            {
                if (count > maxCount)
                {
                    maxCount = count;
                    modes.clear();
                }
                modes.add(i);
            }
        }

        if (modes.size() == 0)
        {
            // Only the zero bin (or no bins at all) was populated
            return 0;
        }

        if (modes.size() == 1)
        {
            return getMiddleOfBin(modes.get(0));
        }

        // If there is more than one mode, calculate the mean of the modes
        float sum = 0;
        for (int mode : modes)
        {
            sum += getMiddleOfBin(mode);
        }
        return sum / modes.size();
    }

    // 'avg' is supposed to be the mean when calculating the standard deviation but here it is in
    // fact the mode
    private float calculateStd()
    {
        // The calculation assumes that all values within a bin are equal to that of the
        // middle of the bin
        float sum = 0;
        int count = 0;
        for (int i = 1; i < mBins.size(); i++)
        {
            float value = getMiddleOfBin(i);
            int aCount = mBins.get(i);
            sum += aCount * Math.pow(value - avg, 2);
            count += aCount;
        }
        if (count <= 1)
        {
            // Only the zero bin (or no bins at all) was populated
            // or there was only one item in any non-zero bin
            return 0;
        }
        return (float) Math.sqrt(sum / (count - 1));
    }

    private float getMiddleOfBin(int i)
    {
        return i * mBinWidth;
    }

    private float getTopOfBin(int i)
    {
        return (i + 0.5f) * mBinWidth;
    }

    public boolean getLowError()
    {
        return mLowError;
    }

    public boolean getHighError()
    {
        return mHighError;
    }

    public boolean getDevError()
    {
        return mDevError;
    }

    public boolean isValueInFirstBin(float value)
    {
        return (value < getTopOfBin(0));
    }
}
