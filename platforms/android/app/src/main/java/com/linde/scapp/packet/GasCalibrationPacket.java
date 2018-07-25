package com.linde.scapp.packet;

import com.linde.scapp.GasCalibration;

public class GasCalibrationPacket extends ResponsePacket
{
    public static final byte COMMAND_ID = (byte)0x9E;

    private GasCalibration gasCalibration;

    public GasCalibrationPacket(byte[] data)
    {
        super(data);

        // Gain is expressed as unsigned fixed-point value of the format 8.8 e.g. 0x0100 = 1.0
        // From http://www.hugi.scene.org/online/coding/hugi%2015%20-%20cmtadfix.htm
        // real number = fixed-point value / scale
        // where 8.8 means a scale factor of 256
        float gain = (float) readUnsigned(2) / 256.f;

        // Convert from 0.1L/min tp 1L/min
        float offset = (float) readSigned(2) / 10.f;

        gasCalibration = new GasCalibration(gain, offset);
    }

    public GasCalibration getGasCalibration()
    {
        return gasCalibration;
    }

    public String description()
    {
        return String.format("Gain=%s, offset=%s", gasCalibration.getGain(), gasCalibration.getOffset());
    }
}
