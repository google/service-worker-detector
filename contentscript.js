/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(() => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  let controller = null;
  const serviceWorkerController = navigator.serviceWorker.controller;
  if (!serviceWorkerController || !serviceWorkerController.scriptURL) {
    return;
  }
  controller = {
    state: serviceWorkerController.state,
    scriptUrl: serviceWorkerController.scriptURL,
    source: '',
    manifest: '',
    manifestUrl: '',
  };
  fetch(controller.scriptUrl)
  .then((response) => {
    if (!response.ok) {
      throw Error('Network response was not OK.');
    }
    return response.text();
  })
  .then((script) => {
    controller.source = script;
    return document.querySelector('link[rel="manifest"]');
  })
  .then((link) => {
    if (link && link.href) {
      controller.manifestUrl = link.href;
      return fetch(link.href);
    }
    return false;
  })
  .then((response) => {
    if (!response) {
      return false;
    }
    if (!response.ok) {
      throw Error('Network response was not OK.');
    }
    return response.json();
  })
  .then((manifest) => {
    if (manifest) {
      controller.manifest = manifest;
    }
    return chrome.runtime.sendMessage(null, controller);
  })
  .catch((fetchError) => {
    console.log(fetchError);
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getServiceWorker') {
      sendResponse(controller);
    }
  });
})();
