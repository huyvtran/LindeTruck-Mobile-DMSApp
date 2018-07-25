package com.linde.scapp.packet;

import android.support.annotation.NonNull;

public class MachineIDAndNicknamePacket extends ResponsePacket
{
    public static final byte COMMAND_ID = (byte)0x92;

    private String mMachineID;
    private String mNickname;

    public MachineIDAndNicknamePacket(byte[] data)
    {
        super(data);

        mMachineID = readString(HEADER_LENGTH, HEADER_LENGTH + 32);
        mNickname = readString(HEADER_LENGTH + 32, HEADER_LENGTH + 32 + 32);
    }

    @NonNull
    public String getMachineID()
    {
        return mMachineID;
    }

    @NonNull
    public String getNickname()
    {
        return mNickname;
    }

    public String description()
    {
        return String.format("MachineID=%s, Nickname=%s", mMachineID, mNickname);
    }
}
