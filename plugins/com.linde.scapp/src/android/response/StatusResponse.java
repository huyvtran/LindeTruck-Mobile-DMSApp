package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.packet.StatusPacket;

public class StatusResponse extends SuccessResponse
{
    private class Status
    {
        @Expose
        private int battery;

        @Expose
        private int temperature;

        @Expose
        private boolean lowBattery;

        @Expose
        private boolean arcNoGas;

        @Expose
        private boolean zeroWireFeedRate;

        @Expose
        private boolean extendedNoArc;

        @Expose
        private boolean disconnectedReturnCable;

        @Expose
        private boolean lowTemperature;

        @Expose
        private boolean archiveFull;

        @Expose
        private boolean welding;

        @Expose
        private boolean archivedData;

        @Expose
        private boolean batteryChargingHighRate;

        @Expose
        private boolean batteryCharging;

        public Status(@NonNull StatusPacket packet)
        {
            battery = packet.getBattery();
            temperature = packet.getTemperature();
            lowBattery = packet.hasLowBattery();
            arcNoGas = packet.arcHasNoGas();
            zeroWireFeedRate = packet.hasZeroWireFeedRate();
            extendedNoArc = packet.hasExtendedNoArc();
            disconnectedReturnCable = packet.hasDisconnectedReturnCable();
            lowTemperature = packet.hasLowTemperature();
            archiveFull = packet.hasFullArchive();
            welding = packet.isWelding();
            archivedData = packet.hasArchivedData();
            batteryChargingHighRate = packet.isBatteryChargingAtHighRate();
            batteryCharging = packet.isBatteryCharging();
        }
    }

    @Expose
    private Status status;

    public StatusResponse(@NonNull StatusPacket packet)
    {
        super();
        status = new Status(packet);
    }
}
