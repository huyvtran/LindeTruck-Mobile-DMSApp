package com.linde.scapp.packet;

public class IdentifyPacket extends Packet
{
    public static final byte COMMAND_ID = 0x14;

    public IdentifyPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "IDENTIFY";
    }
}

