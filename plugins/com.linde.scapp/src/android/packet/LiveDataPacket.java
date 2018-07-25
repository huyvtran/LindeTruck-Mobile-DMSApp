package com.linde.scapp.packet;

import android.support.annotation.NonNull;

import com.linde.scapp.GasCalibration;
import com.linde.scapp.GasMixture;

public class LiveDataPacket extends Packet
{
    public static final byte COMMAND_ID = 0x00;

    private long timestamp;
    private float averageCurrent;
    private float averageVoltage;
    private float averagePower;
    private int averageADC;
    private Float averageGasFlow;
    private float averageWireFeedRate;
    private float averageTemperature;
    private boolean polarityCurrent;

    public LiveDataPacket(byte[] data)
    {
        super(data);

        long timestamp = readUnsignedLong(4);
        float current = readSigned(2);
        // Convert from 0.1V to 1V
        float voltage = (float)readSigned(2)/10;
        float power = readUnsigned(4);
        int adc = readUnsigned(4);
        // Convert from 0.1m/min to 1m/min
        float wireFeedRate = (float)readUnsigned(2)/10;
        float temperature = readUnsigned(1);
        init(timestamp, current, voltage, power, adc, wireFeedRate, temperature);
    }

    // Protected method which can be made public for testing
    protected void init(long timestamp, float current, float voltage, float power, int adc, float wireFeedRate, float temperature)
    {
        this.timestamp = timestamp;
        averageCurrent = Math.abs(current);
        averageVoltage = Math.abs(voltage);
        averagePower = power;
        averageADC = adc;
        averageWireFeedRate = wireFeedRate;
        averageTemperature = temperature;
        polarityCurrent = current > 0;
    }

    public long timestamp()
    {
        return timestamp;
    }

    public float getAverageCurrent()
    {
        // A
        return averageCurrent;
    }

    public float getAverageVoltage()
    {
        // V
        return averageVoltage;
    }

    public float getAveragePower()
    {
        // W
        return averagePower;
    }

    public void setGasMixtureAndCalibration(@NonNull GasMixture gasMixture, @NonNull GasCalibration gasCalibration)
    {
        if (averageGasFlow != null)
        {
            throw new RuntimeException("Have already setGasMixtureAndCalibration on LiveDataPacket");
        }
        float gasFlow = gasMixture.getGasFlowRate(averageADC);
        averageGasFlow = gasCalibration.getCalibratedGasFlowRate(gasFlow);
    }

    public float getAverageGasFlow()
    {
        // L/min
        if (averageGasFlow == null)
        {
            throw new RuntimeException("Have not yet setGasMixtureAndCalibration on LiveDataPacket");
        }
        return averageGasFlow;
    }

    public float getAverageWireFeedRate()
    {
        // m/min
        return averageWireFeedRate;
    }

    public float getAverageTemperature()
    {
        // °C
        return averageTemperature;
    }

    public boolean getPolarityCurrent()
    {
        return polarityCurrent;
    }

    public int getBatteryLevel()
    {
        return buf()[HEADER_LENGTH + 17];
    }

    public String description()
    {
        return String.format("LDP %d", timestamp());
    }
}
