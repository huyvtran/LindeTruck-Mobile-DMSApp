package com.linde.scapp.packet;

public class ResponsePacket extends Packet
{
    private final static int ERROR_POS = HEADER_LENGTH;

    public static final int ERROR_OK                            = 0;
    public static final int ERROR_INVALID                       = 1;
    public static final int ERROR_SYNC_TIME_IGNORED             = 2;
    public static final int ERROR_CANNOT_EXECUTE_WHILST_WELDING = 3;
    public static final int ERROR_DATA_DISCARDED                = 4;
    public static final int ERROR_UNKNOWN_COMMAND               = 5;

    public ResponsePacket(byte[] data)
    {
        super(data);
    }

    public String description()
    {
        return "Response";
    }

    public boolean isResponse()
    {
        return true;
    }

    public byte originalCommand()
    {
        return (byte)(command() & ~RESPONSE_BIT);
    }

    public byte errorCode()
    {
        return buf()[ERROR_POS];
    }
}
