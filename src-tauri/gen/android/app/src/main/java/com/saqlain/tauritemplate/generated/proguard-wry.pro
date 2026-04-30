# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.saqlain.tauritemplate.* {
  native <methods>;
}

-keep class com.saqlain.tauritemplate.WryActivity {
  public <init>(...);

  void setWebView(com.saqlain.tauritemplate.RustWebView);
  java.lang.Class getAppClass(...);
  java.lang.String getVersion();
}

-keep class com.saqlain.tauritemplate.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.saqlain.tauritemplate.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class com.saqlain.tauritemplate.RustWebChromeClient,com.saqlain.tauritemplate.RustWebViewClient {
  public <init>(...);
}
