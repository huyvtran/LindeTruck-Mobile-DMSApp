package com.linde.scapp;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;
import com.linde.scapp.packet.LiveDataPacket;

import java.util.Date;

public class WeldDataset
{
    @Expose
    private Status status;

    @Expose
    private final WeldMetadata metadata;

    @Expose
    private final WeldMeasurements measurements;

    private final WeldProgressData progressData = new WeldProgressData();

    public enum Status
    {
        @SerializedName("-1")
        UNKNOWN,
        @SerializedName("0")
        SUCCESS,
        @SerializedName("1")
        WARNING,
        @SerializedName("2")
        ERROR
    }

    public WeldDataset(@NonNull Date startDate, @NonNull Context context, @Nullable WeldInputData weldInputData, @NonNull GasCalibration gasCalibration)
    {
        measurements = new WeldMeasurements(startDate);
        GasMixture gasMixture = null;
        if (weldInputData != null)
        {
            measurements.associateWithWeld(weldInputData);
            gasMixture = weldInputData.getGasMixture();
        }
        if (gasMixture == null)
        {
            gasMixture = GasMixture.getDefaultGasMixture(context);
        }
        metadata = new WeldMetadata(gasMixture, gasCalibration);
    }

    @NonNull
    public WeldProgressData processPacket(@NonNull LiveDataPacket packet)
    {
        if (measurements.isStopped())
        {
            throw new RuntimeException("WeldDataset cannot processPacket if already stopped");
        }

        packet.setGasMixtureAndCalibration(metadata.getGasMixture(), metadata.getGasCalibration());
        progressData.addLiveDataPacket(packet);
        return progressData;
    }

    public void associateWithWeld(@NonNull WeldInputData weldInputData)
    {
        measurements.associateWithWeld(weldInputData);
    }

    @Nullable
    public String associatedWeldId()
    {
        return measurements.associatedWeldId();
    }

    public boolean isAssociatedWithWeld()
    {
        return measurements.isAssociatedWithWeld();
    }

    public void dataStopped(@NonNull Date stopDate)
    {
        measurements.dataStopped(stopDate);
    }

    public void dataFinished()
    {
        status = measurements.dataFinished(progressData);
    }

    public boolean isFinished()
    {
        return measurements.isFinished();
    }

    @NonNull
    public String getStartTime()
    {
        return measurements.getStartTime();
    }
}
