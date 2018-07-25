package com.linde.scapp.packet;

public class AcknowledgeArchivedDataPacket extends Packet
{
    public static final byte COMMAND_ID = 0x19;

    public AcknowledgeArchivedDataPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "ACKNOWLEDGE_ARCHIVE";
    }
}
