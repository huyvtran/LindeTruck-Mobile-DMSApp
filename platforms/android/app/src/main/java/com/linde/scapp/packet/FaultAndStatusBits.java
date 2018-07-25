package com.linde.scapp.packet;

import android.support.annotation.NonNull;

public class FaultAndStatusBits
{
    public enum FaultBit
    {
        LOW_BATTERY(0),
        ARC_NO_GAS(1),
        ZERO_WIRE_FEED_RATE(2),
        EXTENDED_NO_ARC(3),
        DISCONNECTED_RETURN_CABLE(4),
        LOW_TEMPERATURE(5),
        ARCHIVE_FULL(6);

        private final int mValue;

        private FaultBit(int value)
        {
            mValue = value;
        }

        public int getValue()
        {
            return mValue;
        }
    }

    public enum StatusBit
    {
        WELDING_IN_PROGRESS(4),
        ARCHIVED_DATA_PRESENT(5),
        BATTERY_CHARGING_HIGH_RATE(6),
        BATTERY_CHARGING(7);

        private final int mValue;

        private StatusBit(int value)
        {
            mValue = value;
        }

        public int getValue()
        {
            return mValue;
        }
    }

    public static boolean checkForFault(@NonNull Packet packet, int location, @NonNull FaultBit faultBit)
    {
        byte aByte = packet.buf()[Packet.HEADER_LENGTH + location + 1];
        return bitIsActiveAtPosition(aByte, faultBit.getValue());
    }

    public static boolean checkForStatus(@NonNull Packet packet, int location, @NonNull StatusBit statusBit)
    {
        byte aByte = packet.buf()[Packet.HEADER_LENGTH + location];
        return bitIsActiveAtPosition(aByte, statusBit.getValue());
    }

    private static boolean bitIsActiveAtPosition(byte aByte, int position)
    {
        return getBitFromByteAtPosition(aByte, position) != 0;
    }

    private static int getBitFromByteAtPosition(byte aByte, int position)
    {
        return (aByte >> position) & 1;
    }
}
