package com.capgemini.lindetruck.pda;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Environment;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * Created by jiawei on 18/8/27.
 */

public class Utils {

    public static void createFile() {
        String filePath = Environment.getExternalStorageDirectory().getAbsolutePath() + File.separator + "SeApp/";
        String fileName = "SE_GPS_Logs.txt";
        //String filePath = "/sdcard/LindeTest/";
        //String fileName = "LindeLocation.txt";
        File test = new File(filePath);
        if (!test.exists()) {
            test.mkdir();
        }
        File file = new File(filePath + fileName);
        if (!file.exists()) {
            try {
                file.createNewFile();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static boolean checkProcessRun(Context context, String processName) {
        boolean isRunning = false;
        ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        List<ActivityManager.RunningAppProcessInfo> infos = activityManager.getRunningAppProcesses();
        for (ActivityManager.RunningAppProcessInfo info :infos) {
            if (info.processName.equals(processName)){
                isRunning = true;
            }
        }
        return isRunning;
    }
}
