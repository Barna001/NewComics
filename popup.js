// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', () => {
  init();
  handleAdd();
})

function calculateDate(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const page = new DOMParser().parseFromString(xhr.responseText, 'text/html'); 
      const date = page.querySelector('.listing tbody tr:nth-of-type(3) td:nth-of-type(2)').innerText;
      callback(date, new Date(date) < new Date());
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
}

function init() {
  chrome.cookies.get({ url: 'http://readcomiconline.to', name: 'cf_clearance' }, (cookie) => {
    if (!cookie) {
      chrome.tabs.create({ url: 'http://readcomiconline.to'});
    }
  });
  const comics = chrome.storage.sync.get(null, comics => {
    container = document.getElementsByClassName('container')[0];
    Object.keys(comics).forEach(id => {
      const comic = comics[id];
      const comicDOM = createNewComic(id, comic.url, comic.imageSrc, comic.title);
      container.appendChild(comicDOM);
      calculateDate(comic.url, (date, isNewComicPresent) => {
        if (isNewComicPresent) {
          console.log(date);
          console.log(new Date(date) < new Date());
        };
      });
    });
    handleNavigation();
    handleDelete();
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

function createNewComic(id, url, imageSrc, title) {
  const wrapper = createWrapper(id);
  const image = createImage(imageSrc);
  const link = createLink(url, title);
  const sign = createSign();
  const trash = createTrash();
  wrapper.appendChild(image);
  wrapper.appendChild(link);
  wrapper.appendChild(sign);
  wrapper.appendChild(trash);
  return wrapper;
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

function createSign() {
  const sign = document.createElement('img');
  sign.src = 'icons/exclamation-mark.png';
  sign.classList.add('showSign');
  return sign;
}

function createTrash() {
  const trash = document.createElement('span');
  trash.classList.add('fa', 'fa-trash');
  return trash;
}
