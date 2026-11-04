package com.airsense.monitor;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "DeviceSetup")
public class DeviceSetupPlugin extends Plugin {
    @PluginMethod
    public void openWifiSettings(PluginCall call) {
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            intent = new Intent(Settings.Panel.ACTION_WIFI);
        } else {
            intent = new Intent(Settings.ACTION_WIFI_SETTINGS);
        }
        getActivity().startActivity(intent);
        call.resolve(new JSObject());
    }

    @PluginMethod
    public void openProvisioningPortal(PluginCall call) {
        Intent intent = new Intent(getActivity(), ProvisioningActivity.class);
        getActivity().startActivity(intent);
        call.resolve(new JSObject());
    }
}
