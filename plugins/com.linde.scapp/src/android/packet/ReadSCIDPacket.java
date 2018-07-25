package com.linde.scapp.packet;

public class ReadSCIDPacket extends Packet
{
    public static final byte COMMAND_ID = (byte)0x15;

    public ReadSCIDPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Read SCID";
    }
}
