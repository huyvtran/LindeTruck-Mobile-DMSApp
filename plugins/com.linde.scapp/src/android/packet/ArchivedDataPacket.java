package com.linde.scapp.packet;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import java.util.ArrayList;

public class ArchivedDataPacket
{
    // This is the command ID in response to requesting new archived data 0x17
    public static final byte COMMAND_ID_NEW = (byte)0x97;

    // This is the command ID in response to requesting a continuation of archived data 0x1F
    public static final byte COMMAND_ID_CONTINUATION = (byte)0x9F;

    private static final String TAG = ArchivedDataPacket.class.getName();

    private final static int NUM_ENTRIES_LENGTH = 4;
    private static final int START_COMMAND_LENGTH = 68;
    private static final int LIVE_DATA_LENGTH = 22;
    private static final int STOP_COMMAND_LENGTH = 4;

    // An archived data packet contains multiple datasets
    // This array stores the num of entries in each dataset
    private ArrayList<Integer> mDataSets = new ArrayList<Integer>();

    private int mLiveDataPacketIndex;

    private byte[] buf;
    private int readPos;

    /*
     * Note that ArchivedDataPacket is not a subclass of Packet (or ResponsePacket)
     * This is because in the instance where there was too much data to fit in a single packet (and
     * a continuation had to be requested), the aggregate data would have length such that it would
     * overflow the length bytes i.e. > 0xFFFF
     * Note also that the input data does not contain a header or checksum
     */
    public ArchivedDataPacket(byte[] data)
    {
        this.buf = data;

        // Process each data set in turn
        while(true)
        {
            int bytesRemaining = bytesRemaining();
            if (bytesRemaining < NUM_ENTRIES_LENGTH)
            {
                break;
            }

            // The expected number of data entries is encoded in the first four bytes (excluding the header)
            int numEntries = numEntries();
            bytesRemaining = bytesRemaining();

            // Check that the data length is sufficient to accommodate this
            int bytesNeeded = START_COMMAND_LENGTH + numEntries * LIVE_DATA_LENGTH + STOP_COMMAND_LENGTH;
            if (bytesRemaining < bytesNeeded)
            {
                Log.e(TAG,  "Bytes remaining: " + bytesRemaining + " bytes needed: " + bytesNeeded + " for " + numEntries + " entries");
                break;
            }

            // Record a dataset
            mDataSets.add(numEntries);
            readPos += bytesNeeded;
        }
        readPos = 0;
    }

    private int numEntries()
    {
        long value = Packet.readSignedLong(buf, readPos, NUM_ENTRIES_LENGTH);
        readPos += NUM_ENTRIES_LENGTH;
        return (int) value;
    }

    private int bytesRemaining()
    {
        return buf.length - readPos;
    }

    @Nullable
    public StartPacket getNextStartPacket() throws IndexOutOfBoundsException
    {
        if (mDataSets.size() == 0)
        {
            return null;
        }

        // Skip the number of data entries
        readPos += NUM_ENTRIES_LENGTH;

        mLiveDataPacketIndex = -1;
        byte[] data = buildPacket(StartPacket.COMMAND_ID, START_COMMAND_LENGTH);
        return new StartPacket(data);
    }

    @Nullable
    public LiveDataPacket getNextLiveDataPacket() throws IndexOutOfBoundsException
    {
        if (mDataSets.size() == 0)
        {
            return null;
        }

        int entries = mDataSets.get(0);
        mLiveDataPacketIndex++;
        if (mLiveDataPacketIndex == entries)
        {
            return null;
        }

        byte[] data = buildPacket(LiveDataPacket.COMMAND_ID, LIVE_DATA_LENGTH);
        return new LiveDataPacket(data);
    }

    @Nullable
    public StopPacket getNextStopPacket() throws IndexOutOfBoundsException
    {
        if (mDataSets.size() == 0)
        {
            return null;
        }

        mDataSets.remove(0);

        byte[] data = buildPacket(StopPacket.COMMAND_ID, STOP_COMMAND_LENGTH);
        return new StopPacket(data);
    }

    @NonNull
    private byte[] buildPacket(byte commandId, int length) throws IndexOutOfBoundsException
    {
        byte[] data = new byte[Packet.HEADER_LENGTH + length + Packet.CHECKSUM_LENGTH];
        data[Packet.SYNC_POS] = Packet.SYNC_BYTE;
        data[Packet.COMMAND_POS] = commandId;
        data[Packet.COUNTER_POS] = 0;
        data[Packet.DATALENGTH_HIGH_POS] = (byte) (length >> 8);
        data[Packet.DATALENGTH_LOW_POS] = (byte) (length & 0xff);
        System.arraycopy(buf, readPos, data, Packet.HEADER_LENGTH, length);
        data[data.length - 1] = Packet.checksum(data);
        readPos += length;
        return data;
    }
}
