package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.packet.SCIDPacket;

import java.util.Locale;

public class SCIDResponse extends SuccessResponse
{
    private class SCID
    {
        @Expose
        private final String firmwareMajor;

        @Expose
        private final String firmwareMinor;

        @Expose
        private final String protocolMajor;

        @Expose
        private final String protocolMinor;

        @Expose
        private final String scid;

        public SCID(@NonNull SCIDPacket packet)
        {
            firmwareMajor = String.format(Locale.getDefault(), "%d", packet.getFirmwareMajorVersion());
            firmwareMinor = String.format(Locale.getDefault(), "%d", packet.getFirmwareMinorVersion());
            protocolMajor = String.format(Locale.getDefault(), "%d", packet.getProtocolMajorVersion());
            protocolMinor = String.format(Locale.getDefault(), "%d", packet.getProtocolMinorVersion());
            scid = packet.getScid();
        }
    }

    @Expose
    private final SCID scid;

    public SCIDResponse(@NonNull SCIDPacket packet)
    {
        super();
        scid = new SCID(packet);
    }
}
