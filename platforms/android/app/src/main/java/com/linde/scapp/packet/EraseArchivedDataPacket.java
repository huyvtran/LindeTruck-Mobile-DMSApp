package com.linde.scapp.packet;

/*
 * This class is provided for testing and debugging purposes only
 * Note that the SC will not send a response until it is complete (20-30 secs)
 */
public class EraseArchivedDataPacket extends Packet
{
    public static final byte COMMAND_ID = 0x35;

    public EraseArchivedDataPacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Erase archived data";
    }
}
