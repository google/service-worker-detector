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

const beautify = source => {
  const beautified = js_beautify(source, {
    indent_size: 2,
    no_preserve_newlines: true,
    wrap_line_length: 80,
    end_with_newline: true
  });
  return Prism.highlight(beautified, Prism.languages.javascript);
};

const getHtml = (state, relativeUrl, result) => {
  return `
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
              <a href="${result.scriptUrl}" target="_blank">${relativeUrl}</a>
            </td>
            <td>
              <ul id="events">
                ${result.events.sort().map(event => {
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
            <th colspan="3">Service Worker Code <small>(beautified)</small></th>
          </tr>
          <tr>
            <td colspan="3">
              <pre><code id="code" class="language-javascript>${
                  beautify(result.source)}</code></pre>
            </td>
          </tr>
        </tbody>
      </table>`;
};

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  chrome.tabs.sendMessage(tabs[0].id, {type: 'getServiceWorker'}, result => {
    if (!result.scriptUrl || !result.state) {
      return;
    }
    const url = new URL(result.scriptUrl);
    const relativeUrl = `${url.pathname}${url.search}`;
    const state = result.state.charAt(0).toUpperCase() + result.state.slice(1);
    result.events = {};
    try {
      esprima.parse(result.source, {}, node => {
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
    container.innerHTML = getHtml(state, relativeUrl, result);

    const events = document.querySelector('#events');
    const code = document.querySelector('#code');
    events.addEventListener('click', clickEvent => {
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
      tokenStrings.forEach(tokenString => {
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
