package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import java.util.List;

public class WeldDatasetsResponse extends SuccessResponse
{
    @Expose
    private final List<String> datasets;

    public WeldDatasetsResponse(@NonNull List<String> datasets)
    {
        super();
        this.datasets = datasets;
    }
}
