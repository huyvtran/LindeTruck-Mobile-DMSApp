package com.linde.scapp.response;

import com.google.gson.annotations.Expose;

public class StartStopResponse extends SuccessResponse
{
    @Expose
    private Boolean started;

    @Expose
    private Boolean stopped;

    public StartStopResponse(boolean start)
    {
        super();
        if (start)
        {
            started = true;
        }
        else
        {
            stopped = true;
        }
    }
}
