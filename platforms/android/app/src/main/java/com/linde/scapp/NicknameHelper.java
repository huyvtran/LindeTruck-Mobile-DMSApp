package com.linde.scapp;

import android.support.annotation.NonNull;

import com.linde.scapp.packet.DeleteNicknamePacket;
import com.linde.scapp.packet.MachineIDAndNicknamePacket;
import com.linde.scapp.packet.Packet;
import com.linde.scapp.packet.WriteNicknamePacket;
import com.linde.scapp.response.NicknameResponse;
import com.linde.scapp.response.SuccessResponse;

public class NicknameHelper extends NameHelper
{
    public NicknameHelper(@NonNull Stack stack)
    {
        super(stack);
    }

    @Override
    protected SuccessResponse getReadSuccessResponseWithName(@NonNull String name)
    {
        return new NicknameResponse(name);
    }

    @NonNull
    @Override
    protected Packet getWritePacket(@NonNull String name)
    {
        return new WriteNicknamePacket(name);
    }

    @NonNull
    @Override
    protected Packet getDeletePacket()
    {
        return new DeleteNicknamePacket();
    }

    @NonNull
    @Override
    protected String getResultName()
    {
        return "nickname";
    }

    @NonNull
    @Override
    protected String getNameFromPacket(@NonNull MachineIDAndNicknamePacket packet)
    {
        return packet.getNickname();
    }
}
