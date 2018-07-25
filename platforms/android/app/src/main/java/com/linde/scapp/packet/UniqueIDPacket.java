package com.linde.scapp.packet;

public class UniqueIDPacket extends ResponsePacket
{
    public static final byte COMMAND_ID = (byte)0xA0;

    private long mUniqueID;

    public UniqueIDPacket(byte[] data)
    {
        super(data);

        mUniqueID = readUnsignedLong(8);
    }

    public long getUniqueID()
    {
        return mUniqueID;
    }

    public String description()
    {
        return String.format("Unique ID %d");
    }
}
