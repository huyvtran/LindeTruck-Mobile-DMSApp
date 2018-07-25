package com.linde.scapp.packet;

import android.support.annotation.NonNull;
import android.util.Log;

import java.nio.ByteBuffer;
import java.util.Arrays;

public class Packet
{
    public enum Response
    {
        OK(0),
        INVALID_PARAMETER(1),
        SYNCHRONISE_TIME_IGNORED(2),
        CANNOT_EXECUTE_WHEN_WELDING(3),
        DATA_DISCARDED(4);

        private final byte mValue;

        private Response(int value)
        {
            mValue = (byte)value;
        }

        public byte getValue()
        {
            return mValue;
        }
    }

    private static final String TAG = Packet.class.getName();
    private byte[] mBuf;
    public final static byte SYNC_BYTE = (byte)0xAA;
    public final static int HEADER_LENGTH = 5;
    public final static int CHECKSUM_LENGTH = 1;
    public final static int SYNC_POS = 0;
    public final static int COMMAND_POS = 1;
    public final static int COUNTER_POS = 2;
    public final static int DATALENGTH_HIGH_POS = 3;
    public final static int DATALENGTH_LOW_POS = 4;
    private final static int DATA_POS = HEADER_LENGTH;

    public final static byte RESPONSE_BIT = (byte)0x80;

    public final static int TOO_SHORT = -1;

    private int readPos = HEADER_LENGTH;

    protected Packet()
    {

    }

    public  void setData(byte command, byte[] data)
    {
        int dataLength = 0;
        if (data != null)
        {
            dataLength = data.length;
        }
        mBuf = new byte[dataLength + HEADER_LENGTH + CHECKSUM_LENGTH];
        mBuf[SYNC_POS] = SYNC_BYTE;
        mBuf[COMMAND_POS] = command;
        mBuf[DATALENGTH_HIGH_POS] = (byte)(dataLength >> 8);
        mBuf[DATALENGTH_LOW_POS] = (byte)dataLength;
        if (dataLength > 0)
        {
            System.arraycopy(data, 0, mBuf, DATA_POS, dataLength);
        }

        // This does not support multi-byte checksums
        mBuf[mBuf.length-1] = checksum(mBuf);
    }

    public void setCounter(byte counter)
    {
        mBuf[COUNTER_POS] = counter;
        mBuf[mBuf.length-1] = checksum(mBuf);
    }

    protected byte getCounter()
    {
        return mBuf[COUNTER_POS];
    }

    protected Packet(byte[] buf)
    {
        int length = packetLength(buf, 0);
        if (length == TOO_SHORT)
        {
            throw new IllegalArgumentException();
        }
        mBuf = new byte[length];
        System.arraycopy(buf, 0, mBuf, 0, length);
    }

    public static int dataLength(byte[] buf)
    {
        return dataLength(buf, 0);
    }

    public static int dataLength(byte[] buf, int offset)
    {
        int b0 = buf[3 + offset] & 0xff;
        int b1 = buf[4 + offset] & 0xff;
        int dataLength = (b0 << 8) + b1;
        return dataLength;
    }

    public static int packetLength(byte[] buf, int offset)
    {
        // Look at the data length to see how much of this buffer we want.
        int availableLength = buf.length - offset;
        if (availableLength < HEADER_LENGTH)
        {
            return TOO_SHORT;
        }

        int dataLength = dataLength(buf, offset);

        // Hack to cope with bad sync time acknowledgement
        if (dataLength == 0)
        {
            // The old dev board sends AA, 96, 0, 0, C0. The new board sends AA, 96, 0, 0, [0,1,2], checksum.
            // If we match AA,96,0,0 but not C0 in the final byte, then add one byte to length.
            byte check[] = new byte[]{(byte)0xAA, (byte)0x96, 0, 0};
            if (Arrays.equals(check, Arrays.copyOfRange(buf, 0, 4)))
            {
                // Might be a broken sync time acknowledge.
                if (buf[5] == (byte)0xC0)
                {
                    // Old board.
                }
                else
                {
                    // New board with broken firmware
                    dataLength++;
                }
            }
        }
        int length = HEADER_LENGTH + CHECKSUM_LENGTH + dataLength;
        if (availableLength < length)
        {
            return TOO_SHORT;
        }
        return length;
    }

    public byte[] buf()
    {
        return mBuf;
    }

    public static byte checksum(byte[] buf)
    {
        int length = packetLength(buf, 0);
        if (length == TOO_SHORT)
        {
            throw new IllegalArgumentException(" " + Arrays.toString(buf));
        }
        byte checksum = 0;
        for (int i = 0; i < length - 1; i++)
        {
            checksum += buf[i];
        }
        return (byte)-checksum;
    }

    private static boolean isChecksumValid(byte[] buf)
    {
        int length = packetLength(buf, 0);
        if (length == TOO_SHORT)
        {
            throw new IllegalArgumentException();
        }
        return buf[length-1] == checksum(buf);
    }

