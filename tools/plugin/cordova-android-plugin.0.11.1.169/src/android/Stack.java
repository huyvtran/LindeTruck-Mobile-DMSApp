package com.linde.scapp;

import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.linde.scapp.packet.AcknowledgeArchivedDataPacket;
import com.linde.scapp.packet.ArchivedDataPacket;
import com.linde.scapp.packet.DeleteMachineIDPacket;
import com.linde.scapp.packet.DeleteNicknamePacket;
import com.linde.scapp.packet.GasCalibrationPacket;
import com.linde.scapp.packet.IdentifyPacket;
import com.linde.scapp.packet.LiveDataPacket;
import com.linde.scapp.packet.MachineIDAndNicknamePacket;
import com.linde.scapp.packet.Packet;
import com.linde.scapp.packet.ReadGasCalibrationPacket;
import com.linde.scapp.packet.ReadMachineIDAndNicknamePacket;
import com.linde.scapp.packet.ReadSCIDPacket;
import com.linde.scapp.packet.ReadUniqueIDPacket;
import com.linde.scapp.packet.RequestArchivedDataPacket;
import com.linde.scapp.packet.RequestStatusPacket;
import com.linde.scapp.packet.ResponsePacket;
import com.linde.scapp.packet.SCIDPacket;
import com.linde.scapp.packet.StartPacket;
import com.linde.scapp.packet.StatusPacket;
import com.linde.scapp.packet.StopPacket;
import com.linde.scapp.packet.SyncTimePacket;
import com.linde.scapp.packet.UniqueIDPacket;
import com.linde.scapp.packet.WriteMachineIDPacket;
import com.linde.scapp.packet.WriteNicknamePacket;
import com.linde.scapp.response.ErrorResponse;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Locale;
import java.util.Queue;

public class Stack
{
    private final String TAG = Stack.class.getSimpleName();

    private static final byte MINIMUM_PROTOCOL_VERSION_MAJOR = 1;
    private static final byte MINIMUM_PROTOCOL_VERSION_MINOR = 7;

    private       ConnectionHelper   mConnectionHelper;
    private       ConnectedThread    mConnectedThread;
    private final IdentifyHelper     mIdentifyHelper;
    private final SCIDHelper         mSCIDHelper;
    private final MachineIDHelper    mMachineIDHelper;
    private final NicknameHelper     mNicknameHelper;
    private final UniqueIDHelper     mUniqueIDHelper;
    private final BatteryHelper      mBatteryHelper;
    private final StatusHelper       mStatusHelper;
    private final WeldHelper         mWeldHelper;
    private final ArchivedDataHelper mArchivedDataHelper;

    private boolean mWaitingForReadScidResponse;
    private boolean mWaitingForReadGasCalibrationResponse;
    private boolean mWaitingForRequestStatusResponse;
    private boolean mTimeSynced;
    private boolean mGetArchivedData;

    private Packet mLastSentPacket;

    private final Queue<Packet> mQueue = new ArrayDeque<Packet>();

    private byte mCounter = 0;

    private byte[] mBuf;

    public Stack(@NonNull Context context, @NonNull ConnectionHelper connectionHelper, @NonNull BluetoothSocket socket)
    {
        this(context);
        mConnectionHelper = connectionHelper;
        mConnectedThread = new ConnectedThread(socket);
        mConnectedThread.start();
        mWaitingForReadScidResponse = true;
        send(new ReadSCIDPacket());
   //     send(new EraseArchivedDataPacket());
    }

    // Protected method which can be made public for testing
    protected Stack(@NonNull Context context)
    {
        mIdentifyHelper = new IdentifyHelper(this);
        mSCIDHelper = new SCIDHelper(this);
        mMachineIDHelper = new MachineIDHelper(this);
        mNicknameHelper = new NicknameHelper(this);
        mUniqueIDHelper = new UniqueIDHelper(this);
        mBatteryHelper = new BatteryHelper();
        mStatusHelper = new StatusHelper(this);
        mWeldHelper = new WeldHelper(context);
        mArchivedDataHelper = new ArchivedDataHelper(this, mWeldHelper);
    }

