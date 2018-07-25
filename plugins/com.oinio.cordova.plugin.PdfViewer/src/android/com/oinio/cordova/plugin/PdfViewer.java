package com.oinio.cordova.plugin;

import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.apache.cordova.BuildConfig;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaResourceApi;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

public class PdfViewer extends CordovaPlugin {

    private static final String TAG = "PdfViewerPlugin";

    private static final String ACTION_OPEN_PDF = "openPDF";

    private static final String PDF = "application/pdf";

    public static final class Result {
        static final String SUPPORTED = "supported";
        static final String STATUS = "status";
        static final String MESSAGE = "message";
        static final String DETAILS = "details";
        static final String MISSING_APP_ID = "missingAppId";
    }

    private static final int REQUEST_CODE_OPEN = 1000;

    private static final int REQUEST_CODE_INSTALL = 1001;

    private CallbackContext callbackContext;

    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        clearTempFiles();
    }

    public void onDestroy() {
        clearTempFiles();
        super.onDestroy();
    }

    public void onReset() {
        clearTempFiles();
        super.onReset();
    }

    /**
     * Executes the request and returns a boolean.
     *
     * @param action          The action to execute.
     * @param argsArray       JSONArray of arguments for the plugin.
     * @param callbackContext The callback context used when calling back into JavaScript.
     * @return boolean.
     */
    public boolean execute(final String action, final JSONArray argsArray, final CallbackContext callbackContext)
            throws JSONException {
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    doExecute(action, argsArray, callbackContext);
                } catch (Exception e) {
                    handleException(e, action, argsArray, callbackContext);
                }
            }
        });
        return true;
    }

    private void handleException(Exception e, String action, JSONArray argsArray, CallbackContext callbackContext) {
        e.printStackTrace();

        try {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal());
            errorObj.put(Result.MESSAGE, e.getMessage());
            errorObj.put(Result.DETAILS, getStackTrace(e));
            callbackContext.error(errorObj);
        } catch (JSONException e1) {
            // should never happen
            e1.printStackTrace();
            callbackContext.error(e.getMessage());
        }
    }

    private String getStackTrace(Throwable t) {
        if (t == null)
            return "";
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        t.printStackTrace(pw);

        try {
            pw.close();
            sw.flush();
            sw.close();
        } catch (Exception e) {
            // ignorieren
        }

        return sw.toString();
    }

    private void doExecute(String action, JSONArray argsArray, CallbackContext callbackContext)
            throws JSONException {
        if (ACTION_OPEN_PDF.equals(action)) {
            String url = argsArray.getString(0);
            this._open(url, PDF, callbackContext);
        } else {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS,
                    PluginResult.Status.INVALID_ACTION.ordinal()
            );
            errorObj.put(Result.MESSAGE, "Invalid action '" + action + "'");
            callbackContext.error(errorObj);
        }
    }

    /**
     * Called when a previously started Activity ends
     *
     * @param requestCode The request code originally supplied to startActivityForResult(),
     *                    allowing you to identify who this result came from.
     * @param resultCode  The integer result code returned by the child activity through its setResult().
     * @param intent      An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (this.callbackContext == null)
            return;

        if (requestCode == REQUEST_CODE_OPEN) {

            //remove tmp file
            clearTempFiles();

            try {

                // send closed event
                JSONObject successObj = new JSONObject();
                successObj.put(Result.STATUS, PluginResult.Status.NO_RESULT.ordinal());
                this.callbackContext.success(successObj);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            this.callbackContext = null;
        } else if (requestCode == REQUEST_CODE_INSTALL) {

            // send success event
            this.callbackContext.success();
            this.callbackContext = null;
        }
    }

    private void _open(String url, String contentType, CallbackContext callbackContext)
            throws JSONException {

        clearTempFiles();

        File file = getAccessibleFile(url);

        if (file != null && file.exists() && file.isFile()) {
            try {

                Log.i(TAG, "Build.VERSION.SDK_INT:" + Build.VERSION.SDK_INT);
                Log.i(TAG, "Build.VERSION_CODES.JELLY_BEAN:" + Build.VERSION_CODES.JELLY_BEAN);
                Log.i(TAG, "file path:" + file.getAbsolutePath());
                Log.i(TAG, "file length:" + file.length());
                Log.i(TAG, "File Provider:" + cordova.getActivity().getPackageName() + "." + TAG + ".fileprovider");

                Intent intent = new Intent(Intent.ACTION_VIEW);

                // @see http://stackoverflow.com/questions/2780102/open-another-application-from-your-own-intent
                //intent.addCategory(Intent.CATEGORY_EMBED);

                if (newApi()) {
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    Uri contentUri = FileProvider.getUriForFile(
                            webView.getContext(),
                            cordova.getActivity().getPackageName() + "." + TAG
                                    + ".fileprovider",
                            file);
                    intent.setDataAndType(contentUri, contentType);
                } else {
                    intent.setDataAndType(Uri.fromFile(file), contentType);
                }

//                Uri path = null;
//                path = Uri.fromFile(file);
//                if (Build.VERSION.SDK_INT < ANDROID_VERSION_CODE_N) {
//                    path = Uri.fromFile(file);
//                } else {
//                    path = FileProvider.getUriForFile(cordova.getActivity().getApplicationContext(),
//                            cordova.getActivity().getPackageName() + ".provider",
//                            file);
//                }

                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                //intent.putExtra(this.getClass().getName(), viewerOptions);

                //activity needs fully qualified name here
                //intent.setComponent(new ComponentName(packageId, packageId + "." + activity));

                this.callbackContext = callbackContext;
                this.cordova.startActivityForResult(this, intent, REQUEST_CODE_OPEN);

                // send shown event
                JSONObject successObj = new JSONObject();
                successObj.put(Result.STATUS, PluginResult.Status.OK.ordinal());
                PluginResult result = new PluginResult(PluginResult.Status.OK, successObj);

                // need to keep callback for close event
                result.setKeepCallback(true);
                callbackContext.sendPluginResult(result);
            } catch (android.content.ActivityNotFoundException e){
                JSONObject errorObj = new JSONObject();
                errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal());
                errorObj.put(Result.MESSAGE, "Activity not found: " + e.getMessage());
                callbackContext.error(errorObj);
            }
        } else {
            JSONObject errorObj = new JSONObject();
            errorObj.put(Result.STATUS, PluginResult.Status.ERROR.ordinal());
            errorObj.put(Result.MESSAGE, "File not found");
            callbackContext.error(errorObj);
        }
    }

    private void copyFile(File src, File target) throws IOException {
        copyFile(new FileInputStream(src), target);
    }

    private void copyFile(InputStream in, File target) throws IOException {

        OutputStream out = null;

        //create tmp folder if not present
        if (!target.getParentFile().exists() && !target.getParentFile()
                .mkdirs())
            throw new IOException("Cannot create path " + target.getParentFile()
                    .getAbsolutePath()
            );
        try {
            out = new FileOutputStream(target);
            byte[] buffer = new byte[1024];
            int read;
            while ((read = in.read(buffer)) != -1)
                out.write(buffer, 0, read);
        } catch (IOException e) {
            Log.e(TAG, "Failed to copy stream to " + target.getAbsolutePath(), e);
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    // NOOP
                }
            }
            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    // NOOP
                }
            }
        }
    }

    private int tempCounter = 0;

    private File getSharedTempFile(String name) {
        return new File(getSharedTempDir(), (tempCounter++) + "." + name);
    }

    private File getSharedTempDir() {
        if (newApi()) {
            return new File(
                    new File(cordova.getActivity().getCacheDir(), "tmp"), TAG);
        } else {
            return new File(
                    new File(cordova.getActivity().getExternalFilesDir(null), "tmp"), TAG);
        }
    }

    private void clearTempFiles() {
        File dir = getSharedTempDir();
        if (!dir.exists())
            return;

        //Log.d(TAG, "clearing temp files below " + dir.getAbsolutePath());
        deleteRecursive(dir, false);
    }

    private void deleteRecursive(File f, boolean self) {
        if (!f.exists())
            return;

        if (f.isDirectory()) {
            File[] files = f.listFiles();
            for (File file : files)
                deleteRecursive(file, true);
        }

        if (self && !f.delete())
            Log.e(TAG, "Failed to delete file " + f.getAbsoluteFile());
    }

    private static final String ASSETS = "file:///android_asset/";

    private boolean canGetFile(String fileArg)
            throws JSONException {
        // TODO: better check for assets files ...
        return fileArg.startsWith(ASSETS) || getFile(fileArg).exists();
    }

    @SuppressLint("ObsoleteSdkInt")
    private boolean newApi() {

        /*

         see https://github.com/sitewaerts/cordova-plugin-document-viewer/issues/76

         This is due to backwards compatibility with the android viewer app (https://github.com/sitewaerts/android-document-viewer and https://play.google.com/store/apps/details?id=de.sitewaerts.cleverdox.viewer).

         - The outdated version 1.1.2 (minSDK 15 = 4.0.3/Ice Cream Sandwich) will be still be delivered to some (probably old) devices.
            + supports old style access via public files
         - The current version 1.2.0 (minSDK 16 = 4.2/Jelly Bean) will be delivered to all other devices.
            + supports the FileProvider API.
            + supports old style access via public files
            + Starting with Nougat the usage of the FileProvider API is obligatory, the old style access via public files won't work anymore.
         */

        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN;
    }

    private File getAccessibleFile(String fileArg)
            throws JSONException
    {
        if (newApi())
            return getAccessibleFileNew(fileArg);
        else
            return getAccessibleFileOld(fileArg);
    }

    private void close(Closeable c) {
        try {
            if (c != null)
                c.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private File getAccessibleFileNew(String fileArg)
            throws JSONException {
        CordovaResourceApi cra = webView.getResourceApi();
        Uri uri = Uri.parse(fileArg);
        OutputStream os = null;
        try {
            String fileName = new File(uri.getPath()).getName();
            File tmpFile = getSharedTempFile(fileName);
            if(!tmpFile.getParentFile().exists()
                    && !tmpFile.getParentFile().mkdirs())
                throw new IOException("mkdirs "
                        + tmpFile.getParentFile().getAbsolutePath()
                        + " failed.");
            os = new FileOutputStream(tmpFile);
            cra.copyResource(uri, os);
            tmpFile.deleteOnExit();
            return tmpFile;
        } catch (FileNotFoundException e) {
            return null; // not found
        } catch (Exception e) {
            Log.e(TAG, "Failed to copy file: " + fileArg, e);
            JSONException je = new JSONException(e.getMessage());
            je.initCause(e);
            throw je;
        } finally {
            close(os);
        }
    }

    private File getAccessibleFileOld(String fileArg)
            throws JSONException {
        if (fileArg.startsWith(ASSETS)) {
            String filePath = fileArg.substring(ASSETS.length());
            String fileName = filePath.substring(
                    filePath.lastIndexOf(File.pathSeparator) + 1);

            //Log.d(TAG, "Handling assets file: fileArg: " + fileArg + ", filePath: " + filePath + ", fileName: " + fileName);

            try {
                File tmpFile = getSharedTempFile(fileName);
                InputStream in;
                try {
                    in = this.cordova.getActivity().getAssets().open(filePath);
                    if (in == null)
                        return null;
                } catch (IOException e) {
                    // not found
                    return null;
                }
                copyFile(in, tmpFile);
                tmpFile.deleteOnExit();
                return tmpFile;
            } catch (IOException e) {
                Log.e(TAG, "Failed to copy file: " + filePath, e);
                JSONException je = new JSONException(e.getMessage());
                je.initCause(e);
                throw je;
            }
        } else {
            File file = getFile(fileArg);
            if (!file.exists() || !file.isFile())
                return null;

            // detect private files, copy to accessible tmp dir if necessary
            // XXX does this condition cover all cases?
            if (file.getAbsolutePath().contains(
                    cordova.getActivity().getFilesDir().getAbsolutePath()
            )) {
//                  XXX this is the "official" way to share private files with other apps: with a content:// URI. Unfortunately, MuPDF does not swallow the generated URI. :(
//                  path = FileProvider.getUriForFile(cordova.getActivity(), "de.sitewaerts.cordova.fileprovider", file);
//                  cordova.getActivity().grantUriPermission(packageId, path, Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
//                  intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

                try {
                    File tmpFile = getSharedTempFile(file.getName());
                    copyFile(file, tmpFile);
                    tmpFile.deleteOnExit();
                    return tmpFile;
                } catch (IOException e) {
                    Log.e(TAG, "Failed to copy file: " + file.getName(), e);
                    JSONException je = new JSONException(e.getMessage());
                    je.initCause(e);
                    throw je;
                }
            }

            return file;
        }
    }

    private File getFile(String fileArg)
            throws JSONException
    {
        if (newApi())
            return getFileNew(fileArg);
        else
            return getFileOld(fileArg);
    }

    private File getFileNew(String fileArg)
            throws JSONException {
        CordovaResourceApi cra = webView.getResourceApi();
        Uri uri = Uri.parse(fileArg);
        return cra.mapUriToFile(uri);
    }

    private File getFileOld(String fileArg)
            throws JSONException {
        String filePath;
        try {
            CordovaResourceApi resourceApi = webView.getResourceApi();
            Uri fileUri = resourceApi.remapUri(Uri.parse(fileArg));
            filePath = this.stripFileProtocol(fileUri.toString());
        } catch (Exception e) {
            filePath = fileArg;
        }
        return new File(filePath);
    }

    private String stripFileProtocol(String uriString) {
        if (uriString.startsWith("file://"))
            uriString = uriString.substring(7);
        return uriString;
    }
}
