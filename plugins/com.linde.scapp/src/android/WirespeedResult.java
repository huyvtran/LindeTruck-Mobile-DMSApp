package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;

public class WirespeedResult
{
    private static final float WIRESPEED_BIN_WIDTH = 0.1f;

    private static final float THRESHOLD_FRACTION_OF_ALL_WIRESPEEDS_IN_FIRST_BIN = 0.9f;

    private static final float THRESHOLD_FRACTION_OF_WIRESPEEDS_FOR_ABOVE_THRESHOLD_CURRENT_IN_FIRST_BIN = 0.5f;

    @Expose
    private final Histogram measured;

    @Expose
    private final EstimatedWirespeeds estimated;

    private final boolean mLowError;

    private final boolean mHighError;

    private final boolean mDevError;

    private final WeldDataset.Status mStatus;

    public WirespeedResult(@NonNull ArrayList<Float> wirespeeds,
                           float averageCurrent,
                           @NonNull ArrayList<Integer> aboveThresholdCurrentIndices,
                           @NonNull WeldInputData.Limits limits,
                           float maxDev)
    {
        measured = new Histogram(wirespeeds, WIRESPEED_BIN_WIDTH, limits, maxDev);
        estimated = new EstimatedWirespeeds(averageCurrent);
        mLowError = measured.getLowError();
        mHighError = measured.getHighError();
        mDevError = calculateDevError(wirespeeds, aboveThresholdCurrentIndices);
        if (wirespeeds.size() == 0)
        {
            mStatus = WeldDataset.Status.UNKNOWN;
        }
        else
        {
            if (mLowError || mHighError || mDevError)
            {
                mStatus = WeldDataset.Status.ERROR;
            }
            else
            {
                mStatus = WeldDataset.Status.SUCCESS;
            }
        }
    }

    private boolean calculateDevError(@NonNull ArrayList<Float> wirespeeds, @NonNull ArrayList<Integer> aboveThresholdCurrentIndices)
    {
        if (measured.getDevError())
        {
            return true;
        }

        float fractionOfAllWirespeedsInFirstBin = getFractionOfAllWirespeedsInFirstBin(wirespeeds);
        if (fractionOfAllWirespeedsInFirstBin > THRESHOLD_FRACTION_OF_ALL_WIRESPEEDS_IN_FIRST_BIN)
        {
            // Too many wirespeed values fall in the zero bin
            return true;
        }

        float fractionOfWirespeedsForAboveThresholdCurrentInFirstBin = getFractionOfWirespeedsForAboveThresholdCurrentInFirstBin(wirespeeds, aboveThresholdCurrentIndices);
        if (fractionOfWirespeedsForAboveThresholdCurrentInFirstBin > THRESHOLD_FRACTION_OF_WIRESPEEDS_FOR_ABOVE_THRESHOLD_CURRENT_IN_FIRST_BIN)
        {
            // Too many wirespeed values (where the current has been above threshold) fall in the zero bin
            return true;
        }
        return false;
    }

    private float getFractionOfAllWirespeedsInFirstBin(@NonNull ArrayList<Float> wirespeeds)
    {
        if (wirespeeds.size() == 0)
        {
            return 0;
        }

        int countInFirstBin = 0;
        for (float wirespeed : wirespeeds)
        {
            if (measured.isValueInFirstBin(wirespeed))
            {
                countInFirstBin++;
            }
        }
        return (float)(countInFirstBin) / wirespeeds.size();
    }

    private float getFractionOfWirespeedsForAboveThresholdCurrentInFirstBin(@NonNull ArrayList<Float> wirespeeds, @NonNull ArrayList<Integer> aboveThresholdCurrentIndices)
    {
        if (aboveThresholdCurrentIndices.size() == 0)
        {
            return 0;
        }

        int countInFirstBin = 0;
        for (int i : aboveThresholdCurrentIndices)
        {
            float wirespeed = wirespeeds.get(i);
            if (measured.isValueInFirstBin(wirespeed))
            {
                countInFirstBin++;
            }
        }
        return (float)(countInFirstBin) / aboveThresholdCurrentIndices.size();
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

    @NonNull
    public WeldDataset.Status getStatus()
    {
        return mStatus;
    }

    private class EstimatedWirespeeds
    {
        @Expose
        @SerializedName("wiresize_0.8")
        private final float wiresize_0_8;

        @Expose
        @SerializedName("wiresize_1.0")
        private final float wiresize_1_0;

        @Expose
        @SerializedName("wiresize_1.2")
        private final float wiresize_1_2;

        @Expose
        @SerializedName("wiresize_1.6")
        private final float wiresize_1_6;

        public EstimatedWirespeeds(float averageCurrent)
        {
            wiresize_0_8 = calculateWirespeed(averageCurrent, WireSizeCoefficients.WIRE_SIZE_0_8);
            wiresize_1_0 = calculateWirespeed(averageCurrent, WireSizeCoefficients.WIRE_SIZE_1_0);
            wiresize_1_2 = calculateWirespeed(averageCurrent, WireSizeCoefficients.WIRE_SIZE_1_2);
            wiresize_1_6 = calculateWirespeed(averageCurrent, WireSizeCoefficients.WIRE_SIZE_1_6);
        }

        private float calculateWirespeed(float averageCurrent, @NonNull WireSizeCoefficients coefficients)
        {
            return (float) (coefficients.getAlpha() * (coefficients.getP2() * Math.pow(averageCurrent, 2) + coefficients.getP1() * averageCurrent + coefficients.getP0()));
        }
    }

    private enum WireSizeCoefficients
    {
        WIRE_SIZE_0_8(4.030 * Math.pow(10, -1),
                7.280 * Math.pow(10, -4),
                9.820 * Math.pow(10, -5),
                4.251 * Math.pow(10, 0)),
        WIRE_SIZE_1_0(1.320 * Math.pow(10, 0),
                1.020 * Math.pow(10, -2),
                8.910 * Math.pow(10, -5),
                2.721 * Math.pow(10, 0)),
        WIRE_SIZE_1_2(8.030 * Math.pow(10, -1),
                1.380 * Math.pow(10, -3),
                6.250 * Math.pow(10, -5),
                1.889 * Math.pow(10, 0)),
        WIRE_SIZE_1_6(9.320 * Math.pow(10, -1),
                9.770 * Math.pow(10, -4),
                3.140 * Math.pow(10, -5),
                1.063 * Math.pow(10, 0));

        private double mP0;
        private double mP1;
        private double mP2;
        private double mAlpha;

        WireSizeCoefficients(double p0, double p1, double p2, double alpha)
        {
            mP0 = p0;
            mP1 = p1;
            mP2 = p2;
            mAlpha = alpha;
        }

        public double getP0()
        {
            return mP0;
        }

        public double getP1()
        {
            return mP1;
        }

        public double getP2()
        {
            return mP2;
        }

        public double getAlpha()
        {
            return mAlpha;
        }
    }
}