    public void onDestroy()
    {
        synchronized(this)
        {
            mConnectionHelper = null;
        }
        mIdentifyHelper.onDestroy();
        mSCIDHelper.onDestroy();
        mMachineIDHelper.onDestroy();
        mNicknameHelper.onDestroy();
        mUniqueIDHelper.onDestroy();
        mBatteryHelper.onDestroy();
        mStatusHelper.onDestroy();
        mWeldHelper.onDestroy();
        mArchivedDataHelper.onDestroy();
        resetConnectedThread();
    }

    @NonNull
    public PluginResult identify()
    {
        return mIdentifyHelper.identify();
    }

    @NonNull
    public PluginResult readSCID()
    {
        return mSCIDHelper.readSCID();
    }

    @NonNull
    public PluginResult readMachineID()
    {
        return mMachineIDHelper.readName();
    }

    @NonNull
    public PluginResult writeMachineID(@Nullable JSONArray data)
    {
        return mMachineIDHelper.writeName(data);
    }

    @NonNull
    public PluginResult deleteMachineID()
    {
        return mMachineIDHelper.deleteName();
    }

    @NonNull
    public PluginResult readNickname()
    {
        return mNicknameHelper.readName();
    }

    @NonNull
    public PluginResult writeNickname(@Nullable JSONArray data)
    {
        return mNicknameHelper.writeName(data);
    }

    @NonNull
    public PluginResult deleteNickname()
    {
        return mNicknameHelper.deleteName();
    }

    @NonNull
    public PluginResult readUniqueID()
    {
        return mUniqueIDHelper.readUniqueID();
    }

    @NonNull
    public PluginResult registerForBatteryNotifications(@NonNull CallbackContext callback)
    {
        return mBatteryHelper.registerForBatteryNotifications(callback);
    }

