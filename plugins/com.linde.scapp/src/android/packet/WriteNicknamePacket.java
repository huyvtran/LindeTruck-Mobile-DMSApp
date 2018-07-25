package com.linde.scapp.packet;

public class WriteNicknamePacket extends Packet
{
    public static final byte COMMAND_ID = 0x1A;

    private String mNickname;

    public WriteNicknamePacket(String nickname)
    {
        super();
        mNickname = nickname;
        byte[] data = nickname.getBytes();
        setData(COMMAND_ID, data);
    }

    public String description()
    {
        return String.format("Write nickname: %s", mNickname);
    }
}
