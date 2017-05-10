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

const beautify = (source) => {
  const beautified = js_beautify(source, {
    indent_size: 2,
    no_preserve_newlines: true,
    wrap_line_length: 80,
    end_with_newline: true,
  });
  return Prism.highlight(beautified, Prism.languages.javascript);
};

const parseManifest = (manifest, baseUrl) => {
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
      name: 'Related Applications',
      members: [
        {
          key: 'prefer_related_applications',
          name: 'Prefer Related Applications',
        },
        {key: 'related_applications', name: 'Related Applications'},
      ],
    },
    {
      name: 'Google Cloud Messaging (GCM)',
      members: [
        {key: 'gcm_sender_id', name: 'GCM Sender ID'},
        {key: 'gcm_user_visible_only', name: 'GCM User Visible Only'},
      ],
    },
  ];

  // Helper function to get absolute URLs
  const absoluteUrl = (urlString) => {
    if (!urlString) {
      return false;
    }
    let url;
    try {
      url = new URL(urlString, baseUrl);
    } catch (e) {
      return false;
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
                  <td>
                    <a href="${url}" title="${id}">${url.length > 50 ?
                        url.substr(0, 50) + '…' :
                        url}</a>
                  </td>
                </tr>`);
          } else {
            manifestHtml.push(`
                <tr>
                  <td>${platform}</td>
                  <td>${id}</a></td>
                </tr>`);
          }
        });
      } else if (manifest[keyId] !== undefined) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>${manifest[keyId]}</td>
            </tr>`);
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
  let beautifiedCode = beautify(result.source);
  for (importedScriptUrl in result.importedScripts) {
    if (!Object.prototype.hasOwnProperty.call(result.importedScripts,
        importedScriptUrl)) {
      continue;
    }
    // From https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
    let regExpUrl = importedScriptUrl.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    // Deal with potentially escaped forward slashes
    regExpUrl = regExpUrl.replace(/\//g, '\\\\?/');
    const regExp = new RegExp(`(["'])${regExpUrl}["']`, 'g');
    const code = beautify(result.importedScripts[importedScriptUrl]);
    beautifiedCode = beautifiedCode.replace(regExp,
        /* eslint-disable max-len */
        `<details class="imported-script"><summary class="imported-script"><a href="${importedScriptUrl}">$1${importedScriptUrl}$1</a></summary><div>${code}</div></details>`);
        /* eslint-enable max-len */
  }
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
                <pre><code id="code" class="language-javascript">${
                    beautifiedCode}</code></pre>
              </td>
            </tr>
          </tbody>
        </table>
      </details>`;
};

const getManifestHtml = (result, baseUrl) => {
  return `
      <details>
        <summary>📃 Web Manifest</summary>
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
                        result.manifestUrl}</a>
              </td>
            </tr>
            ${parseManifest(result.manifest, baseUrl)}
          </tbody>
        </table>
      </details>`;
};

const getCacheHtml = ((cacheContents) => {
  let html = `
      <details>
        <summary>🛢 Cache Storage</summary>
        <div>`;
  const columnNames = [
    'mime',
    'method',
    'url',
    'type',
  ];
  let first = true;
  for (let cacheName in cacheContents) {
    if (!cacheContents.hasOwnProperty(cacheName)) {
      continue;
    }
    // Empty cache
    if (!cacheContents[cacheName].length) {
      continue;
    }
    html += `
        <details${first ? ' open' : ''}>
          <summary class="cache-storage">Cache
            "<code>${cacheName}</code>"
          </summary>
          <table>
            <thead>
              <tr>${
                columnNames.map((columnName) => {
                  return `
                      <th>${columnName === 'url' || columnName === 'mime' ?
                        columnName.toUpperCase() :
                        (columnName.charAt(0).toUpperCase() +
                        columnName.slice(1))}
                      </th>`;
                }).join('\n')}
              </tr>
            </thead>
            <tbody>${
              cacheContents[cacheName].sort((a, b) => {
                if (a.mime < b.mime) {
                  return -1;
                }
                if (a.mime > b.mime) {
                  return 1;
                }
                return 0;
              })
              .map((cacheEntry) => {
                const url = cacheEntry.url;
                const contentType = cacheEntry.mime;
                return `
                    <tr>
                      ${columnNames.map((columnName) => {
                        if (columnName === 'url') {
                          return `
                              <td>
                                <a href="${url}" title="${url}">${
                                    url.length > 50 ?
                                        url.substr(0, 50) + '…' : url}
                                </a>
                              </td>`;
                        } else if (columnName === 'mime') {
                          if (/^image\//.test(contentType)) {
                            return `
                                <td>
                                  <a href="${url}" title="${url}">
                                    <img class="preview" src="${url}"
                                        title="${contentType}"
                                        alt="${url}">
                                  </a>
                                </td>`;
                          } else if (/^text\/css$/.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">🖌</span>
                                </td>`;
                          } else if (/^audio\//.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">🔈</span>
                                </td>`;
                          } else if (/^video\//.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">📹</span>
                                </td>`;
                          } else if (/\/.*?javascript/.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">📝</span>
                                </td>`;
                          } else if (/^text\/html/.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">📄</span>
                                </td>`;
                          } else if (/^application\/.*?font/
                              .test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">🔡</span>
                                </td>`;
                          } else if (/\/json/.test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">🔖</span>
                                </td>`;
                          } else if (/application\/manifest\+json/
                              .test(contentType)) {
                            return `
                                <td>
                                  <span title="${contentType}">📃</span>
                                </td>`;
                          } else {
                            return `
                                <td>
                                  <span title="unknown">❓</span>
                                </td>`;
                          }
                        } else {
                          return `
                              <td>
                                ${cacheEntry[columnName]}
                              </td>`;
                        }
                      }).join('\n')}
                    </tr>`;
              }).join('\n')}
            </tbody>
          </table>
        </details>`;
    first = false;
  }
  html += `
      </div>
    </details>`;
  return html;
});