    @NonNull
    public PluginResult deregisterFromBatteryNotifications()
    {
        return mBatteryHelper.deregisterFromBatteryNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForBatteryNotifications()
    {
        return mBatteryHelper.isRegisteredForBatteryNotifications();
    }

    @NonNull
    public PluginResult registerForStatusNotifications(@NonNull CallbackContext callback)
    {
        return mStatusHelper.registerForStatusNotifications(callback);
    }

    @NonNull
    public PluginResult deregisterFromStatusNotifications()
    {
        return mStatusHelper.deregisterFromStatusNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForStatusNotifications()
    {
        return mStatusHelper.isRegisteredForStatusNotifications();
    }

    @NonNull
    public PluginResult registerForWeldingNotifications(@Nullable JSONArray data, @NonNull CallbackContext callback)
    {
        return mWeldHelper.registerForWeldingNotifications(data, callback);
    }

    @NonNull
    public PluginResult deregisterFromWeldingNotifications()
    {
        return mWeldHelper.deregisterFromWeldingNotifications();
    }

    @NonNull
    public PluginResult isRegisteredForWeldingNotifications()
    {
        return mWeldHelper.isRegisteredForWeldingNotifications();
    }

    @NonNull
    public PluginResult getMissedDatasets(@Nullable JSONArray data)
    {
        return mWeldHelper.getMissedDatasets(data);
    }

    @NonNull
    public PluginResult getMissedDataset(@Nullable JSONArray data)
    {
        return mWeldHelper.getMissedDataset(data);
    }

    @NonNull
    public PluginResult getUnassociatedDatasets()
    {
        return mWeldHelper.getUnassociatedDatasets();
    }

    @NonNull
    public PluginResult getUnassociatedDataset(@Nullable JSONArray data)
    {
        return mWeldHelper.getUnassociatedDataset(data);
    }

    public void send(Packet packet)
    {
        if (mLastSentPacket != null)
        {
            // Add to the queue of packets to send.
            mQueue.add(packet);
            return;
        }

        packet.setCounter(mCounter);
        mCounter++;
        mLastSentPacket = packet;
        if (mConnectedThread != null)
        {
            mConnectedThread.send(packet.buf());
        }
    }

    private synchronized void resetConnectedThread()
    {
        if (mConnectedThread != null)
        {
            mConnectedThread.cancel();
            mConnectedThread = null;
        }
    }

    private void handleDataWritten(int lengthWritten)
    {
        if (lengthWritten == -1)
        {
            // Failed to write
            // Could retry, but simplest thing is just to disconnect
            synchronized (this)
            {
                if (mConnectionHelper != null)
                {
                    PluginResult result = ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR, "Failed to write data");
                    mConnectionHelper.stackRequestsDisconnect(result);
                }
            }
            mLastSentPacket = null;
        }
    }

    // Protected method which can be made public for testing
    protected void handleDataRead(byte[] buf)
    {
        // Accumulate all unparsed data in mBuf
        if (mBuf != null)
        {
            byte[] nBuf = new byte[buf.length + mBuf.length];
            System.arraycopy(mBuf, 0, nBuf, 0, mBuf.length);
            System.arraycopy(buf, 0, nBuf, mBuf.length, buf.length);
            mBuf = nBuf;
        }
        else
        {
            mBuf = buf;
        }

        int offset = 0;
        while(offset < mBuf.length)
        {
            int length = Packet.packetLength(mBuf, offset);
            if (length == Packet.TOO_SHORT)
            {
                break;
            }
            byte[] data = Arrays.copyOfRange(mBuf, offset, offset + length);
            Packet packet = Packet.createPacket(data);
            offset = offset + packet.buf().length;
            processPacket(packet);
        }

        // Clear out all read data
        if (offset == mBuf.length)
        {
            mBuf = null;
        }
        else
        {
            mBuf = Arrays.copyOfRange(mBuf, offset, mBuf.length);
        }
    }

    private void processPacket(Packet packet)
    {
        if (packet.isResponse())
        {
            // Match against what we last sent
            if (mLastSentPacket == null)
            {
                throw new IllegalStateException();
            }
            ResponsePacket response = (ResponsePacket) packet;
            mLastSentPacket.matchResponse(response);
            mLastSentPacket = null;

            if (response.originalCommand() == ReadSCIDPacket.COMMAND_ID && packet.command() == SCIDPacket.COMMAND_ID)
            {
                SCIDPacket scidPacket = (SCIDPacket) packet;
                if (mWaitingForReadScidResponse)
                {
                    mWaitingForReadScidResponse = false;
                    if (isProtocolVersionValid(scidPacket))
                    {
                        mWaitingForReadGasCalibrationResponse = true;
                        send(new ReadGasCalibrationPacket());
                    }
                    else
                    {
                        String protocolMajor = String.format(Locale.getDefault(), "%d", scidPacket.getProtocolMajorVersion());
                        String protocolMinor = String.format(Locale.getDefault(), "%d", scidPacket.getProtocolMinorVersion());
                        String minProtocolMajor = String.format(Locale.getDefault(), "%d",
                                MINIMUM_PROTOCOL_VERSION_MAJOR);
                        String minProtocolMinor = String.format(Locale.getDefault(), "%d",
                                MINIMUM_PROTOCOL_VERSION_MINOR);
                        String message = "The SC is running protocol version " + protocolMajor + "." + protocolMinor + " but this app only supports protocol version >= " + minProtocolMajor + "." + minProtocolMinor;
                        PluginResult result = ErrorResponse.create(ErrorResponse.Code.PROTOCOL_NOT_COMPATIBLE, message);
                        mConnectionHelper.stackRequestsDisconnect(result);
                    }
                }
                else
                {
                    mSCIDHelper.processSCIDPacket(scidPacket);
                }
            }
            else if (response.originalCommand() == ReadGasCalibrationPacket.COMMAND_ID && packet.command() == GasCalibrationPacket.COMMAND_ID)
            {
                if (mWaitingForReadGasCalibrationResponse)
                {
                    mWaitingForReadGasCalibrationResponse = false;
                    mWeldHelper.processGasCalibrationPacket((GasCalibrationPacket) packet);
                    mWaitingForRequestStatusResponse = true;
                    send(new RequestStatusPacket());
                }
            }
            else if (response.originalCommand() == RequestStatusPacket.COMMAND_ID && packet.command() == StatusPacket.COMMAND_ID_RESPONSE)
            {
                StatusPacket statusPacket = (StatusPacket) packet;
                if (mWaitingForRequestStatusResponse)
                {
                    mWaitingForRequestStatusResponse = false;
                    // If the SC is not currently welding then first send a sync time packet and then
                    // get archived data (if available)
                    // Otherwise do nothing  for now and we will attempt to send a sync time packet later
                    if (!statusPacket.isWelding())
                    {
                        mGetArchivedData = statusPacket.hasArchivedData();
                        send(new SyncTimePacket());
                    }
                }
                else
                {
                    mBatteryHelper.processStatusPacket(statusPacket);
                    mStatusHelper.processStatusPacket(statusPacket);
                }
            }
            else if (response.originalCommand() == SyncTimePacket.COMMAND_ID)
            {
                if (response.errorCode() == ResponsePacket.ERROR_OK)
                {
                    mTimeSynced = true;
                    if (mGetArchivedData)
                    {
                        mGetArchivedData = false;
                        mArchivedDataHelper.startGettingArchivedData();
                    }
                }
            }
            else if (response.originalCommand() == AcknowledgeArchivedDataPacket.COMMAND_ID)
            {
                mArchivedDataHelper.processAcknowledgeArchivedDataPacket(response);
            }
            else if (response.originalCommand() == IdentifyPacket.COMMAND_ID)
            {
                mIdentifyHelper.processIdentifyPacketResponse();
            }
            else if (response.originalCommand() == ReadMachineIDAndNicknamePacket.COMMAND_ID && packet.command() == MachineIDAndNicknamePacket.COMMAND_ID)
            {
                mMachineIDHelper.processMachineIDAndNicknamePacket((MachineIDAndNicknamePacket) packet);
                mNicknameHelper.processMachineIDAndNicknamePacket((MachineIDAndNicknamePacket) packet);
            }
            else if (response.originalCommand() == WriteMachineIDPacket.COMMAND_ID)
            {
                mMachineIDHelper.processWriteResponse(response);
            }
            else if (response.originalCommand() == DeleteMachineIDPacket.COMMAND_ID)
            {
                mMachineIDHelper.processDeleteResponse(response);
            }
            else if (response.originalCommand() == WriteNicknamePacket.COMMAND_ID)
            {
                mNicknameHelper.processWriteResponse(response);
            }
            else if (response.originalCommand() == DeleteNicknamePacket.COMMAND_ID)
            {
                mNicknameHelper.processDeleteResponse(response);
            }
            else if (response.originalCommand() == ReadUniqueIDPacket.COMMAND_ID && packet.command() == UniqueIDPacket.COMMAND_ID)
            {
                mUniqueIDHelper.processUniqueIDPacket((UniqueIDPacket) packet);
            }
            else if (response.originalCommand() == RequestArchivedDataPacket.COMMAND_ID_NEW && packet.command() == ArchivedDataPacket.COMMAND_ID_NEW)
            {
                mArchivedDataHelper.processArchivedDataPacket(response, false);
            }
            else if (response.originalCommand() == RequestArchivedDataPacket.COMMAND_ID_CONTINUATION && packet.command() == ArchivedDataPacket.COMMAND_ID_CONTINUATION)
            {
                mArchivedDataHelper.processArchivedDataPacket(response, true);
            }
//            else if (response.originalCommand() == EraseArchivedDataPacket.COMMAND_ID)
//            {
//                if (response.errorCode() != ResponsePacket.ERROR_OK)
//                {
//                    throw new RuntimeException("Error erasing archived data");
//                }
//                synchronized (this)
//                {
//                    if (mConnectionHelper != null)
//                    {
//                        PluginResult result = ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR, "Erased archived data");
//                        mConnectionHelper.stackRequestsDisconnect(result);
//                    }
//                }
//            }
        }
        else
        {
            if (packet.command() == StatusPacket.COMMAND_ID)
            {
                mBatteryHelper.processStatusPacket((StatusPacket) packet);
                mStatusHelper.processStatusPacket((StatusPacket) packet);
            }
            else
            {
                Boolean success = null;
                if (packet.command() == StartPacket.COMMAND_ID)
                {
                    mWeldHelper.processStartPacket((StartPacket)packet);
                    success = true;
                }
                else if (packet.command() == LiveDataPacket.COMMAND_ID)
                {
                    LiveDataPacket liveDataPacket = (LiveDataPacket) packet;
                    mBatteryHelper.processLiveDataPacket(liveDataPacket);
                    mWeldHelper.processLiveDataPacket(liveDataPacket);
                    success = true;
                }
                else if (packet.command() == StopPacket.COMMAND_ID)
                {
                    success = mWeldHelper.processStopPacket((StopPacket)packet);
                }
                if (success != null)
                {
                    Packet response;
                    if (success)
                    {
                        // Respond with a success acknowledgement
                        response = packet.generateResponse(Packet.Response.OK);
                    }
                    else
                    {
                        // Respond with a THROWNAWAY acknowledgement
                        response = packet.generateResponse(Packet.Response.DATA_DISCARDED);
                    }
                    sendResponse(response);

                    if (!mTimeSynced && packet.attemptSyncFollowing())
                    {
                        send(new SyncTimePacket());
                    }
                }
            }
        }

        // Now grab one from the queue if we are idle
        if (mLastSentPacket == null && !mQueue.isEmpty())
        {
            Packet nextPacket = mQueue.remove();
            send(nextPacket);
        }
    }

    private boolean isProtocolVersionValid(@NonNull SCIDPacket packet)
    {
        if (packet.getProtocolMajorVersion() < MINIMUM_PROTOCOL_VERSION_MAJOR)
        {
            return false;
        }
        if (packet.getProtocolMajorVersion() > MINIMUM_PROTOCOL_VERSION_MAJOR)
        {
            return true;
        }
        return (packet.getProtocolMinorVersion() >= MINIMUM_PROTOCOL_VERSION_MINOR);
    }

    // Protected method which can be overridden for testing
    protected void sendResponse(@NonNull Packet response)
    {
        if (mConnectedThread != null)
        {
            mConnectedThread.send(response.buf());
        }
    }

    private class ConnectedThread extends Thread
    {
        private final String TAG = ConnectedThread.class.getSimpleName();

        private final BluetoothSocket mSocket;
        private final InputStream     mInput;
        private final OutputStream    mOutput;

        public ConnectedThread(@NonNull BluetoothSocket socket)
        {
            mSocket = socket;
            InputStream tmpIn = null;
            OutputStream tmpOut = null;
            try
            {
                tmpIn = socket.getInputStream();
                tmpOut = socket.getOutputStream();
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
            mInput = tmpIn;
            mOutput = tmpOut;
        }

        // This is on the data reading thread.
        public void run()
        {
            if (mInput == null || mOutput == null)
            {
                synchronized (this)
                {
                    if (mConnectionHelper != null)
                    {
                        PluginResult result = ErrorResponse.create(ErrorResponse.Code.OTHER_ERROR, "Failed to read data");
                        mConnectionHelper.stackRequestsDisconnect(result);
                    }
                }
                return;
            }

            byte[] buf = new byte[256];
            int length;
            while (true)
            {
                try
                {
                    // Read up to the length of the buffer. Return -1 if EOF.
                    length = mInput.read(buf);
                    if (length == -1)
                    {
                        throw new IOException();
                    }
                    byte[] sendBuf = new byte[length];
                    System.arraycopy(buf, 0, sendBuf, 0, length);
                    handleDataRead(sendBuf);
                }
                catch (IOException e)
                {
                    // This catch section is executed when the socket is closed
                    // No need to do anything here: closing the socket via the user calling
                    // disconnect() or stopPlugin() on the plugin, or by bluetooth being switched
                    // off is handled by ConnectionHelper
                    break;
                }
            }
        }

        public void send(byte[] data)
        {
            try
            {
                // There is no need to check if mOutput is null
                // When the thread is started, if mOutput was null here then the thread would have reset
                mOutput.write(data);
                handleDataWritten(data.length);
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
                handleDataWritten(-1);
            }
        }

        public void cancel()
        {
            try
            {
                if (mInput != null)
                {
                    mInput.close();
                }
                if (mOutput != null)
                {
                    mOutput.close();
                }
                mSocket.close();
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
        }
    }
}
