package com.linde.scapp;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.text.SimpleDateFormat;

public class Utils
{
    // This is used for objects/strings passed between the plugin and app
    // Only the necessary fields (marked @Expose) are included
    public static final Gson sGsonExternal = new GsonBuilder().disableHtmlEscaping()
                                                              .setPrettyPrinting()
                                                              .excludeFieldsWithoutExposeAnnotation()
                                                              .create();

    // This is used for objects/strings used only within the plugin
    // All fields are included
    public static final Gson sGsonInternal = new GsonBuilder().disableHtmlEscaping()
                                                              .setPrettyPrinting()
                                                              .create();

    public static final SimpleDateFormat sJsonDateFormat = new SimpleDateFormat("yyyy-MM-dd-HHmmss");

    public static final SimpleDateFormat sPacketDateFormat = new SimpleDateFormat("yyyy.MM.dd.HH.mm.ss");
}
