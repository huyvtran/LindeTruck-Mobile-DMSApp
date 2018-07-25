package com.linde.scapp.packet;

public class RequestStatusPacket extends Packet
{
    public static final byte COMMAND_ID = 0x13;

    public RequestStatusPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Request status";
    }
}
