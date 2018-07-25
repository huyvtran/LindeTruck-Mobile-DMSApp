package com.linde.scapp;

import android.support.annotation.NonNull;
import android.util.Log;

import com.linde.scapp.packet.AcknowledgeArchivedDataPacket;
import com.linde.scapp.packet.ArchivedDataPacket;
import com.linde.scapp.packet.Packet;
import com.linde.scapp.packet.RequestArchivedDataPacket;
import com.linde.scapp.packet.ResponsePacket;

public class ArchivedDataHelper
{
    private final String TAG = ArchivedDataHelper.class.getSimpleName();

    private Stack mStack;
    private WeldHelper mWeldHelper;

    private byte[] mAggregateArchivedData;

    private boolean mWaitingForAcknowledgeArchivedDataResponse;
    private boolean mGetArchivedDataOnAcknowledgment;

    public ArchivedDataHelper(@NonNull Stack stack, @NonNull WeldHelper weldHelper)
    {
        mStack = stack;
        mWeldHelper = weldHelper;
    }

    public void onDestroy()
    {
        mStack = null;
        mWeldHelper = null;
    }

    public void startGettingArchivedData()
    {
        requestArchivedData(false);
    }

    public void processArchivedDataPacket(@NonNull ResponsePacket packet, boolean continuation)
    {
        // Extract all the useful data from the packet i.e. remove the header and checksum
        byte[] archivedData = trimBytes(packet.buf(), Packet.HEADER_LENGTH, Packet.CHECKSUM_LENGTH);
        boolean packetIsFull = (archivedData.length == 0xFFFF);

        if (continuation)
        {
            if (mAggregateArchivedData == null)
            {
                // Something has gone wrong...
                Log.e(TAG, "Continuation archived data packet received but we do not have the previous archived data packet(s)");
                // Send the acknowledgment so that the SC will delete this archived data
                sendAcknowledgement();
                return;
            }
            archivedData = concatBytes(mAggregateArchivedData, archivedData);
        }

        if (packetIsFull)
        {
            mAggregateArchivedData = archivedData;
            requestArchivedData(true);
        }
        else
        {
            mAggregateArchivedData = null;
            ArchivedDataPacket archivedDataPacket = new ArchivedDataPacket(archivedData);
            WeldHelper.ProcessArchivedDataPacketResult result = mWeldHelper.processArchivedDataPacket(archivedDataPacket);
            boolean requestMoreArchivedData = false;
            switch (result)
            {
                case SUCCESS:
                    // Request archived data again to see if there is any more
                    requestMoreArchivedData = true;
                    break;
                case EMPTY:
                    // There is no more archived data
                    break;
                case FAILURE:
                    Log.e(TAG, "Failed to process archived data packet");
                    // Although this archived data packet was bad, request archived data again
                    // anyway to see if there is any more
                    requestMoreArchivedData = true;
                    break;
            }
            mGetArchivedDataOnAcknowledgment = requestMoreArchivedData;

            // Always send the acknowledgement so that the SC will delete this archived data
            sendAcknowledgement();
        }
    }

    public void processAcknowledgeArchivedDataPacket(@NonNull ResponsePacket packet)
    {
        if (mWaitingForAcknowledgeArchivedDataResponse)
        {
            mWaitingForAcknowledgeArchivedDataResponse = false;
            if (packet.errorCode() == ResponsePacket.ERROR_OK)
            {
                if (mGetArchivedDataOnAcknowledgment)
                {
                    mGetArchivedDataOnAcknowledgment = false;
                    requestArchivedData(false);
                }
            }
        }
    }

    private void requestArchivedData(boolean continuation)
    {
        mStack.send(new RequestArchivedDataPacket(continuation));
    }

    private void sendAcknowledgement()
    {
        mWaitingForAcknowledgeArchivedDataResponse = true;
        mStack.send(new AcknowledgeArchivedDataPacket());
    }

    private byte[] trimBytes(@NonNull byte[] src, int startOffset, int endOffset)
    {
        int length = src.length - startOffset - endOffset;
        byte[] dest = new byte[length];
        System.arraycopy(src, startOffset, dest, 0, length);
        return dest;
    }

    private byte[] concatBytes(@NonNull byte[] first, @NonNull byte[] second)
    {
        byte[] dest = new byte[first.length + second.length];
        System.arraycopy(first, 0, dest, 0, first.length);
        System.arraycopy(second, 0, dest, first.length, second.length);
        return dest;
    }
}
