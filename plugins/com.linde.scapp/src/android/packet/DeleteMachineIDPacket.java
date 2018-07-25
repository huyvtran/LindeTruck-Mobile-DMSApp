package com.linde.scapp.packet;

public class DeleteMachineIDPacket extends Packet
{
    public static final byte COMMAND_ID = (byte)0x11;

    public DeleteMachineIDPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Delete Machine ID";
    }
}
