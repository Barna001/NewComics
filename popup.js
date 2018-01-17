// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', () => {
  init();
  handleAdd();
})

function init() {
  const comics = chrome.storage.sync.get(null, comics => {
    console.log('COMICS', comics);
    container = document.getElementsByClassName('container')[0];
    Object.keys(comics).forEach(id => {
      const comic = comics[id];
      container.appendChild(createNewComic(id, comic.url, comic.imageSrc, comic.title));
    });
    handleDelete();
    handleNavigation();
  });
}

function handleAdd() {
  const addButton = document.getElementById('addCurrentComic');
  container = document.getElementsByClassName('container')[0];
  addButton.onclick = () => {
    getCurrentTabInfos((url, imageSrc, title) => {
      const newComic = createNewComic(Math.random(), url, imageSrc, title);
      container.appendChild(newComic);
      saveNewComic(newComic.id, url, imageSrc, title);
    });
  }
}

function handleNavigation() {
  const links = document.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    (() => {
      const ln = links[i];
      const location = ln.href;
      ln.onclick = () => {
          chrome.tabs.create({active: true, url: location});
      };
    })();
  }
}

function handleDelete() {
  const trashes = document.getElementsByClassName('fa-trash');
  for (let i = 0; i < trashes.length; i++) {
    (() => {
      const trash = trashes[i];
      trash.onclick = function () {
        const removable = trash.parentNode;
        removable.parentNode.removeChild(removable);
        chrome.storage.sync.remove(removable.id);
      };
    })();
  }
}

function getCurrentTabInfos(callback) {

  chrome.tabs.query({active: true}, tabs => {

    const tab = tabs[0];
    const url = tab.url;
    chrome.tabs.executeScript(tab.id, {
      code: 'document.querySelector("#rightside .rightBox img").src'
    }, (imageSrc) => {
      callback(url, imageSrc, getTitle(url));
    });
  });
}

function getTitle(url) {
  return url.substring(url.indexOf('/Comic/') + 7, url.length);
}

function saveNewComic(id, url, imageSrc, title) {
  let updates = {};
  updates[id] = {
    url,
    imageSrc,
    title
  };
  chrome.storage.sync.set(updates, () => {
    handleDelete();
    handleNavigation();
  });
}

function createNewComic(id, url, imageSrc, title) {
  const wrapper = createWrapper(id);
  const image = createImage(imageSrc);
  const link = createLink(url, title);
  const trash = createTrash();
  wrapper.appendChild(image);
  wrapper.appendChild(link);
  wrapper.appendChild(trash);
  return wrapper;
}

function createWrapper(id) { 
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper');
  wrapper.id = id;
  return wrapper;
}

function createImage(imageSrc) {
  const image = document.createElement('img');
  image.src = imageSrc;
  return image;
}

function createLink(url, title) {
  const link = document.createElement('a');
  link.href = url;
  link.text = title;
  return link;
}

function createTrash() {
  const trash = document.createElement('span');
  trash.classList.add('fa', 'fa-trash');
  return trash;
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = 'document.body.style.backgroundColor=' + color + ';';
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument 'tabId', the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
}

/**
 * Gets the saved background color for url.
 *
 * @param {string} url URL whose background color is to be retrieved.
 * @param {function(string)} callback called with the saved background color for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedBackgroundColor(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which background color is to be saved.
 * @param {string} color The background color to be saved.
 */
function saveBackgroundColor(url, color) {
  var items = {};
  items[url] = color;
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
  chrome.storage.sync.set(items);
}
