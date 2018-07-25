package com.linde.scapp.packet;

import com.google.gson.annotations.Expose;
import com.linde.scapp.Stack;
import com.linde.scapp.Utils;

import java.util.Date;

public class SyncTimePacket extends Packet
{
    public static final byte COMMAND_ID = 0x16;

    @Expose
    public String mTimeSyncString;

    public SyncTimePacket()
    {
        super();

        // Date is already in UTC, so this is fine.
        mTimeSyncString = Utils.sPacketDateFormat.format(new Date());
        // Default charset is UTF-8 on Android/
        byte[] data = mTimeSyncString.getBytes();
        setData(COMMAND_ID, data);
    }

    public String description()
    {
        return String.format("SYNC %s", mTimeSyncString);
    }
}
