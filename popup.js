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

const container = document.querySelector('#container');

const beautify = (source) => {
  const beautified = js_beautify(source, {
    indent_size: 2,
    no_preserve_newlines: true,
    wrap_line_length: 80,
    end_with_newline: true,
  });
  return Prism.highlight(beautified, Prism.languages.javascript);
};

const parseManifest = (manifest, origin) => {
  const clusters = [
    {
      name: 'Identity',
      members: [
        {key: 'name', name: 'Name'},
        {key: 'short_name', name: 'Short Name'},
        {key: 'description', name: 'Description'},
      ],
    },
    {
      name: 'Presentation',
      members: [
        {key: 'start_url', name: 'Start URL'},
        {key: 'scope', name: 'Scope'},
        {key: 'theme_color', name: 'Theme Color'},
        {key: 'background_color', name: 'Background Color'},
        {key: 'orientation', name: 'Orientation'},
        {key: 'display', name: 'Display'},
        {key: 'lang', name: 'Language'},
        {key: 'dir', name: 'Direction'},
      ],
    },
    {
      name: 'Icons',
      members: [
        {key: 'icons', name: 'Icons'},
      ],
    },
    {
      name: 'Screenshots',
      members: [
        {key: 'screenshots', name: 'Screenshots'},
      ],
    },
    {
      name: 'Others',
      members: [
        {
          key: 'prefer_related_applications',
          name: 'Prefer Related Applications',
        },
        {key: 'related_applications', name: 'Related Applications'},
        {key: 'gcm_sender_id', name: 'GCM Sender ID'},
      ],
    },
  ];

  // Helper function to get absolute URLs
  const absoluteUrl = (url) => {
    if (!url) {
      return false;
    }
    try {
      url = new URL(url);
    } catch (e) {
      url = new URL(origin + (/^\//.test(url) ? url.substring(1) : url));
    }
    return url.toString();
  };

  // Helper function to get SVG
  const getRect = (fill) => {
    return `
        <svg width="15" height="15" viewBox="0 0 15 15"
            xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="15" height="15" rx="3" ry="3"
            fill="${fill}" stroke="#ddd" />
        </svg>`;
  };

  let lastSize;
  let manifestHtml = [];
  clusters.forEach((cluster) => {
    manifestHtml.push(`
        <tr>
          <th colspan="2">${cluster.name}</th>
        </tr>`);
    lastSize = manifestHtml.length;
    cluster.members.forEach((key) => {
      const keyName = key.name;
      const keyId = key.key;
      if (/_color$/.test(keyId) && manifest[keyId]) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>${getRect(manifest[keyId])} ${manifest[keyId]}</td>
            </tr>`);
      } else if ((/^icons$/.test(keyId) || /^screenshots/.test(keyId)) &&
                 (manifest[keyId] && Array.isArray(manifest[keyId]))) {
        // Sort icons by increasing size
        manifest[keyId]
        .sort((a, b) => {
          return parseInt(a.sizes.split(' ')[0].split('x')[0], 10) -
              parseInt(b.sizes.split(' ')[0].split('x')[0], 10);
        })
        .forEach((icon) => {
          const src = absoluteUrl(icon.src);
          const firstSize = icon.sizes.split(' ')[0].split('x');
          const width = firstSize[0];
          const height = firstSize[1];
          const type = icon.type || '';
          manifestHtml.push(`
              <tr>
                <td>${width}x${height}</td>
                <td>
                  <img style="width:${width}px;height:${height}px;"
                      src="${src}" title="${
                          type ? type + ' ' : ''}${width}x${height}">
                </td>
              </tr>`);
        });
      } else if ((/^scope$/.test(keyId) || /^start_url$/.test(keyId)) &&
                 (manifest[keyId])) {
        manifest[keyId] = absoluteUrl(manifest[keyId]);
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>
                <a href="${manifest[keyId]}" title="${manifest[keyId]}">${
                    manifest[keyId].length > 50 ?
                        manifest[keyId].substr(0, 50) + '…' :
                        manifest[keyId]}</a>
              </td>
            </tr>`);
      } else if ((/^prefer_related_applications$/.test(keyId)) &&
                 (typeof manifest[keyId] === 'boolean')) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>${manifest[keyId] === true ? 'true' : 'false'}</td>
            </tr>`);
      } else if (/^related_applications$/.test(keyId) && manifest[keyId] &&
          Array.isArray(manifest[keyId])) {
        manifest[keyId].forEach((relatedApplication) => {
          const platform = relatedApplication.platform;
          if (!platform) {
            return;
          }
          const url = absoluteUrl(relatedApplication.url);
          const id = relatedApplication.id || '';
          if (!url && !id) {
            return;
          }
          if (url) {
            manifestHtml.push(`
                <tr>
                  <td>${platform}</td>
                  <td><a href="${url}" title="${id}">${url.length > 50 ?
                      url.substr(0, 50) + '…' :
                      url}</a></td>
                </tr>`);
          } else {
            manifestHtml.push(`
                <tr>
                  <td>${platform}</td>
                  <td>${id}</a></td>
                </tr>`);
          }
        });
      }
    });
    // If the current cluster has no members, remove its header
    if (lastSize === manifestHtml.length) {
      manifestHtml.pop();
    }
  });
  return manifestHtml.join('\n');
};

const getServiceWorkerHtml = (state, relativeUrl, result) => {
  return `
      <details open>
        <summary>👷 Service Worker</summary>
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Script URL</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${result.state === 'activated' ?
                  `\u2705\u00A0\u00A0${state}` :
                  `\u274C\u00A0\u00A0${state}`}
              </td>
              <td>
                <a href="${result.scriptUrl}" title="${result.scriptUrl}">${
                    relativeUrl.length > 50 ?
                        relativeUrl.substr(0, 50) + '…' :
                        relativeUrl}</a>
              </td>
              <td>
                <ul id="events">
                  ${result.events.sort().map((event) => {
                    return `
                        <li>
                          <input id="${event}" name="${event}" type="checkbox">
                          <label for="${event}">${event}</label>
                        </li>`;
                  }).join('\n')}
                </ul>
              </td>
            </tr>
          </tbody>
          <tbody>
            <tr>
              <th colspan="3">
                Service Worker Code <small>(beautified)</small>
              </th>
            </tr>
            <tr>
              <td colspan="3">
                <pre><code id="code" class="language-javascript>${
                    beautify(result.source)}</code></pre>
              </td>
            </tr>
          </tbody>
        </table>
      </details>`;
};

const getManifestHtml = (result, origin) => {
  return `
      <details>
        <summary>📃 Manifest</summary>
        <table>
          <thead>
            <tr>
              <th colspan="2">Manifest URL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">
                <a href="${result.manifestUrl}" title="${result.manifestUrl}">${
                    result.manifestUrl.length > 50 ?
                        result.manifestUrl.substr(0, 50) + '…' :
                        result.manifestUrl}</a></td>
            </tr>
            ${parseManifest(result.manifest, origin)}
          </tbody>
        </table>
      </details>`;
};

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  const currentTab = tabs[0];
  chrome.tabs.sendMessage(currentTab.id, {type: 'getServiceWorker'},
      (result) => {
    if (!result.scriptUrl || !result.state) {
      return;
    }
    const url = new URL(result.scriptUrl);
    const relativeUrl = `${url.pathname}${url.search}`;
    const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
    result.events = {};
    try {
      esprima.parse(result.source, {}, (node) => {
        if ((node.type === 'CallExpression') &&
            (node.callee.type === 'MemberExpression') &&
            (node.callee.property.name === 'addEventListener') &&
            (node.arguments) &&
            (Array.isArray(node.arguments)) &&
            (node.arguments.length) &&
            (node.arguments[0].type === 'Literal')) {
          result.events[node.arguments[0].value] = true;
        }
      });
    } catch (parseError) {
      console.log(parseError);
      result.source = JSON.stringify(parseError, null, 2);
    }
    result.events = Object.keys(result.events);
    let html = getServiceWorkerHtml(state, relativeUrl, result);
    if (result.manifest) {
      html += getManifestHtml(result, `${new URL(currentTab.url).origin}/`);
    }
    container.innerHTML = html;

    const events = document.querySelector('#events');
    const code = document.querySelector('#code');
    events.addEventListener('click', (clickEvent) => {
      const target = clickEvent.target;
      let input;
      if (target.nodeName === 'LABEL') {
        input = events.querySelector(`#${target.getAttribute('for')}`);
      } else if (target.nodeName === 'INPUT') {
        input = target;
      } else {
        return;
      }
      const tokenStrings = code.querySelectorAll('span.token.string',
          'span.token.string.highlight');
      tokenStrings.forEach((tokenString) => {
        if ((tokenString.textContent !== `'${input.id}'`) &&
            (tokenString.textContent !== `"${input.id}"`)) {
          return;
        }
        if (input.checked) {
          tokenString.classList.add('highlight');
          tokenString.scrollIntoViewIfNeeded();
        } else {
          tokenString.classList.remove('highlight');
        }
      });
    });
  });
});
