package com.linde.scapp.response;

import com.google.gson.annotations.Expose;

public class ResultResponse extends SuccessResponse
{
    @Expose
    private final boolean result;

    public ResultResponse(boolean result)
    {
        super();
        this.result = result;
    }
}
