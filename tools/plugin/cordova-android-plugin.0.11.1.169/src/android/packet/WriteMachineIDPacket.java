package com.linde.scapp.packet;

public class WriteMachineIDPacket extends Packet
{
    public static final byte COMMAND_ID = (byte)0x10;

    private String mMachineID;

    public WriteMachineIDPacket(String machineID)
    {
        super();
        mMachineID = machineID;
        byte[] data = machineID.getBytes();
        setData(COMMAND_ID, data);
    }

    public String description()
    {
        return String.format("Write Machine ID: %s", mMachineID);
    }
}
