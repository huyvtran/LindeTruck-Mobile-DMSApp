package com.linde.scapp.packet;

public class ReadUniqueIDPacket extends Packet
{
    public static final byte COMMAND_ID = (byte)0x20;

    public ReadUniqueIDPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Read unique ID";
    }
}
