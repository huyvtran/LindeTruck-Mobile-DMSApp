package com.linde.scapp.packet;

public class SCIDPacket extends ResponsePacket
{
    public static final byte COMMAND_ID = (byte)0x95;

    private byte mFirmwareMajorVersion;
    private byte mFirmwareMinorVersion;
    private byte mProtocolMajorVersion;
    private byte mProtocolMinorVersion;
    private String mSCID;

    public SCIDPacket(byte[] data)
    {
        super(data);

        mFirmwareMajorVersion = readByte();
        mFirmwareMinorVersion = readByte();
        mProtocolMajorVersion = readByte();
        mProtocolMinorVersion = readByte();
        mSCID = readString();
    }

    public byte getFirmwareMajorVersion()
    {
        return mFirmwareMajorVersion;
    }

    public byte getFirmwareMinorVersion()
    {
        return mFirmwareMinorVersion;
    }

    public byte getProtocolMajorVersion()
    {
        return mProtocolMajorVersion;
    }

    public byte getProtocolMinorVersion()
    {
        return mProtocolMinorVersion;
    }

    public String getScid()
    {
        return mSCID;
    }

    public String description()
    {
        return String.format("SCID %d.%d %d.%d %s",
                mFirmwareMajorVersion, mFirmwareMinorVersion,
                mProtocolMajorVersion, mProtocolMinorVersion, mSCID);
    }
}
