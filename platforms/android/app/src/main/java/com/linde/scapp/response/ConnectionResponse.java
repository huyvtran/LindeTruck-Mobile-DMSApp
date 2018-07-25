package com.linde.scapp.response;

import com.google.gson.annotations.Expose;
import com.linde.scapp.ConnectionHelper;

public class ConnectionResponse extends SuccessResponse
{
    @Expose
    private Boolean disconnected;

    @Expose
    private Boolean bonding;

    @Expose
    private Boolean connecting;

    @Expose
    private Boolean connected;

    public ConnectionResponse(ConnectionHelper.ConnectionState connectionState)
    {
        super();
        switch (connectionState)
        {
            case DISCONNECTED:
                disconnected = true;
                break;
            case BONDING:
                bonding = true;
                break;
            case CONNECTING:
                connecting = true;
                break;
            case CONNECTED:
                connected = true;
                break;
        }
    }
}
