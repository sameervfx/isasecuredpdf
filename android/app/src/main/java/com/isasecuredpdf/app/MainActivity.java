package com.isasecuredpdf.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "ISASecuredPDF";
    private static final String EXPORT_SUBFOLDER = "ISA Secured PDF";
    private static volatile String pendingPdfPayload = null;
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();

    public class AndroidPdfBridge {
        @JavascriptInterface
        public String getPendingPdf() {
            String temp = pendingPdfPayload;
            pendingPdfPayload = null; // Clear once retrieved
            return temp != null ? temp : "";
        }

        @JavascriptInterface
        public String saveToDocumentsFolder(String fileName, String mimeType, String base64Data) {
            try {
                if (base64Data == null || base64Data.isEmpty()) {
                    return "ERROR:Empty file data";
                }
                String safeName = (fileName == null || fileName.trim().isEmpty())
                        ? "document.pdf"
                        : fileName.replace("/", "_").replace("\\", "_").trim();
                String safeMime = (mimeType == null || mimeType.trim().isEmpty())
                        ? "application/pdf"
                        : mimeType.trim();

                byte[] decoded = Base64.decode(base64Data, Base64.DEFAULT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentResolver resolver = getContentResolver();
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, safeMime);
                    values.put(
                            MediaStore.MediaColumns.RELATIVE_PATH,
                            Environment.DIRECTORY_DOCUMENTS + "/" + EXPORT_SUBFOLDER
                    );
                    values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                    Uri collection = MediaStore.Files.getContentUri("external");
                    Uri itemUri = resolver.insert(collection, values);
                    if (itemUri == null) {
                        return "ERROR:MediaStore insert returned null";
                    }

                    OutputStream os = null;
                    try {
                        os = resolver.openOutputStream(itemUri);
                        if (os == null) {
                            resolver.delete(itemUri, null, null);
                            return "ERROR:Could not open output stream";
                        }
                        os.write(decoded);
                        os.flush();
                    } finally {
                        if (os != null) {
                            try {
                                os.close();
                            } catch (Exception ignored) {}
                        }
                    }

                    ContentValues publishValues = new ContentValues();
                    publishValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    resolver.update(itemUri, publishValues, null, null);
                    return "OK";
                } else {
                    File docsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
                    File targetDir = new File(docsDir, EXPORT_SUBFOLDER);
                    if (!targetDir.exists()) {
                        targetDir.mkdirs();
                    }
                    File outFile = new File(targetDir, safeName);
                    FileOutputStream fos = null;
                    try {
                        fos = new FileOutputStream(outFile);
                        fos.write(decoded);
                        fos.flush();
                    } finally {
                        if (fos != null) {
                            try {
                                fos.close();
                            } catch (Exception ignored) {}
                        }
                    }
                    MediaScannerConnection.scanFile(
                            getApplicationContext(),
                            new String[]{ outFile.getAbsolutePath() },
                            new String[]{ safeMime },
                            null
                    );
                    return "OK";
                }
            } catch (Exception e) {
                Log.e(TAG, "saveToDocumentsFolder failed: " + e.getMessage(), e);
                return "ERROR:" + e.getMessage();
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register Javascript Interface & resilient WebViewClient (prevents SIGTRAP on WebView renderer OOM kill)
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new AndroidPdfBridge(), "AndroidPdfBridge");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                    @Override
                    public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                        Log.w(TAG, "WebView render process gone (didCrash=" + (detail != null && detail.didCrash()) + "). Recovering gracefully.");
                        if (!isFinishing() && !isDestroyed()) {
                            runOnUiThread(() -> {
                                try {
                                    recreate();
                                } catch (Exception e) {
                                    Log.e(TAG, "Failed to recreate activity after WebView recovery: " + e.getMessage());
                                }
                            });
                        }
                        return true; // Returning true prevents Android Chromium from terminating the app with SIGTRAP
                    }
                });
            }
        }

        // Handle incoming intent on a background thread (prevents Main Thread ANR on large PDFs)
        handleIncomingPdfIntent(getIntent(), false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingPdfIntent(intent, true);
    }

    @Override
    public void onDestroy() {
        try {
            ioExecutor.shutdownNow();
        } catch (Exception ignored) {}
        super.onDestroy();
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
        final Uri finalUri = targetUri;

        // Read & Base64-encode PDF strictly off the UI thread to prevent Input Dispatching ANRs
        ioExecutor.execute(() -> {
            InputStream is = null;
            try {
                String fileName = getFileNameFromUri(finalUri);
                if (fileName == null || fileName.trim().isEmpty()) {
                    fileName = "document.pdf";
                }
                if (!fileName.toLowerCase().endsWith(".pdf")) {
                    fileName += ".pdf";
                }

                is = getContentResolver().openInputStream(finalUri);
                if (is == null) return;

                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                int nRead;
                byte[] data = new byte[16384];
                int totalBytes = 0;
                final int maxBytes = 45 * 1024 * 1024; // 45 MB safety guardrail against Java OOM
                while ((nRead = is.read(data, 0, data.length)) != -1) {
                    totalBytes += nRead;
                    if (totalBytes > maxBytes) {
                        Log.w(TAG, "Incoming PDF exceeds 45MB safe intent buffer; aborting intent stream.");
                        return;
                    }
                    buffer.write(data, 0, nRead);
                }
                buffer.flush();
                byte[] fileBytes = buffer.toByteArray();

                String base64Data = Base64.encodeToString(fileBytes, Base64.NO_WRAP);

                JSONObject payload = new JSONObject();
                payload.put("fileName", fileName);
                payload.put("base64Data", base64Data);
                final String jsonStr = payload.toString();

                pendingPdfPayload = jsonStr;

                if (isRunning && !isFinishing() && !isDestroyed()) {
                    runOnUiThread(() -> {
                        try {
                            if (!isFinishing() && !isDestroyed() && getBridge() != null && getBridge().getWebView() != null) {
                                String js = "window.dispatchEvent(new CustomEvent('androidOpenPdf', { detail: " + jsonStr + " }));";
                                getBridge().getWebView().evaluateJavascript(js, null);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Safe WebView evaluateJavascript guard caught error: " + e.getMessage());
                        }
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to load incoming PDF from intent: " + e.getMessage(), e);
            } finally {
                if (is != null) {
                    try {
                        is.close();
                    } catch (Exception ignored) {}
                }
            }
        });
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
