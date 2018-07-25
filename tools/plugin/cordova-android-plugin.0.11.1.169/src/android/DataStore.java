package com.linde.scapp;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.gson.JsonSyntaxException;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class DataStore
{
    private static final String TAG = DataStore.class.getName();
    private static final String sAssociatedDirectoryName = "associated";
    private static final String sUnassociatedDirectoryName = "unassociated";

    private final File mAssociatedDatasetsDirectory;
    private final File mUnassociatedDatasetsDirectory;

    public DataStore(@NonNull Context context)
    {
        mAssociatedDatasetsDirectory = getAssociatedDatasetsDirectory(context);
        mUnassociatedDatasetsDirectory = getUnassociatedDatasetsDirectory(context);
    }

    @NonNull
    private File getAssociatedDatasetsDirectory(@NonNull Context context)
    {
        File file = new File(context.getFilesDir(), sAssociatedDirectoryName);
        createDirectoryIfNotExists(file);
        return file;
    }

    @NonNull
    private File getUnassociatedDatasetsDirectory(@NonNull Context context)
    {
        File file = new File(context.getFilesDir(), sUnassociatedDirectoryName);
        createDirectoryIfNotExists(file);
        return file;
    }

    public void saveDataset(@NonNull WeldDataset dataset)
    {
        String Id = dataset.associatedWeldId();
        File directory;
        if (Id != null)
        {
            directory = new File(mAssociatedDatasetsDirectory, Id);
            createDirectoryIfNotExists(directory);
        }
        else
        {
            directory = mUnassociatedDatasetsDirectory;
        }
        saveDataset(dataset, directory);
    }

    @NonNull
    public List<String> getAssociatedDatasets(@NonNull String Id)
    {
        return getDatasets(new File(mAssociatedDatasetsDirectory, Id));
    }

    @Nullable
    public WeldDataset getAssociatedDataset(@NonNull String Id, @NonNull String timestamp)
    {
        return getDataset(new File(mAssociatedDatasetsDirectory, Id), timestamp);
    }

    @NonNull
    public List<String> getUnassociatedDatasets()
    {
        return getDatasets(mUnassociatedDatasetsDirectory);
    }

    @Nullable
    public WeldDataset getUnassociatedDataset(@NonNull String timestamp)
    {
        return getDataset(mUnassociatedDatasetsDirectory, timestamp);
    }

    // Protected method which can be overridden for testing
    protected boolean createDirectoryIfNotExists(@NonNull File file)
    {
        if (file.exists())
        {
            if (file.isDirectory())
            {
                return true;
            }

            boolean success = file.delete();
            if (!success)
            {
                Log.e(TAG, "Failed to delete file (which should be a directory) " + file.getAbsolutePath());
                return false;
            }
        }

        boolean success = file.mkdir();
        if (!success)
        {
            Log.e(TAG, "Failed to make directory " + file.getAbsolutePath());
        }
        return success;
    }

    private boolean saveDataset(@NonNull WeldDataset dataset, @NonNull File directory)
    {
        String timestamp = dataset.getStartTime();
        File file = new File(directory, timestamp);
        String string = Utils.sGsonInternal.toJson(dataset);
        FileOutputStream fileOutputStream;
        try
        {
            // If two datasets are saved with the same start time, we want the second to overwrite
            // the first rather than appending to the same file (which would result in being unable
            // to parse the contents of the file to recreate the dataset later during readWeldDatasetFromFile)
            fileOutputStream = new FileOutputStream(file, false);
        }
        catch (FileNotFoundException e)
        {
            Log.e(TAG, e.getMessage());
            return false;
        }
        try
        {
            fileOutputStream.write(string.getBytes());
        }
        catch (IOException e)
        {
            Log.e(TAG, e.getMessage());
            return false;
        }
        finally
        {
            try
            {
                fileOutputStream.close();
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
        }
        return true;
    }

    @Nullable
    private WeldDataset readWeldDatasetFromFile(@NonNull File file)
    {
        int length = (int) file.length();
        byte[] bytes = new byte[length];
        FileInputStream inputStream;
        try
        {
            inputStream = new FileInputStream(file);
        }
        catch (IOException e)
        {
            Log.e(TAG, e.getMessage());
            return null;
        }
        try
        {
            inputStream.read(bytes);
        }
        catch (IOException e)
        {
            Log.e(TAG, e.getMessage());
            return null;
        }
        finally
        {
            try
            {
                inputStream.close();
            }
            catch (IOException e)
            {
                Log.e(TAG, e.getMessage());
            }
        }

        String string = new String(bytes);
        WeldDataset weldDataset;
        try
        {
            weldDataset = Utils.sGsonInternal.fromJson(string, WeldDataset.class);
        }
        catch (JsonSyntaxException e)
        {
            Log.e(TAG, e.getMessage());
            return null;
        }
        return weldDataset;
    }

    @NonNull
    private List<String> getDatasets(@NonNull File directory)
    {
        List<String> timestamps = new ArrayList<String>();
        if (directory.exists() && directory.isDirectory())
        {
            for (File file : directory.listFiles())
            {
                timestamps.add(file.getName());
            }
        }
        return timestamps;
    }

    @Nullable
    private WeldDataset getDataset(@NonNull File directory, @NonNull String timestamp)
    {
        if (directory.exists() && directory.isDirectory())
        {
            for (File file : directory.listFiles())
            {
                if (file.getName().equals(timestamp))
                {
                    WeldDataset dataset = readWeldDatasetFromFile(file);
                    boolean success = file.delete();
                    if (!success)
                    {
                        Log.e(TAG, "Failed to delete file " + file.getAbsolutePath());
                    }
                    return dataset;
                }
            }
        }
        return null;
    }
}
