package com.linde.scapp;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.JsonSyntaxException;
import com.linde.scapp.packet.ArchivedDataPacket;
import com.linde.scapp.packet.GasCalibrationPacket;
import com.linde.scapp.packet.LiveDataPacket;
import com.linde.scapp.packet.StartPacket;
import com.linde.scapp.packet.StopPacket;
import com.linde.scapp.response.ErrorResponse;
import com.linde.scapp.response.ResultResponse;
import com.linde.scapp.response.StartStopResponse;
import com.linde.scapp.response.SuccessResponse;
import com.linde.scapp.response.Warning;
import com.linde.scapp.response.WarningResponse;
import com.linde.scapp.response.WeldDatasetResponse;
import com.linde.scapp.response.WeldDatasetsResponse;
import com.linde.scapp.response.WeldProgressResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;


public class WeldHelper
{
    private final Context mContext;
    private final DataStore mDataStore;

    private CallbackContext mWeldingCallback;
    private WeldInputData mWeldInputData;
    private GasCalibration mGasCalibration;
    private WeldDataset mCurrentWeldDataset;

    public enum ProcessArchivedDataPacketResult {
        SUCCESS,
        EMPTY,
        FAILURE
    }

    public WeldHelper(@NonNull Context context)
    {
        this(context, new DataStore(context));
    }

    // Protected method which can be made public for testing
    protected WeldHelper(@NonNull Context context, @NonNull DataStore dataStore)
    {
        mContext = context;
        mDataStore = dataStore;
    }

    public void onDestroy()
    {
        mWeldingCallback = null;
    }

    private Date mTimeBase;

    @NonNull
    public PluginResult registerForWeldingNotifications(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        if (mWeldingCallback != null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STARTED,
                    "Failed to register for welding notifications - already registered");
        }

        JSONObject jsonObject = null;
        if (data != null && data.length() == 1)
        {
            try
            {
                Object object = data.get(0);
                if (object instanceof JSONObject)
                {
                    jsonObject = (JSONObject) object;
                }
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        WeldInputData weldInputData = null;
        if (jsonObject != null)
        {
            try
            {
                weldInputData = Utils.sGsonExternal.fromJson(jsonObject.toString(), WeldInputData.class);
            }
            catch (JsonSyntaxException e)
            {
                // Stub
            }
        }
        if (weldInputData == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to register for welding notifications - expected one dictionary parameter");
        }
        if (!weldInputData.validateProperties())
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to register for welding notifications - missing required parameter(s)");
        }

        mWeldingCallback = callback;
        mWeldInputData = weldInputData;

        if (mCurrentWeldDataset == null)
        {
            // If not currently welding then will we just inform the app that registering was
            // successful (with warning from validating the gas mixture, if any)
            Warning warning = weldInputData.getValidateGasMixtureWarning();
            PluginResult result;
            if (warning != null)
            {
                WarningResponse warningResponse = new WarningResponse(warning);
                result = SuccessResponse.create(warningResponse);
            }
            else
            {
                result = SuccessResponse.create();
            }
            result.setKeepCallback(true);
            return result;
        }

        // However, if we are currently welding...
        Warning warning;
        if (mCurrentWeldDataset.isAssociatedWithWeld())
        {
            // The weld input data is ignored
            warning = new Warning(Warning.Code.WELD_INPUT_DATA_IGNORED,
                    "Current dataset is already associated with weld, new weld input data ignored but will be used for next dataset");
        }
        else
        {
            // Associate the dataset with the weld input data but the gas mixture (if any) is ignored
            mCurrentWeldDataset.associateWithWeld(weldInputData);
            warning = new Warning(Warning.Code.GAS_MIXTURE_DATA_IGNORED,
                    "Current dataset is using default gas mixture, gas mixture from new weld input data (if any) ignored but will be used for next dataset");
        }

        // First inform the app that registering was successful (with warning that the weld input
        // data or gas mixture is ignored)
        WarningResponse warningResponse = new WarningResponse(warning);
        PluginResult result = SuccessResponse.create(warningResponse);
        result.setKeepCallback(true);
        callback.sendPluginResult(result);

        // And then inform the app that welding has started
        result = SuccessResponse.create(new StartStopResponse(true));
        result.setKeepCallback(true);
        return result;
    }

    @NonNull
    public PluginResult deregisterFromWeldingNotifications()
    {
        if (mWeldingCallback == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.PROCESS_ALREADY_STOPPED,
                    "Failed to deregister from welding notifications - not currently registered");
        }

