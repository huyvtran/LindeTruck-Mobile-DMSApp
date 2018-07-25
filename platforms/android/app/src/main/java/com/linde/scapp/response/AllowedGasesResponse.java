package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

import java.util.ArrayList;

public class AllowedGasesResponse extends SuccessResponse
{
    @Expose
    private ArrayList<String> gases;

    public AllowedGasesResponse(@NonNull ArrayList<String> gases)
    {
        this.gases = gases;
    }
}
