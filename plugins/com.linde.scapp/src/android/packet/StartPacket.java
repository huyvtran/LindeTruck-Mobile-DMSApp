package com.linde.scapp.packet;

import com.google.gson.annotations.Expose;
import com.linde.scapp.Stack;
import com.linde.scapp.Utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;

public class StartPacket extends Packet
{
    public static final byte COMMAND_ID = 0x01;

    @Expose
    public long timestamp;

    @Expose
    public String timeSyncString;

    public StartPacket(byte[] data)
    {
        super(data);
        timestamp = readUnsignedLong(4);
        timeSyncString = readString();
    }

    public long timestamp()
    {
        return timestamp;
    }

    public String timeSyncString()
    {
        return timeSyncString;
    }

    public String description()
    {
        return String.format("START %d %s", timestamp, timeSyncString);
    }
}
