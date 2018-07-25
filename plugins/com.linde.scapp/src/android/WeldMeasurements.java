package com.linde.scapp;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WeldMeasurements
{
    // 10Hz sample rate
    private static final int SAMPLES_PER_SECOND = 10;
    private static final int SAMPLES_PER_MINUTE = (60 * SAMPLES_PER_SECOND);

    private static final int INVALID_INDEX = -1;

    private static final int CURRENT_THRESHOLD = 3;
    private static final int GAS_THRESHOLD = 2;

    // Delay accumulating min/max/avg for 1 second
    private static final int DELAY_SAMPLES_COUNT = SAMPLES_PER_SECOND;

    @Expose
    private final String scwdsstarttime__c;

    @Expose
    private String scwdsstoptime__c;

    @Expose
    private String scwdspolarity__c = "";

    @Expose
    private float scwdsarctime__c;

    @Expose
    private float scwdsprepurgetime__c = 0;

    @Expose
    private float scwdspostpurgetime__c;

    @Expose
    private float scwdsflowtotal__c = 0;

    @Expose
    private float scwdswireused__c = 0;

    // TODO this value is not currently written too
    @Expose
    private float scwdsheatinput = 0;

    @Expose
    private float scwdssurgeflow__c;

    @Expose
    private MinMaxAvg scwdscurrent;

    @Expose
    private MinMaxAvg scwdsvoltage;

    @Expose
    private MinMaxAvg scwdsflow;

    @Expose
    private MinMaxAvg scwdspower;

    @Expose
    private MinMaxAvg scwdsambienttemp;

    @Expose
    private WirespeedResult scwdswirespeed;

    @Expose
    private Boolean scwdscurrentlow__c;

    @Expose
    private Boolean scwdscurrenthigh__c;

    @Expose
    private Boolean scwdsvoltagelow__c;

    @Expose
    private Boolean scwdsvoltagehigh__c;

    @Expose
    private Boolean scwdsgasflowlow__c;

    @Expose
    private Boolean scwdsgasflowhigh__c;

    @Expose
    private Boolean scwdswirespeedlow__c;

    @Expose
    private Boolean scwdswirespeedhigh__c;

    @Expose
    private Boolean scwdswirespeederror__c;

    // TODO the following are not currently in use
//    @Expose
//    private Boolean scwdsshortprepurge__c;
//
//    @Expose
//    private Boolean scwdsshortpostpurge__c;
//
//    @Expose
//    private Boolean scwdscurrentpolarityalert__c;
//
//    @Expose
//    private Boolean scwdslowheatinput__c;
//
//    @Expose
//    private Boolean scwdshighheatinput__c;
//
//    @Expose
//    private Boolean scwdsnowire__c;
//
//    @Expose
//    private Boolean scwdslowbattery__c;
//
//    @Expose
//    private Boolean scwdsreturndisconnect__c;
//
//    @Expose
//    private Boolean scwdssensorerror__c;

    @Expose
    private Boolean rejected;

    // Index of first sample to dataset trigger current threshold
    private int mWeldStartIndex = INVALID_INDEX;

    // Index of last sample to dataset trigger current threshold
    private int mWeldStopIndex = INVALID_INDEX;

    // Index of first sample to dataset trigger gas threshold
    private int mGasStartIndex = INVALID_INDEX;

    // Index of last sample to dataset trigger gas threshold
    private int mGasStopIndex = INVALID_INDEX;

    private WeldInputData mWeldInputData;

    private boolean mIsFinished = false;

    public WeldMeasurements(@NonNull Date startDate)
    {
        scwdsstarttime__c = Utils.sJsonDateFormat.format(startDate);
    }

    public void associateWithWeld(@NonNull WeldInputData weldInputData)
    {
        if (isAssociatedWithWeld())
        {
            throw new RuntimeException("WeldMeasurements cannot associateWithWeld if already associated with weld");
        }
        mWeldInputData = weldInputData;
    }

    @Nullable
    public String associatedWeldId()
    {
        if (mWeldInputData == null)
        {
            return null;
        }
        return mWeldInputData.getId();
    }

    public boolean isAssociatedWithWeld()
    {
        return (associatedWeldId() != null);
    }

    public void dataStopped(@NonNull Date stopDate)
    {
        if (isStopped())
        {
            throw new RuntimeException("WeldDataset has already stopped");
        }
        scwdsstoptime__c = Utils.sJsonDateFormat.format(stopDate);
    }

    public boolean isStopped()
    {
        return (scwdsstoptime__c != null);
    }

    @NonNull
    public WeldDataset.Status dataFinished(@NonNull WeldProgressData progressData)
    {
        if (!isAssociatedWithWeld())
        {
            throw new RuntimeException("WeldDataset cannot finish if not already associated with weld");
        }
        if (!isStopped())
        {
            throw new RuntimeException("WeldDataset cannot finish if not already stopped");
        }
        if (isFinished())
        {
            throw new RuntimeException("WeldDataset has already finished");
        }
        mIsFinished = true;

        ArrayList<Float> currentsToAverage = new ArrayList<Float>();
        ArrayList<Integer> aboveThresholdCurrentIndices = new ArrayList<Integer>();
        ArrayList<Float> voltagesToAverage = new ArrayList<Float>();
        ArrayList<Float> gasFlowsToAverage = new ArrayList<Float>();
        ArrayList<Float> powersToAverage = new ArrayList<Float>();
        ArrayList<Float> temperaturesToAverage = new ArrayList<Float>();
        int delaySamples = 0;
        for (int i = 0; i < progressData.size(); i++)
        {
            float wireSpeed = progressData.getWirespeed(i);
            float deltaWire = wireSpeed / SAMPLES_PER_MINUTE;
            scwdswireused__c += deltaWire;

            float gasFlow = progressData.getFlow(i);
            float deltaGas = gasFlow / SAMPLES_PER_MINUTE;
            scwdsflowtotal__c += deltaGas;

            float current = progressData.getCurrent(i);
            if (checkForStartStopConditions(current, gasFlow, i))
            {
                if (delaySamples < DELAY_SAMPLES_COUNT)
                {
                    delaySamples++;
                }
                else
                {
                    if (scwdspolarity__c.length() == 0)
                    {
                        if (progressData.getPolarityCurrent(i))
                        {
                            scwdspolarity__c = "= / + DC";
                        }
                        else
                        {
                            scwdspolarity__c = "= / - DC";
                        }
                    }

                    // Don't average values below current threshold
                    boolean currentAboveThreshold = (current > CURRENT_THRESHOLD);
                    if (currentAboveThreshold)
                    {
                        currentsToAverage.add(current);
                        aboveThresholdCurrentIndices.add(i);
                        voltagesToAverage.add(progressData.getVoltage(i));
                        gasFlowsToAverage.add(gasFlow);
                        powersToAverage.add(progressData.getPower(i));
                        temperaturesToAverage.add(progressData.getTemperature(i));
                    }
                }
            }
        }

        scwdscurrent = new MinMaxAvg(currentsToAverage, mWeldInputData.getCurrentLimits());
        scwdsvoltage = new MinMaxAvg(voltagesToAverage, mWeldInputData.getVoltageLimits());
        scwdsflow = new MinMaxAvg(gasFlowsToAverage, mWeldInputData.getGasFlowLimits());
        scwdspower = new MinMaxAvg(powersToAverage, null);
        scwdsambienttemp = new MinMaxAvg(temperaturesToAverage, null);
        scwdswirespeed = new WirespeedResult(progressData.getWirespeeds(), scwdscurrent.getAvg(), aboveThresholdCurrentIndices, mWeldInputData.getWirespeedLimits(), mWeldInputData.getWireFeedMaxDev());

        if (mGasStartIndex == INVALID_INDEX)
        {
            // Gas never crossed the threshold for starting
            // Treat it as starting when weld started
            mGasStartIndex = 0;
        }

        if (mWeldStartIndex == INVALID_INDEX)
        {
            // Current never crossed the threshold for starting
            // Mark as rejected
            mWeldStartIndex = progressData.size() - 1;
            rejected = true;
            // Also set the current/voltage/power min/max/avg values all to zero
            scwdscurrent.reset();
            scwdsvoltage.reset();
            scwdspower.reset();
        }

        if (mWeldStopIndex == INVALID_INDEX)
        {
            mWeldStopIndex = progressData.size() - 1;
        }
        if (mGasStopIndex == INVALID_INDEX)
        {
            mGasStopIndex = progressData.size() - 1;
        }

        scwdsarctime__c = ((float)(mWeldStopIndex - mWeldStartIndex)) / SAMPLES_PER_SECOND;
        scwdspostpurgetime__c = ((float)(mGasStopIndex - mWeldStopIndex)) / SAMPLES_PER_SECOND;
        scwdssurgeflow__c = calculateSurgeGasFlow(progressData.getFlows());

        if (scwdscurrent.getLowError())
        {
            scwdscurrentlow__c = true;
        }
        if (scwdscurrent.getHighError())
        {
            scwdscurrenthigh__c = true;
        }
        if (scwdsvoltage.getLowError())
        {
            scwdsvoltagelow__c = true;
        }
        if (scwdsvoltage.getHighError())
        {
            scwdsvoltagehigh__c = true;
        }
        if (scwdsflow.getLowError())
        {
            scwdsgasflowlow__c = true;
        }
        if (scwdsflow.getHighError())
        {
            scwdsgasflowhigh__c = true;
        }
        if (scwdswirespeed.getLowError())
        {
            scwdswirespeedlow__c = true;
        }
        if (scwdswirespeed.getHighError())
        {
            scwdswirespeedhigh__c = true;
        }
        if (scwdswirespeed.getDevError())
        {
            scwdswirespeederror__c = true;
        }
        return getStatus();
    }

    public boolean isFinished()
    {
        return mIsFinished;
    }

    private boolean checkForStartStopConditions(float current, float gasFlow, int index)
    {
        boolean weldStarted = (mWeldStartIndex != INVALID_INDEX);
        boolean currentAboveThreshold = (current > CURRENT_THRESHOLD);
        boolean gasAboveThreshold = (gasFlow > GAS_THRESHOLD);

        if (weldStarted)
        {
            if (mWeldStopIndex != INVALID_INDEX)
            {
                // Weld has stopped - check for restart
                if (currentAboveThreshold)
                {
                    mWeldStopIndex = INVALID_INDEX;
                }
            }
            else
            {
                // Weld is running - check for stop
                if (!currentAboveThreshold)
                {
                    mWeldStopIndex = index;
                }
            }
        }
        else
        {
            // Check for weld start
            if (currentAboveThreshold)
            {
                mWeldStartIndex = index;
                weldStarted = true;
                if (mGasStartIndex != INVALID_INDEX)
                {
                    scwdsprepurgetime__c = ((float)(mWeldStartIndex - mGasStartIndex)) / SAMPLES_PER_SECOND;
                }
            }
        }

        if (mGasStartIndex != INVALID_INDEX)
        {
            // Gas has started
            if (mGasStopIndex != INVALID_INDEX)
            {
                // Gas has stopped - check for restart
                if (gasAboveThreshold)
                {
                    mGasStopIndex = INVALID_INDEX;
                }
            }
            else
            {
                // Gas is running - check for stop
                if (!gasAboveThreshold)
                {
                    mGasStopIndex = INVALID_INDEX;
                }
            }
        }
        else
        {
            if (gasAboveThreshold)
            {
                mGasStartIndex = index;
                // Note that there is no need to set the pre purge time as 0 here if
                // mWeldStartIndex != INVALID_INDEX i.e. weld started before gas started,
                // since 0 is the default value
            }
        }

        return weldStarted;
    }

    private float calculateSurgeGasFlow(@NonNull List<Float> gasFlows)
    {
        if (!(mWeldStopIndex > mWeldStartIndex))
        {
            return 0.0f;
        }

        // Determine the frequency of each gas flow
        Map<Float, Integer> map = new HashMap<Float, Integer>();
        Integer maxCount = -Integer.MAX_VALUE;
        gasFlows = gasFlows.subList(mWeldStartIndex, mWeldStopIndex);
        for (Float gasFlow : gasFlows)
        {
            Float key = gasFlow;
            Integer count = 1;
            for (Float aGasFlow : map.keySet())
            {
                // First attempt a direct comparison
                // Otherwise compare gas flows to 0.01% error
                // Note that as gasFlow and aGasFlow are not equal, at least one of them will be non-zero
                Boolean match = (gasFlow.equals(aGasFlow)) ||
                        (Math.abs((gasFlow - aGasFlow) / Math.max(gasFlow, aGasFlow)) < 0.0001);
                if (match)
                {
                    key = aGasFlow;
                    count = map.get(aGasFlow) + 1;
                    break;
                }
            }
            map.put(key, count);
            if (count > maxCount)
            {
                maxCount = count;
            }
        }
        if (!(maxCount > 1))
        {
            // There is no mode
            return 0.0f;
        }

        // Determine the mode(s) i.e. the gas flow(s) with count equal to maxCount
        List<Float> modes = new ArrayList<Float>();
        for (Map.Entry<Float, Integer> aEntry : map.entrySet())
        {
            Integer count = aEntry.getValue();
            if (count.equals(maxCount))
            {
                modes.add(aEntry.getKey());
            }
        }

        // Establish the overall mode
        // If there is more than one mode (unlikely!) then pick the smallest one
        float mode = Float.MAX_VALUE;
        for (float aMode : modes)
        {
            if (aMode < mode)
            {
                mode = aMode;
            }
        }
        float surgeGasFlow = 0;
        for (Float gasFlow : gasFlows)
        {
            surgeGasFlow += (gasFlow - mode);
        }
        // The gas flow values are in units of L/min
        // The surge flow is required to be in units of L
        // Gas flow values are received at a rate of 10Hz
        // L/min = 1/600 * L/0.1s
        // We could convert each individual gas flow to a gas volume (by dividing by 600) but it
        // is the same mathematically to do this at the end
        return surgeGasFlow / 600;
    }

    @NonNull
    private WeldDataset.Status getStatus()
    {
        WeldDataset.Status status = WeldDataset.Status.UNKNOWN;
        status = getWorstStatus(status, scwdscurrent);
        status = getWorstStatus(status, scwdsvoltage);
        status = getWorstStatus(status, scwdspower);
        status = getWorstStatus(status, scwdsflow);
        status = getWorstStatus(status, scwdswirespeed.getStatus());
        status = getWorstStatus(status, scwdsambienttemp);
        return status;
    }

    @NonNull
    private WeldDataset.Status getWorstStatus(@NonNull WeldDataset.Status status, @NonNull MinMaxAvg measurement)
    {
        return getWorstStatus(status, measurement.getStatus());
    }

    @NonNull
    private WeldDataset.Status getWorstStatus(@NonNull WeldDataset.Status status, @NonNull WeldDataset.Status aStatus)
    {
        if (aStatus.ordinal() > status.ordinal())
        {
            return aStatus;
        }
        return status;
    }

    @NonNull
    public String getStartTime()
    {
        return scwdsstarttime__c;
    }
}
