package com.isasecuredpdf.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "ISASecuredPDF";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Intercept and swallow non-fatal Chromium WebView race condition crashes (e.g. PermissionRequest grant/deny double-call, detached WebView)
        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                if (throwable != null) {
                    String msg = throwable.getMessage() != null ? throwable.getMessage() : "";
                    String stack = Log.getStackTraceString(throwable);
                    if (stack.contains("BridgeWebChromeClient") || 
                        stack.contains("chromium") || 
                        stack.contains("SystemWebView") ||
                        msg.contains("grant()") || 
                        msg.contains("deny()") || 
                        msg.contains("showImageCapturePicker") ||
                        (throwable instanceof IllegalStateException && (stack.contains("WV.") || stack.contains("webkit")))) {
                        Log.e(TAG, "Safely prevented crash from Chromium WebView race condition: " + msg, throwable);
                        return; // Prevent app termination on non-fatal WebView permission or lifecycle race
                    }
                }
                if (defaultHandler != null) {
                    defaultHandler.uncaughtException(thread, throwable);
                }
            }
        });
    }
}
