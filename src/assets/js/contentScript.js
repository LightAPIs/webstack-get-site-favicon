'use strict';

(function () {
  function createBtn(classname = '', text = '', title = '', callback) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-xs site-favicon-btn ' + classname;
    btn.type = 'button';
    btn.textContent = text || 'Button';
    btn.title = title;
    if (typeof callback === 'function') {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        callback(btn);
      });
    }
    return btn;
  }

  function imageSizeHandler(imgDom, data, pDom) {
    if (imgDom.naturalWidth && imgDom.naturalHeight) {
      if (imgDom.naturalWidth > data.width || imgDom.naturalHeight > data.height) {
        pDom.textContent = `( ${imgDom.naturalWidth} x ${imgDom.naturalHeight} )`;
      }
    }
  }

  const typechoRes = {
    tr: null,
    downloadBtn: null,
    p: null,
    input: null,
    craeteTr(fillCallbak, downloadCallback) {
      const tr = document.createElement('tr');
      const labelTd = document.createElement('td');
      const label = document.createElement('label');
      label.className = 'typecho-label';
      label.for = 'site-favicon-res-input';
      label.textContent = '图标查找结果';
      const divTd = document.createElement('td');
      divTd.colSpan = 3;
      const resDiv = document.createElement('div');
      const resInput = document.createElement('input');
      resInput.id = 'site-favicon-res-input';
      resInput.name = 'site-favicon-res-input';
      resInput.type = 'text';
      resInput.className = 'text';
      const fillBtn = createBtn('site-favicon-fill-btn', '填写', '将结果填写至链接 Logo 输入框中', btn => {
        if (typeof fillCallbak === 'function') {
          fillCallbak(btn);
        }
      });
      const downloadBtn = createBtn('site-favicon-download-btn', '下载', '将结果下载到本地以便上传至附件中', btn => {
        if (typeof downloadCallback === 'function') {
          downloadCallback(btn);
        }
      });
      const resP = document.createElement('p');
      resP.className = 'description';
      resP.textContent = '此处显示查询网站图标的结果';
      labelTd.appendChild(label);
      tr.appendChild(labelTd);
      divTd.appendChild(resDiv);
      resDiv.appendChild(resInput);
      resDiv.appendChild(fillBtn);
      resDiv.appendChild(downloadBtn);
      resDiv.appendChild(resP);
      tr.appendChild(divTd);

      this.input = resInput;
      this.downloadBtn = downloadBtn;
      this.p = resP;
      this.tr = tr;
      return this.tr;
    },
  };
  const typechoPreview = {
    tr: null,
    imageDiv: null,
    imageP: null,
    image: null,
    createTr() {
      const tr = document.createElement('tr');
      const labelTd = document.createElement('td');
      const label = document.createElement('label');
      label.className = 'typecho-label';
      label.textContent = '图标结果预览';
      const divTd = document.createElement('td');
      divTd.colSpan = 3;
      const previewDiv = document.createElement('div');
      const imageDiv = document.createElement('div');
      imageDiv.className = 'site-favicon-image-div hide-image';
      const imageDom = document.createElement('img');
      imageDom.className = 'site-favicon-image';
      imageDom.src = '';
      const imageP = document.createElement('p');
      imageP.className = 'description';
      imageP.textContent = '(图标尺寸)';
      labelTd.appendChild(label);
      tr.appendChild(labelTd);
      divTd.appendChild(previewDiv);
      imageDiv.appendChild(imageDom);
      previewDiv.appendChild(imageDiv);
      previewDiv.appendChild(imageP);
      tr.appendChild(divTd);

      this.imageDiv = imageDiv;
      this.imageP = imageP;
      this.image = imageDom;
      this.tr = tr;
      return tr;
    },
    showIcon(icon) {
      if (icon && this.image) {
        this.imageDiv.style.display = 'block';
        this.image.src = icon.url;
        this.imageP.textContent = `( ${icon.width} x ${icon.height} )`;
        if (this.image.complete) {
          imageSizeHandler(this.image, icon, this.imageP);
        } else {
          this.image.onload = () => {
            imageSizeHandler(this.image, icon, this.imageP);
          };
        }
      }
    },
    hideIcon(msg) {
      if (this.imageDiv && this.imageP) {
        this.imageDiv.style.display = 'none';
        this.imageP.textContent = msg;
      }
    },
  };

  function init() {
    const tableBody = document.querySelector('.typecho-list-table tbody');
    const urlField = document.querySelector('input[name="fields[url]"]');
    const logoField = document.querySelector('input[name="fields[logo]"]');
    if (tableBody && urlField && logoField) {
      let downloadBtnColor = '';
      let queryStatus = false;
      let downloadStatus = false;
      let downloadId = null;

      tableBody.appendChild(
        typechoRes.craeteTr(
          _fillBtn => {
            if (typechoRes.input.value.length > 0) {
              logoField.value = typechoRes.input.value;
              const webstackPreview = document.querySelector('.webstack-theme-preview-image');
              if (webstackPreview) {
                webstackPreview.src = typechoRes.input.value;
                webstackPreview.style.display = 'block';
                const logoP = logoField.parentNode.querySelector('.description');
                if (logoP) {
                  logoP.textContent = typechoPreview.imageP.textContent;
                }
              }
            }
          },
          downloadBtn => {
            if (!downloadStatus && typechoRes.input.value.length > 0) {
              downloadStatus = true;
              downloadBtnColor = downloadBtn.style.color;
              downloadBtn.style.color = '#fff';
              chrome.runtime.sendMessage(
                {
                  type: 'download',
                  data: typechoRes.input.value,
                },
                response => {
                  const { code, data, message } = response;
                  if (code === 0) {
                    downloadId = data;
                  } else {
                    downloadStatus = false;
                    downloadId = null;
                    downloadBtn.style.color = downloadBtnColor;
                    typechoRes.p.textContent = message;
                  }
                }
              );
            }
          }
        )
      );
      tableBody.appendChild(typechoPreview.createTr());

      const queryBtn = createBtn('site-favicon-query-button', '查询', '查找跳转链接的 Favicon', btn => {
        if (!queryStatus) {
          queryStatus = true;
          const oldColor = btn.style.color;
          btn.style.color = '#fff';
          typechoPreview.imageP.textContent = '正在查询图标当中...';
          chrome.runtime.sendMessage(
            {
              type: 'query',
              data: urlField.value,
            },
            response => {
              queryStatus = false;
              btn.style.color = oldColor;
              const { code, data, message } = response;
              if (code === 0) {
                typechoPreview.showIcon(data);
                typechoRes.input.value = data.url;
                if (logoField.value.length === 0) {
                  logoField.value = data.url;
                  const webstackPreview = document.querySelector('.webstack-theme-preview-image');
                  if (webstackPreview) {
                    webstackPreview.src = data.url;
                    webstackPreview.style.display = 'block';
                    const logoP = logoField.parentNode.querySelector('.description');
                    if (logoP) {
                      logoP.textContent = typechoPreview.imageP.textContent;
                    }
                  }
                }
              } else {
                typechoPreview.hideIcon(message);
                typechoRes.input.value = '';
              }
            }
          );
        }
      });
      urlField.after(queryBtn);

      chrome.runtime.onMessage.addListener(message => {
        if (downloadStatus && downloadId != null) {
          const { type, data } = message;
          if (type === 'downloadChange') {
            const { id, exists = {}, filename = {}, state = {} } = data;
            if (id === downloadId) {
              if (exists.current === false) {
                downloadStatus = false;
                downloadId = null;
                typechoRes.downloadBtn.style.color = downloadBtnColor;
                typechoRes.p.textContent = '下载文件不存在！';
              }

              if (state.current === 'interrupted') {
                downloadStatus = false;
                downloadId = null;
                typechoRes.downloadBtn.style.color = downloadBtnColor;
                typechoRes.p.textContent = '下载被中断！';
              }

              if (state.current === 'complete') {
                downloadStatus = false;
                downloadId = null;
                typechoRes.downloadBtn.style.color = downloadBtnColor;
                if (filename.current) {
                  typechoRes.p.textContent = filename.current;
                } else {
                  typechoRes.p.textContent = '下载完成，但是没有获取到文件路径。';
                }
              }

              if (filename.current) {
                downloadStatus = false;
                downloadId = null;
                typechoRes.downloadBtn.style.color = downloadBtnColor;
                typechoRes.p.textContent = filename.current;
              }
            }
          }
        }
      });
    }
  }

  init();
})();
