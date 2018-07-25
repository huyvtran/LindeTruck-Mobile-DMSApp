package com.linde.scapp.packet;

public class StatusPacket extends ResponsePacket
{
    // This is the command ID when the SC decides to send us a status packet
    public static final byte COMMAND_ID = 0x05;

    // This is the command ID in response to us requesting status from the SC
    public static final byte COMMAND_ID_RESPONSE = (byte)0x93;

    private static final int FAULT_AND_STATUS_LOCATION = 2;

    private final int mBattery;
    private final int mTemperature;

    private final boolean mLowBattery;
    private final boolean mArcNoGas;
    private final boolean mZeroWireFeedRate;
    private final boolean mExtendedNoArc;
    private final boolean mDisconnectedReturnCable;
    private final boolean mLowTemperature;
    private final boolean mArchiveFull;

    private final boolean mIsWelding;
    private final boolean mArchivedData;
    private final boolean mBatteryChargingHighRate;
    private final boolean mBatteryCharging;

    public StatusPacket(byte[] data)
    {
        super(data);

        mBattery = readSigned(1);
        mTemperature = readSigned(1);

        mLowBattery = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.LOW_BATTERY);
        mArcNoGas = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.ARC_NO_GAS);
        mZeroWireFeedRate = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.ZERO_WIRE_FEED_RATE);
        mExtendedNoArc = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.EXTENDED_NO_ARC);
        mDisconnectedReturnCable = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.DISCONNECTED_RETURN_CABLE);
        mLowTemperature = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.LOW_TEMPERATURE);
        mArchiveFull = FaultAndStatusBits.checkForFault(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.FaultBit.ARCHIVE_FULL);

        mIsWelding = FaultAndStatusBits.checkForStatus(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.StatusBit.WELDING_IN_PROGRESS);
        mArchivedData = FaultAndStatusBits.checkForStatus(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.StatusBit.ARCHIVED_DATA_PRESENT);
        mBatteryChargingHighRate = FaultAndStatusBits.checkForStatus(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.StatusBit.BATTERY_CHARGING_HIGH_RATE);
        mBatteryCharging = FaultAndStatusBits.checkForStatus(this, FAULT_AND_STATUS_LOCATION,
                FaultAndStatusBits.StatusBit.BATTERY_CHARGING);
    }

    @Override
    public boolean isResponse()
    {
        return command() == COMMAND_ID_RESPONSE;
    }

    public int getBattery()
    {
        return mBattery;
    }

    public int getTemperature()
    {
        return mTemperature;
    }
    public boolean hasLowBattery()
    {
        return mLowBattery;
    }

    public boolean arcHasNoGas()
    {
        return mArcNoGas;
    }

    public boolean hasZeroWireFeedRate()
    {
        return mZeroWireFeedRate;
    }

    public boolean hasExtendedNoArc()
    {
        return mExtendedNoArc;
    }

    public boolean hasDisconnectedReturnCable()
    {
        return mDisconnectedReturnCable;
    }

    public boolean hasLowTemperature()
    {
        return mLowTemperature;
    }

    public boolean hasFullArchive()
    {
        return mArchiveFull;
    }

    public boolean isWelding()
    {
        return mIsWelding;
    }

    public boolean hasArchivedData()
    {
        return mArchivedData;
    }

    public boolean isBatteryChargingAtHighRate()
    {
        return mBatteryChargingHighRate;
    }

    public boolean isBatteryCharging()
    {
        return mBatteryCharging;
    }

    @Override
    public String description()
    {
        String description = "Battery=" + mBattery;
        description += ", temperature=" + mTemperature;
        description += ", has low battery=" + stringForBool(mLowBattery);
        description += ", arc has no gas=" + stringForBool(mArcNoGas);
        description += ", has zero wire feed rate=" + stringForBool(mZeroWireFeedRate);
        description += ", has extended no arc=" + stringForBool(mExtendedNoArc);
        description += ", has disconnected return cable=" + stringForBool(mDisconnectedReturnCable);
        description += ", has low temperature=" + stringForBool(mLowTemperature);
        description += ", has full archive=" + stringForBool(mArchiveFull);
        description += ", is welding=" + stringForBool(mIsWelding);
        description += ", has archived data=" + stringForBool(mArchivedData);
        description += ", battery is charging at high rate=" + stringForBool(mBatteryChargingHighRate);
        description += ", battery is charging=" + stringForBool(mBatteryCharging);
        return description;
    }

    private String stringForBool(boolean bool)
    {
        if (bool)
        {
            return "true";
        }
        return "false";
    }
}
