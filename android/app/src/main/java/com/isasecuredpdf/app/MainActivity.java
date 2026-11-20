package com.isasecuredpdf.app;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "ISASecuredPDF";
    private static String pendingPdfPayload = null;

    public class AndroidPdfBridge {
        @JavascriptInterface
        public String getPendingPdf() {
            String temp = pendingPdfPayload;
            pendingPdfPayload = null; // Clear once retrieved
            return temp != null ? temp : "";
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register Javascript Interface so web app can pull pending PDF on cold boot
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidPdfBridge(), "AndroidPdfBridge");
        }

        // Handle incoming intent if launched from file explorer or another app
        handleIncomingPdfIntent(getIntent(), false);

        // Intercept and swallow non-fatal Chromium WebView race condition crashes
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

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingPdfIntent(intent, true);
    }

    private void handleIncomingPdfIntent(Intent intent, boolean isRunning) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri targetUri = null;

        if (Intent.ACTION_VIEW.equals(action)) {
            targetUri = intent.getData();
        } else if (Intent.ACTION_SEND.equals(action)) {
            targetUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        }

        if (targetUri == null) return;

        try {
            String fileName = getFileNameFromUri(targetUri);
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = "document.pdf";
            }
            if (!fileName.toLowerCase().endsWith(".pdf")) {
                fileName += ".pdf";
            }

            InputStream is = getContentResolver().openInputStream(targetUri);
            if (is == null) return;

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int nRead;
            byte[] data = new byte[16384];
            while ((nRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            byte[] fileBytes = buffer.toByteArray();
            is.close();

            String base64Data = Base64.encodeToString(fileBytes, Base64.NO_WRAP);

            JSONObject payload = new JSONObject();
            payload.put("fileName", fileName);
            payload.put("base64Data", base64Data);
            String jsonStr = payload.toString();

            pendingPdfPayload = jsonStr;

            if (isRunning && getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        String js = "window.dispatchEvent(new CustomEvent('androidOpenPdf', { detail: " + jsonStr + " }));";
                        getBridge().getWebView().evaluateJavascript(js, null);
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to load incoming PDF from intent: " + e.getMessage(), e);
        }
    }

    private String getFileNameFromUri(Uri uri) {
        String result = null;
        if (uri.getScheme() != null && uri.getScheme().equals("content")) {
            Cursor cursor = null;
            try {
                cursor = getContentResolver().query(uri, null, null, null, null);
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex != -1) {
                        result = cursor.getString(nameIndex);
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Could not resolve file name from content resolver: " + e.getMessage());
            } finally {
                if (cursor != null) cursor.close();
            }
        }
        if (result == null) {
            result = uri.getLastPathSegment();
        }
        return result;
    }
}
