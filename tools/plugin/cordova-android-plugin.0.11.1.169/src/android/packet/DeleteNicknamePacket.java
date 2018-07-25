package com.linde.scapp.packet;

public class DeleteNicknamePacket extends Packet
{
    public static final byte COMMAND_ID = 0x1B;

    public DeleteNicknamePacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Delete nickname";
    }
}