        // If a dataset is currently active then do not disassociate it from the weld
        mWeldingCallback = null;
        mWeldInputData = null;
        return SuccessResponse.create();
    }

    @NonNull
    public PluginResult isRegisteredForWeldingNotifications()
    {
        boolean isRegistered = (mWeldingCallback != null);
        return SuccessResponse.create(new ResultResponse(isRegistered));
    }

    @NonNull
    public PluginResult getMissedDatasets(@Nullable JSONArray data)
    {
        String Id = null;
        if (data != null && data.length() == 1)
        {
            try
            {
                Id = data.getString(0);
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        if (Id == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get missed datasets - expected one string parameter");
        }
        List<String> datasets = mDataStore.getAssociatedDatasets(Id);
        return SuccessResponse.create(new WeldDatasetsResponse(datasets));
    }

    @NonNull
    public PluginResult getMissedDataset(@Nullable JSONArray data)
    {
        String Id = null;
        String timestamp = null;
        if (data != null && data.length() == 2)
        {
            try
            {
                Id = data.getString(0);
                timestamp = data.getString(1);
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        if (Id == null || timestamp == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get missed dataset - expected two string parameters");
        }

        WeldDataset dataset = mDataStore.getAssociatedDataset(Id, timestamp);
        if (dataset == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get missed dataset - could not find associated dataset with Id and timestamp");
        }
        return SuccessResponse.create(new WeldDatasetResponse(dataset));
    }

    @NonNull
    public PluginResult getUnassociatedDatasets()
    {
        List<String> datasets = mDataStore.getUnassociatedDatasets();
        return SuccessResponse.create(new WeldDatasetsResponse(datasets));
    }

    @NonNull
    public PluginResult getUnassociatedDataset(@Nullable JSONArray data)
    {
        String timestamp = null;
        JSONObject jsonObject = null;
        if (data != null && data.length() == 2)
        {
            try
            {
                timestamp = data.getString(0);
                Object object = data.get(1);
                if (object instanceof JSONObject)
                {
                    jsonObject = (JSONObject) object;
                }
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        WeldInputData weldInputData = null;
        if (jsonObject != null)
        {
            try
            {
                weldInputData = Utils.sGsonExternal.fromJson(jsonObject.toString(), WeldInputData.class);
            }
            catch (JsonSyntaxException e)
            {
                // Stub
            }
        }
        if (timestamp == null || weldInputData == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get unassociated dataset - expected one string and one dictionary parameter");
        }

        WeldDataset dataset = mDataStore.getUnassociatedDataset(timestamp);
        if (dataset == null)
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get unassociated dataset - could not find unassociated dataset with timestamp");
        }

        if (!weldInputData.validateProperties())
        {
            return ErrorResponse.create(ErrorResponse.Code.UNEXPECTED_PARAMS,
                    "Failed to get unassociated dataset - missing required parameter(s)");
        }

        // Note that this is no need to validate the weld input data optional properties i.e. gas
        // mixture, because the gas mixture cannot be changed
        dataset.associateWithWeld(weldInputData);
        dataset.dataFinished();
        Warning warning = new Warning(Warning.Code.GAS_MIXTURE_DATA_IGNORED,
                "Dataset is using default gas mixture, gas mixture from weld input data (if any) ignored");
        return SuccessResponse.create(new WeldDatasetResponse(dataset, warning));
    }

    public void processGasCalibrationPacket(@NonNull GasCalibrationPacket gasCalibrationPacket)
    {
        if (mGasCalibration != null)
        {
            throw new RuntimeException("Have already set gas calibration");
        }
        mGasCalibration = gasCalibrationPacket.getGasCalibration();
    }

    public void processStartPacket(@Nullable StartPacket startPacket)
    {
        if (mGasCalibration == null)
        {
            // We must have received a start packet before we received the gas calibration packet
            // The chances of this happening are very slim and would require welding to start as
            // soon as we are connected and haven't yet received the gas calibration
            return;
        }

        if (mCurrentWeldDataset != null)
        {
            // If we receive a start data packet whilst the current weld dataset is still active i.e.
            // we haven't received a stop packet, then assume that we have simply missed the stop packet
            processStopPacket(null);
        }

        mTimeBase = null;
        Date startTime = null;
        if (startPacket != null)
        {
            try
            {
                mTimeBase = Utils.sPacketDateFormat.parse(startPacket.timeSyncString());
                startTime = new Date(mTimeBase.getTime() + startPacket.timestamp());
            }
            catch(ParseException e)
            {
                // Stub
            }
        }
        if (mTimeBase == null)
        {
            mTimeBase = new Date();
        }
        if (startTime == null)
        {
            startTime = mTimeBase;
        }

        // If the app is currently registered to receive welding notifications then associate
        // the dataset with the weld input data now
        // Otherwise the weld input data will be set later (when registering)
        mCurrentWeldDataset = new WeldDataset(startTime, mContext, mWeldInputData, mGasCalibration);

        if (mWeldingCallback != null)
        {
            PluginResult result = SuccessResponse.create(new StartStopResponse(true));
            result.setKeepCallback(true);
            mWeldingCallback.sendPluginResult(result);
        }
    }

    public void processLiveDataPacket(@NonNull LiveDataPacket packet)
    {
        if (mCurrentWeldDataset == null)
        {
            // If we receive a live data packet without first having received a start packet then ignore it
            // Unlike processStopPacket(), do not report the failure to stack so that it will not
            // send a THROWNAWAY acknowledgement
            return;
        }

        WeldProgressData data = mCurrentWeldDataset.processPacket(packet);
        if (mWeldingCallback != null)
        {
            PluginResult result = SuccessResponse.create(new WeldProgressResponse(data));
            result.setKeepCallback(true);
            mWeldingCallback.sendPluginResult(result);
        }
    }

    public boolean processStopPacket(@Nullable StopPacket stopPacket)
    {
        if (mCurrentWeldDataset == null)
        {
            // If we receive a stop packet without first having received a start packet then ignore it
            // Unlike processLiveDataPacket(), report failure so that the stack can send a THROWNAWAY acknowledgement
            return false;
        }

        Date stopTime;
        if (stopPacket == null)
        {
            stopTime = new Date();
        }
        else
        {
            stopTime = new Date(mTimeBase.getTime() + stopPacket.timestamp());
        }
        mCurrentWeldDataset.dataStopped(stopTime);

        // Only call dataFinished() on associated datasets
        // dataset.dataFinished() calls measurements.dataFinished() which extracts the errors
        // which are based on the limits provided by being associated with a weld
        // When the unassociated weld is retrieved, it will be first associated before calling
        // dataFinished()
        if (mCurrentWeldDataset.isAssociatedWithWeld())
        {
            mCurrentWeldDataset.dataFinished();
        }

        if (mWeldingCallback != null)
        {
            PluginResult result = SuccessResponse.create(new WeldDatasetResponse(mCurrentWeldDataset));
            result.setKeepCallback(true);
            mWeldingCallback.sendPluginResult(result);
        }
        else
        {
            mDataStore.saveDataset(mCurrentWeldDataset);
        }
        mCurrentWeldDataset = null;
        return true;
    }

    @NonNull
    public ProcessArchivedDataPacketResult processArchivedDataPacket(@NonNull ArchivedDataPacket packet)
    {
        if (mGasCalibration == null)
        {
            // Requesting gas calibration is before requesting archived data
            // Therefore gas calibration should never be null
            throw new RuntimeException("Gas calibration should not be null");
        }

        ArrayList<WeldDataset> datasets = new ArrayList<WeldDataset>();
        try
        {
            while (true)
            {
                StartPacket startPacket = packet.getNextStartPacket();
                if (startPacket == null)
                {
                    break;
                }

                // Extract the sync time base and the offset from the start packet, to generate a timestamp.
                Date timeBase;
                try
                {
                    timeBase = Utils.sPacketDateFormat.parse(startPacket.timeSyncString());
                }
                catch(ParseException e)
                {
                    // Now what do we do? This will clearly be wrong, but I see no other alternative.
                    timeBase = new Date();
                }

                Date startTime = new Date(timeBase.getTime() + startPacket.timestamp());
                WeldDataset dataset = new WeldDataset(startTime, mContext, null, mGasCalibration);

                while (true)
                {
                    LiveDataPacket liveDataPacket = packet.getNextLiveDataPacket();
                    if (liveDataPacket == null)
                    {
                        break;
                    }
                    dataset.processPacket(liveDataPacket);
                }

                StopPacket stopPacket = packet.getNextStopPacket();
                if (stopPacket == null)
                {
                    // Invalid sequence of packets
                    return ProcessArchivedDataPacketResult.FAILURE;
                }
                Date stopTime = new Date(timeBase.getTime() + stopPacket.timestamp());
                dataset.dataStopped(stopTime);
                datasets.add(dataset);
            }
        }
        catch (IndexOutOfBoundsException e)
        {
            e.printStackTrace();
            return ProcessArchivedDataPacketResult.FAILURE;
        }

        if (datasets.size() == 0)
        {
            return ProcessArchivedDataPacketResult.EMPTY;
        }

        // If we get here, everything was valid, so we can save it
        for(WeldDataset dataset : datasets)
        {
            mDataStore.saveDataset(dataset);
        }
        return ProcessArchivedDataPacketResult.SUCCESS;
    }
}
