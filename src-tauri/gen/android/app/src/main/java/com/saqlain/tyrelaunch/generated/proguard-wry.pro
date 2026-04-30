# THIS FILE IS AUTO-GENERATED. DO NOT MODIFY!!

# Copyright 2020-2023 Tauri Programme within The Commons Conservancy
# SPDX-License-Identifier: Apache-2.0
# SPDX-License-Identifier: MIT

-keep class com.saqlain.tyrelaunch.* {
  native <methods>;
}

-keep class com.saqlain.tyrelaunch.WryActivity {
  public <init>(...);

  void setWebView(com.saqlain.tyrelaunch.RustWebView);
  java.lang.Class getAppClass(...);
  java.lang.String getVersion();
}

-keep class com.saqlain.tyrelaunch.Ipc {
  public <init>(...);

  @android.webkit.JavascriptInterface public <methods>;
}

-keep class com.saqlain.tyrelaunch.RustWebView {
  public <init>(...);

  void loadUrlMainThread(...);
  void loadHTMLMainThread(...);
  void evalScript(...);
}

-keep class com.saqlain.tyrelaunch.RustWebChromeClient,com.saqlain.tyrelaunch.RustWebViewClient {
  public <init>(...);
}
