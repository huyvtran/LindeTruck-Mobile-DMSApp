package com.capgemini.printDemo;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.util.Log;
import com.capgemini.printDemo.printer.JQPrinter;
import com.capgemini.printDemo.printer.Port;
import com.capgemini.printDemo.printer.esc.ESC;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Set;

/**
 * Created by jiawei on 18/10/7.
 */

public class Printer extends CordovaPlugin {
    BluetoothAdapter bluetoothAdapter = null;
    CallbackContext mContext = null;
    JQPrinter printer =  null;
    JSONArray devices = null;

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        mContext = callbackContext;
        if ("checkBlueTooth".equals(action)){
            checkBlueToothState();
            return true;
        }else if ("getBlueToothDevices".equals(action)){
            getUsefulDevices();
            return true;
        }else if ("connectBlueToothDevice".equals(action)){
            connectDevice((String) args.get(0));
            return true;
        }else if ("printTicket".equals(action)){
            printTicket(args);
            return true;
        }
        return false;
    }

    private void getUsefulDevices() throws JSONException {
        devices = new JSONArray();
        Set<BluetoothDevice> PairedDevices = bluetoothAdapter.getBondedDevices();
        if (PairedDevices.size() > 0) {
            for (BluetoothDevice device : PairedDevices) {
                String device_info = device.getName() + "-" + device.getAddress();
                devices.put(device_info);
            }
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK,devices);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
        }else{
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","没有匹配设备");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
        }

    }

    /**
     * 连接设备
     * @param btDeviceString
     */
    private void connectDevice(String btDeviceString) throws JSONException {
        if (btDeviceString != null)
        {
            if(bluetoothAdapter.isDiscovering()) bluetoothAdapter.cancelDiscovery();
            if (printer != null)
            {
                printer.close();
            }

            printer = new JQPrinter(bluetoothAdapter,btDeviceString);

            if (!printer.open(JQPrinter.PRINTER_TYPE.ULT113x))
            {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("status",1);
                jsonObject.put("message","打印机Open失败");
                PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
                pluginResult.setKeepCallback(true);
                mContext.sendPluginResult(pluginResult);
                //Toast.makeText(MainActivity.this, "打印机Open失败", Toast.LENGTH_SHORT).show();
                return;
            }else{
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("status",0);
                jsonObject.put("message","打印机正常运行");
                PluginResult pluginResult = new PluginResult(PluginResult.Status.OK,jsonObject);
                pluginResult.setKeepCallback(true);
                mContext.sendPluginResult(pluginResult);
            }

            if (!printer.wakeUp())
                return;
        }
    }

    /**
     * 打印小票
     * @param args
     */
    private void printTicket(JSONArray args) throws JSONException {
        if (printer == null)
        {
            Log.e("JQ", "printer null");
            return;
        }
        if (!getPrinterState())
        {
            return ;
        }
        printESC(args);
        int i=0;
        for (i = 0; i < 100; i++) {
            if (!printer.getPrinterState(5000)) {
                try {Thread.sleep(1000);} catch (InterruptedException e) {}
                continue;
            }
            if (printer.printerInfo.isCoverOpen) {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("status",1);
                jsonObject.put("message","打印机纸仓盖未关闭");

                PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
                pluginResult.setKeepCallback(true);
                mContext.sendPluginResult(pluginResult);
                //Toast.makeText(this, "打印机纸仓盖未关闭", Toast.LENGTH_SHORT).show();
                return;
            } else if (printer.printerInfo.isNoPaper) {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("status",1);
                jsonObject.put("message","打印机缺纸");

                PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
                pluginResult.setKeepCallback(true);
                mContext.sendPluginResult(pluginResult);
                //Toast.makeText(this, "打印机缺纸", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!printer.printerInfo.isPrinting) //表示打印结束
            {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("status",0);
                jsonObject.put("message","打印结束");

                PluginResult pluginResult = new PluginResult(PluginResult.Status.OK,jsonObject);
                pluginResult.setKeepCallback(true);
                mContext.sendPluginResult(pluginResult);
                //Toast.makeText(this, "打印结束", Toast.LENGTH_SHORT).show();
                break;
            }
        }
    }

    private void checkBlueToothState() throws JSONException {
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","本机没有找到蓝牙硬件或驱动");

            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "本机没有找到蓝牙硬件或驱动！", Toast.LENGTH_SHORT).show();
            return;
        }
        if (!bluetoothAdapter.isEnabled()){
            bluetoothAdapter.enable();
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",0);
            jsonObject.put("message","本地蓝牙已打开");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "本地蓝牙已打开", Toast.LENGTH_SHORT).show();
        }
        else
        {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",0);
            jsonObject.put("message","本地蓝牙已打开");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.OK,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "本地蓝牙已打开", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean printESC(JSONArray args) {
        if (!printer.wakeUp())
            return false;
        printer.esc.text.printOut(JQPrinter.ALIGN.LEFT, ESC.FONT_HEIGHT.x16, true,
                ESC.TEXT_ENLARGE.HEIGHT_WIDTH_DOUBLE, "林德（中国）叉车有限公司");
        printer.esc.feedDots(4);
        printer.esc.text.printOut(JQPrinter.ALIGN.CENTER, ESC.FONT_HEIGHT.x16, true,
                ESC.TEXT_ENLARGE.HEIGHT_WIDTH_DOUBLE, "客户服务工作单");
        printer.esc.text.printOut("客户名称：","达创科技（东莞）有限公司");
        printer.esc.text.printOut("客户号：","0090392933/0090370387");
        printer.esc.text.printOut("客户地址："," 广东东莞东莞市石街镇新城区");
        printer.esc.text.printOut("工作单号："," 000500948111");
        printer.esc.text.printOut("通知单号："," 000300884514");
        printer.esc.text.printOut("发货单号：\n","");
        printer.esc.text.printOut("叉车型号："," 116");
        printer.esc.text.printOut("工作小时："," 0.0");
        printer.esc.text.printOut("服务时间统计：","");
        printer.esc.text.printOut("工程师  日期  工作起止时间  旅行起止时间  公里数");
        printer.esc.feedDots(4);
        printer.esc.text.printOut("配件费参见发货清单：","达创科技（东莞）有限公司");
        printer.esc.text.printOut("报修需求 \n","   达创科技（东莞）有限公司");
        printer.esc.text.printOut("故障描述：\n","xxxxxx");
        printer.esc.feedDots(4);
        printer.esc.text.printOut("检查过程：\n","9000     叉车插头断裂");
        printer.esc.text.printOut("故障判断：\n","9000     需要更换插头");
        printer.esc.text.printOut("服务内容：\n","9000     检查检查／待维修");
        printer.esc.text.printOut("结果及建议：\n","工作完成");
        printer.esc.text.printOut("负责工程师：","张永胜（00040929");
        printer.esc.text.printOut("工程师签名及日期：     客户签名及日期：","");
        printer.esc.feedLines(3);
        return true;
    }

    private boolean getPrinterState() throws JSONException {
        if( printer.getPortState() != Port.PORT_STATE.PORT_OPEND)
        {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","蓝牙错误");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "蓝牙错误", Toast.LENGTH_SHORT).show();
            return false;
        }

        if (!printer.getPrinterState(3000))
        {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","获取打印机状态失败");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "获取打印机状态失败", Toast.LENGTH_SHORT).show();
            return false;
        }

        if (printer.printerInfo.isCoverOpen)
        {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","打印机纸仓盖未关闭");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "打印机纸仓盖未关闭", Toast.LENGTH_SHORT).show();
            return false;
        }
        else if (printer.printerInfo.isNoPaper)
        {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status",1);
            jsonObject.put("message","打印机缺纸");
            PluginResult pluginResult = new PluginResult(PluginResult.Status.ERROR,jsonObject);
            pluginResult.setKeepCallback(true);
            mContext.sendPluginResult(pluginResult);
            //Toast.makeText(this, "打印机缺纸", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }
}
