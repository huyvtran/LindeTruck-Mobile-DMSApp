package com.linde.scapp.packet;

public class ReadGasCalibrationPacket extends Packet
{
    public static final byte COMMAND_ID = 0x1E;

    public ReadGasCalibrationPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Read gas calibration";
    }
}
