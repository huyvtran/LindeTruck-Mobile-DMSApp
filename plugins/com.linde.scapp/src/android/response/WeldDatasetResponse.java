package com.linde.scapp.response;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;
import com.linde.scapp.WeldDataset;

public class WeldDatasetResponse extends SuccessResponse
{
    @Expose
    private final WeldDataset dataset;

    @Expose
    private final Warning warning;

    public WeldDatasetResponse(@NonNull WeldDataset dataset)
    {
        this(dataset, null);
    }

    public WeldDatasetResponse(@NonNull WeldDataset dataset, @Nullable Warning warning)
    {
        super();
        if (!dataset.isFinished())
        {
            throw new RuntimeException("Dataset is not finished");
        }
        this.dataset = dataset;
        this.warning = warning;
    }
}
