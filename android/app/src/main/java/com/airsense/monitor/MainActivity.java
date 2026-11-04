package com.airsense.monitor;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceSetupPlugin.class);
        registerPlugin(SecureStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
