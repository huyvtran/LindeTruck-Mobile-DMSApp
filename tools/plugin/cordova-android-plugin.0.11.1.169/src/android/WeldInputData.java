package com.linde.scapp;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;
import com.linde.scapp.response.Warning;

public class WeldInputData
{
    private static final float DEFAULT_STEP_WIRE_FEED_MAX_DEV = 1.5f;

    @Expose
    private String Id;

    @Expose
    private Float StepVoltageMin__c;

    @Expose
    private Float StepVoltageMax__c;

    @Expose
    private Float StepCurrentMin__c;

    @Expose
    private Float StepCurrentMax__c;

    @Expose
    private Float StepWireFeedMin__c;

    @Expose
    private Float StepWireFeedMax__c;

    @Expose
    private Float StepWireFeedMaxDev__c;

    @Expose
    private Float StepGas1FlowMin__c;

    @Expose
    private Float StepGas1FlowMax__c;

    @Expose
    private GasMixture StepGasMixture__c;

    private Warning mValidateGasMixtureWarning;

    public boolean validateProperties()
    {
        boolean success = (Id != null) && (StepVoltageMin__c != null) && (StepVoltageMax__c != null)
                && (StepCurrentMin__c != null) && (StepCurrentMax__c != null)
                && (StepWireFeedMin__c != null) && (StepWireFeedMax__c != null)
                && (StepGas1FlowMin__c != null) && (StepGas1FlowMax__c != null);
        if (success)
        {
            mValidateGasMixtureWarning = GasMixture.validateGasMixture(StepGasMixture__c);
            if (mValidateGasMixtureWarning != null)
            {
                StepGasMixture__c = null;
            }
        }
        return success;
    }

    @NonNull
    public String getId()
    {
        return Id;
    }

    @NonNull
    public Limits getVoltageLimits()
    {
        return new Limits(StepVoltageMin__c, StepVoltageMax__c);
    }

    @NonNull
    public Limits getCurrentLimits()
    {
        return new Limits(StepCurrentMin__c, StepCurrentMax__c);
    }

    @NonNull
    public Limits getWirespeedLimits()
    {
        return new Limits(StepWireFeedMin__c, StepWireFeedMax__c);
    }

    public float getWireFeedMaxDev()
    {
        if (StepWireFeedMaxDev__c == null)
        {
            return DEFAULT_STEP_WIRE_FEED_MAX_DEV;
        }
        return StepWireFeedMaxDev__c;
    }

    @NonNull
    public Limits getGasFlowLimits()
    {
        return new Limits(StepGas1FlowMin__c, StepGas1FlowMax__c);
    }

    @Nullable
    public GasMixture getGasMixture()
    {
        return StepGasMixture__c;
    }

    @Nullable
    public Warning getValidateGasMixtureWarning()
    {
        return mValidateGasMixtureWarning;
    }

    public class Limits
    {
        private final float mLower;
        private final float mUpper;

        public Limits(float lower, float upper)
        {
            mLower = lower;
            mUpper = upper;
        }

        public float getLower()
        {
            return mLower;
        }

        public float getUpper()
        {
            return mUpper;
        }
    }
}
