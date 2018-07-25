package com.linde.scapp.response;

import android.support.annotation.NonNull;

import com.google.gson.annotations.Expose;

public class NicknameResponse extends SuccessResponse
{
    @Expose
    private final String nickname;

    public NicknameResponse(@NonNull String nickname)
    {
        super();
        this.nickname = nickname;
    }
}
