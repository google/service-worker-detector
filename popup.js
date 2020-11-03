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

const beautifyCode = (source) => {
  const beautified = window.beautifier.js(source, {
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
        {key: 'iarc_rating_id', name: 'IARC Rating ID'},
        {key: 'categories', name: 'Categories'},
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
        {
          key: 'related_applications',
          name: 'Related Applications',
          submembers: [
            {key: 'min_version', name: 'Minimum Version'},
            {key: 'fingerprints', name: 'Fingerprints'},
          ],
        },
      ],
    },
    {
      name: 'Google Cloud Messaging (GCM)',
      members: [
        {key: 'gcm_sender_id', name: 'GCM Sender ID'},
        {key: 'gcm_user_visible_only', name: 'GCM User Visible Only'},
      ],
    },
    {
      name: 'Web Share',
      members: [
        {key: 'share_target', name: 'Share Target'},
        {key: 'supports_share', name: 'Supports Share'},
      ],
    },
    {
      name: 'Service Worker',
      members: [
        {
          key: 'serviceworker',
          name: 'Service Worker',
          submembers: [
            {key: 'src', name: 'Source'},
            {key: 'scope', name: 'Scope'},
            {key: 'type', name: 'Type'},
            {key: 'use_cache', name: 'Use Cache'},
          ],
        },
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
  const manifestHtml = [];
  clusters.forEach((cluster) => {
    manifestHtml.push(`
        <tr>
          <th colspan="2">${cluster.name}</th>
        </tr>`);
    lastSize = manifestHtml.length;
    cluster.members.forEach((key) => {
      const keyName = key.name;
      const keyId = key.key;
      const submembers = key.submembers || null;
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
              return parseInt(a.sizes.split(' ')[0].split(/x/i)[0], 10) -
              parseInt(b.sizes.split(' ')[0].split(/x/i)[0], 10);
            })
            .forEach((icon) => {
              const src = absoluteUrl(icon.src);
              let width;
              let height;
              const sizesNotSpecified = /any/.test(icon.sizes);
              if (sizesNotSpecified) {
                width = 64;
                height = 'auto';
              } else {
                const firstSize = icon.sizes.split(' ')[0].split(/x/i);
                width = firstSize[0];
                height = firstSize[1] || '';
              }
              const type = icon.type || '';
              if (sizesNotSpecified) {
                manifestHtml.push(`
                <tr>
                  <td>any</td>
                  <td>
                    <img style="width:${width}px;height:${height};"
                        src="${src}"
                        title="${type ? type + ' ' : ''}any">
                  </td>
                </tr>`);
              } else {
                manifestHtml.push(`
                <tr>
                  <td>${width}x${height}</td>
                  <td>
                    <img style="width:${width}px;height:${height}px;"
                        src="${src}"
                        title="${type ? type + ' ' : ''}${width}x${height}">
                  </td>
                </tr>`);
              }
            });
      } else if ((/^scope$/.test(keyId) || /^start_url$/.test(keyId)) &&
                 (manifest[keyId])) {
        manifest[keyId] = absoluteUrl(manifest[keyId]);
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>
                <a href="${manifest[keyId]}" title="${manifest[keyId]}">
                  ${manifest[keyId]}
                </a>
              </td>
            </tr>`);
      } else if (/^categories$/.test(keyId) && manifest[keyId] &&
          Array.isArray(manifest[keyId])) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>${manifest[keyId].join(', ')}</td>
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
          const values = {
            min_version: relatedApplication.min_version || '',
            fingerprints: relatedApplication.fingerprints || '',
          };
          if (url) {
            manifestHtml.push(`
                <tr>
                  <td>${platform}</td>
                  <td>
                    <a href="${url}" title="${id}">${url}</a>
                    ${
  submembers.map((submember) => {
    if (values[submember.key]) {
      return `
                            <div>
                              <small>
                                <strong>${submember.name}:</strong>
                                ${(submember.key === 'fingerprints') ?
                                    values[submember.key].map((fingerprint) => {
                                      return `
                                          <div>
                                            <code>${fingerprint.value}</code>
                                            (${fingerprint.type})
                                          </div>`;
                                    }).join('') :
                                    values[submember.key]
}
                              </small>
                            </div>`;
    }
  }).join('')
}
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
      } else if ((/^supports_share$/.test(keyId)) &&
                 (typeof manifest[keyId] === 'boolean')) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>${manifest[keyId] === true ? 'true' : 'false'}</td>
            </tr>`);
      } else if ((/^share_target$/.test(keyId)) &&
                 (typeof manifest[keyId] === 'object')) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td>
                <pre><code class="language-javascript">${
  beautifyCode(JSON.stringify(manifest[keyId]))
}</code></pre>
              </td>
            </tr>`);
      } else if ((/^serviceworker$/.test(keyId)) &&
                 (typeof manifest[keyId] === 'object')) {
        const serviceworker = manifest[keyId];
        const values = {
          src: serviceworker.src ?
              `<a href="${absoluteUrl(serviceworker.src)}">
                ${serviceworker.src}</a>` :
              '',
          scope: serviceworker.scope ?
              `<a href="${absoluteUrl(serviceworker.scope)}">
                ${serviceworker.scope}</a>` :
              '',
          type: serviceworker.type || '',
          use_cache: typeof serviceworker.use_cache === 'boolean' ?
              serviceworker.use_cache.toString() : '',
        };
        submembers.forEach((submember) => {
          if (values[submember.key]) {
            manifestHtml.push(`
              <tr>
                <td>${submember.name}</td>
                <td>${values[submember.key]}</td>
              </tr>`);
          }
        });
      } else if (manifest[keyId] !== undefined) {
        manifestHtml.push(`
            <tr>
              <td>${keyName}</td>
              <td title="${manifest[keyId]}">${manifest[keyId]}</td>
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

const getServiceWorkerHtml =
    (state, relativeScopeUrl, relativeScriptUrl, result) => {
      let beautifiedCode = beautifyCode(result.source);
      for (importedScriptUrl in result.importedScripts) {
        if (!Object.prototype.hasOwnProperty.call(result.importedScripts,
            importedScriptUrl)) {
          continue;
        }
        // From https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
        let regExpUrl = importedScriptUrl.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
        // Deal with potentially escaped forward slashes
        regExpUrl = regExpUrl.replace(/\//g, '\\\\?/');
        /* eslint-disable max-len */
        const regExp = new RegExp(`(importScripts[\\s\\S]*?\\([\\s\\S]*?)(["'])${regExpUrl}["']`, 'g');
        /* eslint-enable max-len */
        const code = beautifyCode(result.importedScripts[importedScriptUrl]);
        beautifiedCode = beautifiedCode.replace(regExp,
        /* eslint-disable max-len */
        // Can't have new lines here as the syntax highlighter chokes on them
            `$1<details class="imported-script"><summary class="imported-script"><a href="${importedScriptUrl}">$2${importedScriptUrl}$2</a></summary><div>${code}</div></details>`);
        /* eslint-enable max-len */
      }
      return `
      <details open>
        <summary>👷 Service Worker</summary>
        <table>
          <thead>
            <tr>
              <th>State</th>
              <th>Scope</th>
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
                <a href="${result.scope}" title="${result.scope}">
                  ${relativeScopeUrl}
                </a>
              </td>
              <td>
                <a href="${result.scriptUrl}" title="${result.scriptUrl}">
                  ${relativeScriptUrl}
                </a>
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
              <th colspan="4">
                Service Worker Code <small>(beautified)</small>
                <span class="font-size">
                  <label>
                    <span class="smaller">🔠</span>
                      <input type="range" min="50" max="100" step="5" value="75"
                          id="font-size">
                    <span class="bigger">🔠</span> Font Size
                  </label>
                </span>
              </th>
            </tr>
            <tr>
              <td colspan="4">
                <pre id="sw-code"><code class="language-javascript">${
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
                <a href="${result.manifestUrl}" title="${result.manifestUrl}">
                  ${result.manifestUrl}
                </a>
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
  for (const cacheName in cacheContents) {
    if (!cacheContents.hasOwnProperty(cacheName)) {
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
                                <a href="${url}" title="${url}">${url}</a>
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

const renderHtml = (state, scope, relativeScriptUrl, result) => {
  result.events = Object.keys(result.events);
  let html = getServiceWorkerHtml(state, scope, relativeScriptUrl, result);
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

  // Allow changing the font size
  const fontSize = document.querySelector('#font-size');
  const pre = document.querySelector('#sw-code');
  fontSize.addEventListener('input', (inputEvent) => {
    pre.style.fontSize = `${parseInt(fontSize.value, 10) / 100}rem`;
  });

  // Highlight the Service Worker events in the code
  const events = document.querySelector('#events');
  const code = pre.querySelector('code');
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
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT,
        null, false);
    let node;
    while (node = walker.nextNode()) {
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
        const scriptUrl = new URL(result.scriptUrl);
        const relativeScriptUrl = `${scriptUrl.pathname}${scriptUrl.search}`;
        const scopeUrl = new URL(result.scope);
        const relativeScopeUrl = `${scopeUrl.pathname}${scopeUrl.search}`;
        const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
        // Find importScripts statements
        let importedScriptsPromises = [];
        const importedScriptsUrls = [];
        result.events = {};
        try {
          esprima.parse(result.source, {}, (node) => {
            if ((
              (node.type === 'CallExpression') &&
              (node.callee.type === 'Identifier') &&
              (node.callee.name === 'importScripts') &&
              (node.arguments) &&
              (Array.isArray(node.arguments))
            ) ||
            (
              (node.type === 'CallExpression') &&
              (node.callee.type === 'MemberExpression') &&
              (node.callee.object.type === 'Identifier') &&
              (node.callee.object.name === 'self') &&
              (node.callee.property.type === 'Identifier') &&
              (node.callee.property.name === 'importScripts'))) {
              importedScriptsPromises = importedScriptsPromises.concat(
                  node.arguments.map((arg) => {
                    // This means ```importScripts(variable)``` rather than
                    //  ```importScripts('https://example.org/sw.js')```
                    if (arg.type !== 'Literal') {
                      return Promise.resolve('');
                    }
                    const importedScriptsUrl = arg.value.replace(/\\\//g, '/');
                    importedScriptsUrls.push(importedScriptsUrl);
                    return fetch(new URL(importedScriptsUrl, result.scriptUrl), {
                      credentials: 'include',
                    })
                        .then((response) => {
                          if (response.ok) {
                            return response.text();
                          }
                          throw Error(`Couldn't load ${arg.value}`);
                        })
                    // Fail gracefully if the linked script can't be loaded
                        .catch((e) => '');
                  }));
            }
          });
        } catch (parseError) {
          result.source = JSON.stringify(parseError, null, 2);
          return renderHtml(state, relativeScopeUrl, relativeScriptUrl, result);
        }
        Promise.all(importedScriptsPromises)
            .then((importedScriptsSources) => {
              const importedScripts = {};
              importedScriptsSources.map((script, i) => {
                // Make sure trailing source map comments don't cause issues
                importedScripts[importedScriptsUrls[i]] =
            `${importedScriptsSources[i]}\n`;
              });
              result.importedScripts = importedScripts;
              return result;
            })
            .then(() => {
              // Some events may be hidden in imported scripts, so analyze them, too
              const jointSources = Object.keys(result.importedScripts).map((url) => {
                return result.importedScripts[url];
              }).join('\n') + result.source;
              try {
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
              } catch (parseError) {
                result.source = JSON.stringify(parseError, null, 2);
                return renderHtml(state, relativeScopeUrl, relativeScriptUrl, result);
              }
              return renderHtml(state, relativeScopeUrl, relativeScriptUrl, result);
            });
      });
});
