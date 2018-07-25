package com.linde.scapp.response;

import android.bluetooth.BluetoothDevice;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class DeviceResponse extends SuccessResponse
{
    private class Device
    {
        @Expose
        private final String name;

        @Expose
        private final String address;

        @Expose
        private final Integer rssi;

        public Device(@NonNull BluetoothDevice bluetoothDevice, @Nullable Integer rssi)
        {
            String name = bluetoothDevice.getName();
            if (name == null)
            {
                name = "";
            }
            this.name = name;
            this.address = bluetoothDevice.getAddress();
            this.rssi = rssi;
        }
    }

    @Expose
    private final Device device;

    @Expose
    private final List<Device> devices;

    public DeviceResponse(@NonNull BluetoothDevice bluetoothDevice, int rssi)
    {
        super();
        device = new Device(bluetoothDevice, rssi);
        devices = null;
    }

    public DeviceResponse(@Nullable Set<BluetoothDevice> bluetoothDevices)
    {
        super();
        device = null;
        List<Device> devices = new ArrayList<Device>();
        if (bluetoothDevices != null)
        {
            for (BluetoothDevice bluetoothDevice : bluetoothDevices)
            {
                devices.add(new Device(bluetoothDevice, null));
            }
        }
        this.devices = devices;
    }
}
