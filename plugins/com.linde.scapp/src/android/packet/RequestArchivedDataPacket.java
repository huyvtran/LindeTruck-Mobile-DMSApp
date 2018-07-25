package com.linde.scapp.packet;

public class RequestArchivedDataPacket extends Packet
{
    public static final byte COMMAND_ID_NEW = 0x17;

    public static final byte COMMAND_ID_CONTINUATION = 0x1F;

    private boolean mContinuation;

    public RequestArchivedDataPacket(boolean continuation)
    {
        super();
        mContinuation = continuation;
        // No payload.
        setData(continuation ? COMMAND_ID_CONTINUATION : COMMAND_ID_NEW, null);

    }

    public String description()
    {
        return "Request archived data, continuation:" + (mContinuation ? "true" : "false");
    }
}