const renderHtml = (state, relativeUrl, result) => {
  result.events = Object.keys(result.events);
  let html = getServiceWorkerHtml(state, relativeUrl, result);
  if (result.manifest) {
    const baseUrl = result.manifestUrl.substring(0,
        result.manifestUrl.lastIndexOf('/') + 1);
    html += getManifestHtml(result, baseUrl);
  }
  if (result.cacheContents && Object.keys(result.cacheContents).length) {
    html += getCacheHtml(result.cacheContents);
  }
  const container = document.querySelector('#container');
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

    // Find addEventlistener('$event') style events
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

    // Find on$Event style events
    let walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT,
        null, false);
    let node;
    while(node = walker.nextNode()) {
      if (new RegExp(`on${input.id}`).test(node.textContent.trim())) {
        const previousSibling = node.previousSibling;
        const nextSibling = node.nextSibling;
        if (input.checked) {
          previousSibling.classList.add('highlight');
          nextSibling.classList.add('highlight');
          previousSibling.scrollIntoViewIfNeeded();
        } else {
          previousSibling.classList.remove('highlight');
          nextSibling.classList.remove('highlight');
        }
        return;
      }
    }
  });
};

browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
  const currentTab = tabs[0];
  browser.tabs.sendMessage(currentTab.id, {type: 'getServiceWorker'},
      (result) => {
    if (!result.scriptUrl || !result.state) {
      return;
    }
    const url = new URL(result.scriptUrl);
    const relativeUrl = `${url.pathname}${url.search}`;
    const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
    result.events = {};
    try {
      // Find importScripts statements
      let importedScriptsPromises = [];
      let importedScriptsUrls = [];
      esprima.parse(result.source, {}, (node) => {
        if ((node.type === 'CallExpression') &&
            (node.callee.type === 'Identifier') &&
            (node.callee.name === 'importScripts') &&
            (node.arguments) &&
            (Array.isArray(node.arguments))) {
          importedScriptsPromises = importedScriptsPromises.concat(
              node.arguments.map((arg) => {
            // This means ```importScripts(variable)``` rather than
            //  ```importScripts('https://example.org/sw.js')```
            if (arg.type !== 'Literal') {
              return Promise.resolve('');
            }
            const importedScriptsUrl = arg.value.replace(/\\\//g, '/');
            importedScriptsUrls.push(importedScriptsUrl);
            return fetch(new URL(importedScriptsUrl, result.scriptUrl))
            .then((response) => {
              if (response.ok) {
                return response.text();
              }
              throw Error(`Couldn't load ${arg.value}`);
            })
            .catch((e) => e);
          }));
        }
      });
      Promise.all(importedScriptsPromises)
      .then((importedScriptsSources) => {
        let importedScripts = {};
        importedScriptsSources.map((script, i) => {
          importedScripts[importedScriptsUrls[i]] = importedScriptsSources[i];
        });
        result.importedScripts = importedScripts;
        return result;
      })
      .then(() => {
        // Some events may be hidden in imported scripts, so analyze them, too
        const jointSources = Object.keys(result.importedScripts).map((url) => {
          return result.importedScripts[url];
        }).join('\n') + result.source;
        esprima.parse(jointSources, {}, (node) => {
          // Find addEventlistener('$event') style events
          if ((node.type === 'CallExpression') &&
              (node.callee.type === 'MemberExpression') &&
              (node.callee.property.name === 'addEventListener') &&
              (node.arguments) &&
              (Array.isArray(node.arguments)) &&
              (node.arguments.length) &&
              (node.arguments[0].type === 'Literal')) {
            result.events[node.arguments[0].value] = true;
          // Find on$Event style events
          } else if ((node.type === 'ExpressionStatement') &&
                     (node.expression.type === 'AssignmentExpression') &&
                     (node.expression.left.type === 'MemberExpression') &&
                     (node.expression.left.object.name === 'self') &&
                     (node.expression.left.property.type === 'Identifier') &&
                     (/^on/.test(node.expression.left.property.name))) {
            const event = node.expression.left.property.name.replace(/^on/, '');
            result.events[event] = true;
          }
        });
        renderHtml(state, relativeUrl, result);
      });
    } catch (parseError) {
      result.source = JSON.stringify(parseError, null, 2);
      renderHtml(state, relativeUrl, result);
    }
  });
});
