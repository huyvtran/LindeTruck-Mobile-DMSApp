package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;
import com.linde.scapp.WeldProgressData;

public class WeldProgressResponse extends SuccessResponse
{
    @Expose
    private final WeldProgressData progress;

    public WeldProgressResponse(@NonNull WeldProgressData data)
    {
        super();
        progress = data;
    }
}
