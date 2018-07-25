package com.linde.scapp;

import android.content.Context;
import android.content.res.AssetManager;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

public class GasLookupTable extends ArrayList<ADCFlowPair>
{
    private static final int GAS_FLOW_LOOKUP_NUM_OF_ENTRIES	= 177;

    @Nullable
    public static GasLookupTable create(@NonNull Context context, @NonNull String fileName)
    {
        AssetManager assetManager = context.getAssets();
        InputStream inputStream;
        try
        {
            inputStream = assetManager.open(fileName);
        }
        catch (IOException e)
        {
            e.printStackTrace();
            return null;
        }

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        int i;
        try
        {
            i = inputStream.read();
            while (i != -1)
            {
                byteArrayOutputStream.write(i);
                i = inputStream.read();
            }
            inputStream.close();
        }
        catch (IOException e)
        {
            e.printStackTrace();
            return null;
        }

        // Ignore everything until the first "{" as the file may start with a comment
        String string = byteArrayOutputStream.toString();
        int startIndex = string.indexOf("{");
        string = string.substring(startIndex);

        String[] substrings = string.split(",\\n");
        if (substrings.length != GAS_FLOW_LOOKUP_NUM_OF_ENTRIES)
        {
            return null;
        }

        GasLookupTable gasLookupTable = new GasLookupTable();
        for (String substring : substrings)
        {
            substring = substring.replace("{", "");
            substring = substring.replace("}", "");
            String[] subsubstrings = substring.split(", ");
            if (subsubstrings.length != 2)
            {
                return null;
            }
            int adc;
            int flow;
            try
            {
                adc = Integer.valueOf(subsubstrings[0]);
                flow = Integer.valueOf(subsubstrings[1]);
            }
            catch (NumberFormatException e)
            {
                return null;
            }
            ADCFlowPair adcFlowPair = new ADCFlowPair(adc, flow);
            gasLookupTable.add(adcFlowPair);
        }
        return gasLookupTable;
    }

    public float getGasFlowRate(int adc)
    {
        float gasFlowRate;
        if (adc < get(0).getAdc())
        {
            // Our adc is smaller than the smallest adc
            // Use the flow corresponding to the smallest adc
            gasFlowRate = get(0).getFlow();
        }
        else if (adc > get(size() - 1).getAdc())
        {
            // Our adc is larger than the largest adc
            // Use the flow corresponding to the largest adc
            gasFlowRate = get(size() - 1).getFlow();
        }
        else
        {
            // Find the index where our adc is first larger than an adc from the lookup table
            int index = 0;
            while ((index < size()) && (adc > get(index + 1).getAdc()))
            {
                index++;
            }

            // Interpolate
            // Consider a graph of adc (x) vs flow (y) and the straight line y - b = m (x - a)
            // y = (deltaY * (x - a)) / deltaX + b
            float deltaX = get(index + 1).getAdc() - get(index).getAdc();
            float deltaY = get(index + 1).getFlow() - get(index).getFlow();
            float a = get(index + 1).getAdc();
            float b = get(index + 1).getFlow();
            gasFlowRate = (deltaY * (adc - a)) / deltaX + b;
        }
        // Convert from 0.01L/min to 1L/min
        return gasFlowRate / 100;
    }
}
