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

window.browser = window.browser || window.chrome;

(() => {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  const serviceWorkerController = navigator.serviceWorker.controller;
  if (!serviceWorkerController || !serviceWorkerController.scriptURL) {
    return;
  }
  let result = {
    state: serviceWorkerController.state,
    scriptUrl: serviceWorkerController.scriptURL,
    source: '',
    manifest: '',
    manifestUrl: '',
    cacheContents: {},
  };
  const fetchOptions = {
    credentials: 'include',
    headers: {
      // Required according to the spec:
      // https://w3c.github.io/ServiceWorker/#service-worker-script-request
      'service-worker': 'script',
    },
  };
  fetch(result.scriptUrl, fetchOptions)
  .then((response) => {
    if (!response.ok) {
      throw Error('Network response was not OK.');
    }
    return response.text();
  })
  .then((script) => {
    result.source = script;
    return document.querySelector('link[rel="manifest"]');
  })
  .then((link) => {
    if (link && link.href) {
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
    result.manifestUrl = response.url;
    return response.json();
  })
  .then((manifest) => {
    if (manifest) {
      result.manifest = manifest;
    }
    if ('caches' in window) {
      return caches.keys();
    }
    return [];
  })
  .then((cacheNames) => {
    let cachePromises = [];
    let cacheContents = {};
    cacheNames.forEach((cacheName) => {
      cacheContents[cacheName] = [];
      cachePromises.push(caches.open(cacheName).then((cache) => cache.keys()));
    });
    return Promise.all(cachePromises)
    .then((cacheResults) => {
      const requestProperties = [
        'method',
        'url',
      ];
      let responsePromises = [];
      cacheResults.forEach((cacheResult, i) => {
        cacheResult.forEach((request) => {
          responsePromises.push(caches.match(request)
          .then((cacheResponse) => {
            let serializedRequest = {};
            requestProperties.forEach((requestProperty) => {
              serializedRequest[requestProperty] = request[requestProperty];
            });
            let contentType = cacheResponse.headers.get('content-type');
            serializedRequest.type = cacheResponse.type;
            serializedRequest.mime = contentType ?
                contentType.split(';')[0] :
                'unknown';
            return cacheContents[cacheNames[i]].push(serializedRequest);
          }));
        });
      });
      return Promise.all(responsePromises)
      .then(() => cacheContents);
    });
  })
  .then((cacheContents) => {
    result.cacheContents = cacheContents;
    try {
      // ⚠️ TODO: Why does Firefox require ```option.toProxyScript```?
      return browser.runtime.sendMessage(null, result, {
        toProxyScript: false,
      });
    } catch (e) {
      return browser.runtime.sendMessage(null, result);
    }
  })
  .catch((fetchError) => {
    console.log(fetchError);
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getServiceWorker') {
      sendResponse(result);
    }
  });
})();