    public static Packet createPacket(byte[] buf)
    {
        if (!isChecksumValid(buf))
        {
            throw new IllegalArgumentException(Arrays.toString(buf));
        }

        byte commandType = buf[COMMAND_POS];
        Packet ret;
        switch(commandType)
        {
            case LiveDataPacket.COMMAND_ID:
                ret = new LiveDataPacket(buf);
                break;

            case StartPacket.COMMAND_ID:
                ret = new StartPacket(buf);
                break;

            case StopPacket.COMMAND_ID:
                ret = new StopPacket(buf);
                break;

            case SCIDPacket.COMMAND_ID:
                ret = new SCIDPacket(buf);
                break;

            case MachineIDAndNicknamePacket.COMMAND_ID:
                ret = new MachineIDAndNicknamePacket(buf);
                break;

            case UniqueIDPacket.COMMAND_ID:
                ret = new UniqueIDPacket(buf);
                break;

            case StatusPacket.COMMAND_ID:
            case StatusPacket.COMMAND_ID_RESPONSE:
                ret = new StatusPacket(buf);
                break;

            case GasCalibrationPacket.COMMAND_ID:
                ret = new GasCalibrationPacket(buf);
                break;

            default:
                // This should only happen for empty response packets or archived data packets
                if ((commandType & RESPONSE_BIT) != 0)
                {
                    ret = new ResponsePacket(buf);
                }
                else
                {
                    ret = new Packet(buf);
                }
                break;
        }
        return ret;
    }

    public ResponsePacket generateResponse(Response response)
    {
        byte[] buf = new byte[HEADER_LENGTH + 1 + CHECKSUM_LENGTH];
        buf[SYNC_POS] = SYNC_BYTE;
        buf[COMMAND_POS] = (byte)(command() | RESPONSE_BIT);
        buf[COUNTER_POS] = counter();
        buf[3] = 0;
        buf[4] = 1;
        buf[DATA_POS] = response.getValue();
        buf[buf.length-1] = checksum(buf);
        return new ResponsePacket(buf);
    }

    protected byte readByte()
    {
        if (readPos >= mBuf.length)
        {
            throw new IllegalArgumentException("Insufficient data in packet");
        }
        byte value = mBuf[readPos];
        readPos++;
        return value;
    }

    protected long readUnsignedLong(int length)
    {
        long value = readSignedLong(length);
        switch(length)
        {
            case 1:
                value = value & 0xff;
                break;

            case 2:
                value = value & 0xffff;
                break;

            case 4:
                value = value & 0xffffffffL;
                break;

            case 8:
                break;

            default:
                throw new IllegalArgumentException();
        }
        return value;
    }

    private long readSignedLong(int length)
    {
        long value = Packet.readSignedLong(mBuf, readPos, length);
        readPos += length;
        return value;
    }

    public static long readSignedLong(byte[] buf, int readPos, int length)
    {
        ByteBuffer buffer = ByteBuffer.wrap(buf, readPos, length);
        long value;
        switch(length)
        {
            case 1:
                value = buf[readPos];
                break;

            case 2:
                value = buffer.getShort();
                break;

            case 4:
                value = buffer.getInt();
                break;

            case 8:
                value = buffer.getLong();
                break;

            default:
                throw new IllegalArgumentException();
        }
        return value;
    }

    protected String readString()
    {
        // Read until the end of data (excluding 1 byte for checksum). Strip zero padding.
        if (readPos >= mBuf.length -1)
        {
            return "";
        }

        int stringLength = mBuf.length - readPos - 1;
        while(stringLength > 0 && mBuf[readPos + stringLength -1] == 0) {
            stringLength--;
        }

        String s = new String(mBuf, readPos, stringLength);
        readPos = mBuf.length - 1;
        return s;
    }

    @NonNull
    protected String readString(int start, int end)
    {
        int stringLength = end - start;
        while (stringLength > 0 && mBuf[start + stringLength - 1] == 0)
        {
            stringLength--;
        }
        if (stringLength == 0)
        {
            return "";
        }
        return new String(mBuf, start, stringLength);
    }

    protected int readUnsigned(int length)
    {
        long val = readUnsignedLong(length);
        int ival = (int)val;
        return ival;
    }

    protected int readSigned(int length)
    {
        long val = readSignedLong(length);
        int ival = (int)val;
        return ival;
    }

    public byte command()
    {
        return mBuf[COMMAND_POS];
    }

    public byte counter()
    {
        return mBuf[COUNTER_POS];
    }

    public boolean isResponse()
    {
        return false;
    }

    public String description()
    {
        return "Packet: " + command();
    }

    public void matchResponse(ResponsePacket response)
    {
        if (command() != response.originalCommand())
        {
            throw new IllegalStateException("Response does not acknowledge the command sent");
        }
        if (getCounter() != response.getCounter())
        {
            Log.w(TAG, String.format("Warning, counter %d for %s does not match response counter %d", getCounter(), description(), response.getCounter()));
        }
    }

    public boolean attemptSyncFollowing()
    {
        return false;
    }
}
