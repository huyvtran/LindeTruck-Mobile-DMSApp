package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.packet.UniqueIDPacket;

public class UniqueIDResponse extends SuccessResponse
{
    @Expose
    private final long uniqueID;

    public UniqueIDResponse(@NonNull UniqueIDPacket packet)
    {
        super();
        uniqueID = packet.getUniqueID();
    }
}
