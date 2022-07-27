'use strict';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { type, data } = message;
  switch (type) {
    case 'query':
      if (window.getFavicon) {
        if (data) {
          try {
            window.getFavicon
              .detectIcon(data)
              .then(res => {
                if (res && res.url) {
                  sendResponse({
                    code: 0,
                    data: res,
                    message: '',
                  });
                } else {
                  sendResponse({
                    code: 1,
                    data: null,
                    message: chrome.i18n.getMessage('loadError'),
                  });
                }
              })
              .catch(e => {
                sendResponse({
                  code: 1,
                  data: null,
                  message: chrome.i18n.getMessage('loadError'),
                });
              });
          } catch (e) {
            sendResponse({
              code: 1,
              data: null,
              message: String(e),
            });
          }
        } else {
          sendResponse({
            code: 1,
            data: null,
            message: '没有提供网址哦',
          });
        }
      } else {
        sendResponse({
          code: 1,
          data: null,
          message: chrome.i18n.getMessage('internalError'),
        });
      }
      return true;
    case 'download':
      chrome.downloads.download(
        {
          url: data,
        },
        downloadId => {
          if (!chrome.runtime.lastError && downloadId != undefined) {
            sendResponse({
              code: 0,
              data: downloadId,
              message: '下载启动',
            });
          } else {
            sendResponse({
              code: 1,
              data: null,
              message: '下载出错！',
            });
          }
        }
      );
      return true;
  }
});

chrome.downloads.onChanged.addListener(downloadDelta => {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    tabs => {
      if (!chrome.runtime.lastError && tabs && tabs[0] && tabs[0].id != null) {
        const { id, state = {}, filename = {} } = downloadDelta;
        if (state.current === 'complete') {
          if (filename.current) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'downloadChange',
              data: downloadDelta,
            });
          } else {
            //! Firefox Polyfill
            chrome.downloads.search(
              {
                id,
              },
              downloadItems => {
                if (!chrome.runtime.lastError && Array.isArray(downloadItems) && downloadItems.length === 1) {
                  const dItem = downloadItems[0];
                  if (dItem.filename) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      type: 'downloadChange',
                      data: Object.assign(downloadDelta, {
                        filename: {
                          current: dItem.filename,
                          previous: '',
                        },
                      }),
                    });
                  } else {
                    chrome.tabs.sendMessage(tabs[0].id, {
                      type: 'downloadChange',
                      data: downloadDelta,
                    });
                  }
                } else {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'downloadChange',
                    data: downloadDelta,
                  });
                }
              }
            );
          }
        } else {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'downloadChange',
            data: downloadDelta,
          });
        }
      }
    }
  );
});
