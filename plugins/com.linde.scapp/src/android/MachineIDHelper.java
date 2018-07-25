package com.linde.scapp;

import android.support.annotation.NonNull;

import com.linde.scapp.packet.DeleteMachineIDPacket;
import com.linde.scapp.packet.MachineIDAndNicknamePacket;
import com.linde.scapp.packet.Packet;
import com.linde.scapp.packet.WriteMachineIDPacket;
import com.linde.scapp.response.MachineIDResponse;
import com.linde.scapp.response.SuccessResponse;

public class MachineIDHelper extends NameHelper
{
    public MachineIDHelper(@NonNull Stack stack)
    {
        super(stack);
    }

    @Override
    protected SuccessResponse getReadSuccessResponseWithName(@NonNull String name)
    {
        return new MachineIDResponse(name);
    }

    @NonNull
    @Override
    protected Packet getWritePacket(@NonNull String name)
    {
        return new WriteMachineIDPacket(name);
    }

    @NonNull
    @Override
    protected Packet getDeletePacket()
    {
        return new DeleteMachineIDPacket();
    }

    @NonNull
    @Override
    protected String getResultName()
    {
        return "machine ID";
    }

    @NonNull
    @Override
    protected String getNameFromPacket(@NonNull MachineIDAndNicknamePacket packet)
    {
        return packet.getMachineID();
    }
}
