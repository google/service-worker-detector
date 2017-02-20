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

const div = document.querySelector('#result');

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, {type: 'getServiceWorker'}, result => {
    if (!result.src || !result.state) {
      return;
    }
    const url = new URL(result.src);
    const src = `${url.pathname}${url.search}`;
    const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
    div.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>State</th>
            <th>Script URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${result.state === 'activated' ?
                `\u2705\u00A0\u00A0${state}` :
                `\u274C\u00A0\u00A0${state}`
            }</td>
            <td><a href="${result.src}" target="_blank">${src}</a></td>
          </tr>
        </tbody>
      </table>`;
  });
});
