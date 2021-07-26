# 👷‍♀️ 👷 Service Worker Detector

## 💻 💬 Description

This extension detects if a website registers a
[Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker)
by reading the `navigator.serviceWorker.controller`
[property](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controller).
This read-only property of the `ServiceWorkerContainer` interface only returns a `ServiceWorker`
object if its state is `activated`. It returns `null` if the request is a force refresh
(shift + refresh) or if there is no active worker.

⚠️ If the extension does not seem to work, perform a soft reload, so the Service Worker
has a chance to become active.

This is not an officially supported Google product.

## 🖥 🔫 Screenshots

![Screenshot Service Worker](https://github.com/google/service-worker-detector/blob/master/store_assets/screenshot-serviceworker.png)

![Screenshot Manifest](https://github.com/google/service-worker-detector/blob/master/store_assets/screenshot-manifest.png)

![Screenshot Cache Storage](https://github.com/google/service-worker-detector/blob/master/store_assets/screenshot-cachestorage.png)

## 🔧 🛍 Installation

Install the Service Worker Detector extension for your favorite browser:

- [Google Chrome](https://chrome.google.com/webstore/detail/service-worker-detector/ofdigdofloanabjcaijfidkogmejlmjc)
- [Opera](https://addons.opera.com/extensions/details/service-worker-detector/)
- [Mozilla Firefox](https://addons.mozilla.org/firefox/addon/service-worker-detector/)
- [Microsoft Edge (Chromium-based)](https://microsoftedge.microsoft.com/addons/detail/jcdnchdgholdalglebcklkbhlnhnlhon)
- [Apple Safari](https://apps.apple.com/app/service-worker-detector/id1530808337)

## ⚤ 👍 Diversity in Tech

The extension represents Service Workers with
[construction worker emoji](http://emojipedia.org/search/?q=construction+worker).
The extension icon randomly features the female or the male construction worker.

## 📄 💼 License

Copyright 2017 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
