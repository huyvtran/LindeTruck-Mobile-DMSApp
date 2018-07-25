package com.linde.scapp.packet;

import com.google.gson.annotations.Expose;

public class StopPacket extends Packet
{
    public static final byte COMMAND_ID = 0x02;

    @Expose
    private long timestamp;

    public StopPacket(byte[] data)
    {
        super(data);
        timestamp = readUnsignedLong(4);
    }

    public long timestamp()
    {
        return timestamp;
    }

    public String description()
    {
        return String.format("STOP %d", timestamp());
    }

    public boolean attemptSyncFollowing()
    {
        return true;
    }
}
