package com.capgemini.lindetruck.pda;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.baidu.location.BDAbstractLocationListener;
import com.baidu.location.BDLocation;
import com.baidu.location.LocationClient;
import com.baidu.location.LocationClientOption;

import java.io.File;
import java.io.RandomAccessFile;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by jiawei on 18/8/25.
 */

public class SingleService extends Service {

    public LocationClient mLocationClient = null;
    private MyLocationListener myListener = new MyLocationListener();

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        mLocationClient.restart();
        return  START_STICKY;
    }

    @Override
    public void onCreate() {
        Utils.createFile();
        mLocationClient = new LocationClient(getApplicationContext());
        mLocationClient.registerLocationListener(myListener);
        LocationClientOption option = new LocationClientOption();
        option.setLocationMode(LocationClientOption.LocationMode.Hight_Accuracy);
        option.setCoorType("bd09ll");
        option.setScanSpan(20*1000);
        option.setOpenGps(true);
        option.setLocationNotify(true);
        option.setIgnoreKillProcess(false);
        option.SetIgnoreCacheException(false);
        option.setWifiCacheTimeOut(5 * 60 * 1000);
        option.setEnableSimulateGps(false);
        mLocationClient.setLocOption(option);
        mLocationClient.start();

        //Build.VERSION.SDK_INT>=Build.VERSION_CODES.O notificationChannel
        if (Build.VERSION.SDK_INT>=Build.VERSION_CODES.O){
            String CHANNEL_ID = "1";
            String CHANNEL_NAME = "channel_name";
            NotificationChannel notificationChannel = new NotificationChannel(CHANNEL_ID,CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW);
            notificationChannel.setDescription("xxxxxx");
            NotificationManager mNotificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            mNotificationManager.createNotificationChannel(notificationChannel);

            Notification.Builder builder = new Notification.Builder (getBaseContext().getApplicationContext());
            Intent nfIntent = new Intent(getApplicationContext(), MainActivity.class);
            builder.setContentIntent(PendingIntent.getActivity(getBaseContext(), 0, nfIntent, 0)) // 设置PendingIntent
                    .setContentTitle("正在进行后台定位") // 设置下拉列表里的标题
                    .setSmallIcon(R.drawable.sf__icon) // 设置状态栏内的小图标
                    .setContentText("后台定位通知") // 设置上下文内容
                    .setChannelId(CHANNEL_ID)
                    .setAutoCancel(true)
                    .setWhen(System.currentTimeMillis()); // 设置该通知发生的时间
            Notification notification = null;
            notification = builder.build();
            notification.defaults = Notification.DEFAULT_SOUND; //设置为默认的声音
            mLocationClient.enableLocInForeground(1001, notification);// 调起前台定位
        }else{
            Intent notificationIntent = new Intent(getApplicationContext(), MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, notificationIntent, 0);
            NotificationCompat.Builder mNotifyBuilder = new NotificationCompat.Builder(SingleService.this)
                    .setSmallIcon(R.drawable.sf__icon)
                    .setTicker("xxx")
                    .setWhen(System.currentTimeMillis())
                    .setContentTitle(getString(R.string.app_name))
                    .setContentText("后台定位通知")
                    .setContentIntent(pendingIntent);
            Notification notification = mNotifyBuilder.build();
            startForeground(222, notification);
        }
    }



    public class MyLocationListener extends BDAbstractLocationListener {
        @Override
        public void onReceiveLocation(BDLocation location) {
            double latitude = location.getLatitude();
            double longitude = location.getLongitude();
            //File file = new File("/sdcard/LindeTest/MultipleServices.txt");
            File file = new File(Environment.getExternalStorageDirectory().getAbsolutePath()+"/SeApp/SE_GPS_Logs.txt");
            SimpleDateFormat df = new SimpleDateFormat("yyyy年MM月dd日 HH:mm:ss");
            String strContent = "latitude:"+latitude+"longitude:"+longitude+"Date:"+df.format(new Date(System.currentTimeMillis()))+"\r\n";
            Log.d("Linde", "latitude:"+latitude+"longitude:"+longitude+"Date:"+df.format(new Date(System.currentTimeMillis())));
            RandomAccessFile raf = null;
            try {
                raf = new RandomAccessFile(file, "rwd");
                raf.seek(file.length());
                raf.write(strContent.getBytes());
                raf.close();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

}
