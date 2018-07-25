package com.linde.scapp;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

public class WeldMetadata
{
    @Expose
    private GasMixture StepGasMixture__c;

    @Expose
    private GasCalibration StepGasCalibration__c;

    public WeldMetadata(@NonNull GasMixture gasMixture, @NonNull GasCalibration gasCalibration)
    {
        StepGasMixture__c = gasMixture;
        StepGasCalibration__c = gasCalibration;
    }

    @NonNull
    public GasMixture getGasMixture()
    {
        return StepGasMixture__c;
    }

    @NonNull
    public GasCalibration getGasCalibration()
    {
        return StepGasCalibration__c;
    }
}
