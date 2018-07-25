package com.linde.scapp.response;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.google.gson.annotations.Expose;
import com.linde.scapp.GasMixture;

import org.apache.cordova.PluginResult;

public class GasMixtureResponse extends Response
{
    @Expose
    private GasMixture gasMixture;

    @Expose
    private Warning warning;

    @NonNull
    public static PluginResult createSuccess(@NonNull GasMixture gasMixture)
    {
        GasMixtureResponse response = new GasMixtureResponse(true, gasMixture, null);
        PluginResult.Status status = PluginResult.Status.OK;
        return Response.create(response, status);
    }

    @NonNull
    public static PluginResult createFailure(@NonNull GasMixture gasMixture, @NonNull Warning warning)
    {
        GasMixtureResponse response = new GasMixtureResponse(false, gasMixture, warning);
        PluginResult.Status status = warning.getCode().getStatus();
        return Response.create(response, status);
    }

    private GasMixtureResponse(boolean success, @NonNull GasMixture gasMixture, @Nullable Warning warning)
    {
        super(success);
        this.gasMixture = gasMixture;
        this.warning = warning;
    }
}
