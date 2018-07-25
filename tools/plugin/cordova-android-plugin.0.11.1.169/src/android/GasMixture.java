package com.linde.scapp;

import android.content.Context;
import android.content.SharedPreferences;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.JsonSyntaxException;
import com.linde.scapp.response.AllowedGasesResponse;
import com.linde.scapp.response.GasMixtureResponse;
import com.linde.scapp.response.SuccessResponse;
import com.linde.scapp.response.Warning;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public class GasMixture extends ArrayList<Gas>
{
    private static final String SHARED_PREFERENCES_KEY = GasMixture.class.getSimpleName() + "_SHARED_PREFERENCES_KEY";
    private static final String DEFAULT_GAS_MIXTURE_KEY = GasMixture.class.getSimpleName() + "_SHARED_PREFERENCES_KEY";

    private static final String ARGON = "Ar";
    private static final String ARGON_FILENAME = "lookuptables/2017-05-23 -generic gas lookup - Ar.txt";
    private static final String AIR = "Air";
    private static final String AIR_FILENAME = "lookuptables/2017-05-23 -generic gas lookup - air.txt";
    private static final String CO2 = "CO2";
    private static final String CO2_FILENAME = "lookuptables/2017-05-23 -generic gas lookup - CO2.txt";
    private static final String HE = "He";
    private static final String HE_FILENAME = "lookuptables/2017-09-12 -gas lookup from physics on Ar -- He.txt";
    private static final String H2 = "H2";
    private static final String H2_FILENAME = "lookuptables/2017-09-12 -gas lookup from physics on Ar -- H2.txt";
    private static final String N2 = "N2";
    private static final String N2_FILENAME = "lookuptables/2017-09-12 -gas lookup from physics on Ar -- N2.txt";
    private static final String NO2 = "NO2";
    private static final String NO2_FILENAME = "lookuptables/2017-09-12 -gas lookup from physics on Ar -- NO2.txt";
    private static final String O2 = "O2";
    private static final String O2_FILENAME = "lookuptables/2017-09-12 -gas lookup from physics on Ar -- O2.txt";
    private static final HashMap<String, GasLookupTable> mGasLookupTables = new HashMap<String, GasLookupTable>();

    private static final float ONE_HUNDRED_PERCENT = 100.f;
    private static final float MIN_PERCENTAGE      = 0.1f;
    private static final float MAX_PERCENTAGE      = ONE_HUNDRED_PERCENT;
    private static final float EPSILON             = 0.0001f;

    public static void loadGasLookupTables(@NonNull Context context)
    {
        mGasLookupTables.put(ARGON, GasLookupTable.create(context, ARGON_FILENAME));
        mGasLookupTables.put(AIR, GasLookupTable.create(context, AIR_FILENAME));
        mGasLookupTables.put(CO2, GasLookupTable.create(context, CO2_FILENAME));
        mGasLookupTables.put(HE, GasLookupTable.create(context, HE_FILENAME));
        mGasLookupTables.put(H2, GasLookupTable.create(context, H2_FILENAME));
        mGasLookupTables.put(N2, GasLookupTable.create(context, N2_FILENAME));
        mGasLookupTables.put(NO2, GasLookupTable.create(context, NO2_FILENAME));
        mGasLookupTables.put(O2, GasLookupTable.create(context, O2_FILENAME));
        for (Map.Entry<String, GasLookupTable> entry : mGasLookupTables.entrySet())
        {
            if (entry.getValue() == null)
            {
                throw new RuntimeException("Failed to load gas lookup table for " + entry.getKey());
            }
        }
    }

    @NonNull
    public static GasMixture getDefaultGasMixture(@NonNull Context context)
    {
        SharedPreferences sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_KEY, 0);
        String jsonString = sharedPreferences.getString(DEFAULT_GAS_MIXTURE_KEY, null);
        GasMixture gasMixture = null;
        if (jsonString != null)
        {
            try
            {
                gasMixture = Utils.sGsonExternal.fromJson(jsonString, GasMixture.class);
            }
            catch (JsonSyntaxException e)
            {
                // Stub
            }
        }
        if (gasMixture != null)
        {
            return gasMixture;
        }
        return getDefaultGasMixture();
    }

    @NonNull
    private static GasMixture getDefaultGasMixture()
    {
        GasMixture gasMixture = new GasMixture();
        gasMixture.add(new Gas(ARGON, ONE_HUNDRED_PERCENT));
        return gasMixture;
    }

    @NonNull
    public static PluginResult setDefaultGasMixture(@NonNull Context context, @Nullable JSONArray data)
    {
        JSONArray jsonArray = null;
        if (data != null && data.length() == 1)
        {
            try
            {
                Object object = data.get(0);
                if (object instanceof JSONArray)
                {
                    jsonArray = (JSONArray) object;
                }
            }
            catch (JSONException e)
            {
                // Stub
            }
        }
        GasMixture gasMixture = null;
        if (jsonArray != null)
        {
            try
            {
                gasMixture = Utils.sGsonExternal.fromJson(jsonArray.toString(), GasMixture.class);
            }
            catch (JsonSyntaxException e)
            {
                // Stub
            }
        }
        Warning warning = validateGasMixture(gasMixture);
        if (warning == null)
        {
            SharedPreferences sharedPreferences = context.getSharedPreferences(SHARED_PREFERENCES_KEY, 0);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.putString(DEFAULT_GAS_MIXTURE_KEY, jsonArray.toString());
            // Note that we cannot use editor.apply() as we are not on the main thread
            if (editor.commit())
            {
                return GasMixtureResponse.createSuccess(getDefaultGasMixture(context));
            }
            warning = new Warning(Warning.Code.OTHER_ERROR, "An error occurred writing the default gas to storage");
        }
        return GasMixtureResponse.createFailure(getDefaultGasMixture(context), warning);
    }

    @NonNull
    public static PluginResult getAllowedGases()
    {
        Set<String> gases = mGasLookupTables.keySet();
        AllowedGasesResponse response = new AllowedGasesResponse(new ArrayList<String>(gases));
        return SuccessResponse.create(response);
    }

    @Nullable
    public static Warning validateGasMixture(@Nullable GasMixture gasMixture)
    {
        if (gasMixture == null || gasMixture.size() < 1)
        {
            return new Warning(Warning.Code.NO_GAS_MIXTURE_PROVIDED,
                    "No gas mixture data provided, using default mix");
        }

        float totalPercentage = 0;
        for (Gas gas : gasMixture)
        {
            if (!gas.validate())
            {
                return new Warning(Warning.Code.UNRECOGNISED_GAS_NAME_PROVIDED,
                        "Invalid gas mixture data provided, using default mix");
            }
            if (!validateName(gas.getName()))
            {
                return new Warning(Warning.Code.UNRECOGNISED_GAS_NAME_PROVIDED,
                        "Unrecognised gas name provided, using default mix");
            }
            if (!validatePercentage(gas.getPercentage()))
            {
                return new Warning(Warning.Code.INVALID_GAS_PERCENTAGES_PROVIDED,
                        "Invalid gas percentage provided, using default mix");
            }
            totalPercentage += gas.getPercentage();
        }
        if (!validateTotalPercentage(totalPercentage))
        {
            return new Warning(Warning.Code.INVALID_GAS_PERCENTAGES_PROVIDED,
                    "Invalid gas percentages provided (percentages do not add to 100), using default mix");
        }
        return null;
    }

    private static boolean validateName(@Nullable String name)
    {
        for (String gas : mGasLookupTables.keySet())
        {
            if (gas.equals(name))
            {
                return true;
            }
        }
        return false;
    }

    private static boolean validatePercentage(float percentage)
    {
        return (percentage >= MIN_PERCENTAGE - EPSILON) && (percentage <= MAX_PERCENTAGE + EPSILON);
    }

    private static boolean validateTotalPercentage(float totalPercentage)
    {
        return Math.abs(totalPercentage - ONE_HUNDRED_PERCENT) < EPSILON;
    }

    public float getGasFlowRate(int adc)
    {
        float total = 0;
        for (Gas gas : this)
        {
            GasLookupTable lookupTable = mGasLookupTables.get(gas.getName());
            float flow = lookupTable.getGasFlowRate(adc);
            total += flow * gas.getPercentage();
        }
        return total / 100.f;
    }
}
