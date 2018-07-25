package com.linde.scapp.packet;

public class ReadMachineIDAndNicknamePacket extends Packet
{
    public static final byte COMMAND_ID = (byte)0x12;

    public ReadMachineIDAndNicknamePacket()
    {
        super();
        // No payload.
        setData(COMMAND_ID, null);
    }

    public String description()
    {
        return "Read Machine ID";
    }
}
