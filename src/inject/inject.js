var options = { // example options structure
    'supported': {
      'ext': {
        'video': [
          'mp4',
          'webm',
          'gifv'
        ],
        'image': [
          'jpg',
          'jpeg',
          'png',
          'gif',
        ]
      }
    }
  },
  curImg, last = {'x':0,'y':0};

function getExt(link) {
  var sarr = link.split('.');
  if (sarr.length === 0) {
    return;
  }
  return sarr[sarr.length-1];
}

function getDomain(link) {
  var domain;
  if (link.indexOf("://") > -1) {
    domain = link.split('/')[2];
  }
  else {
    domain = link.split('/')[0];
  }
  domain = domain.split(':')[0];
  return domain;
}

function generateCSS(event) {
  if (event.clientX === last.x && event.clientY === last.y) {}
  var imgHeight = 0,
      imgWidth = 0,
      top = window.scrollY + event.clientY,
      left = window.scrollX + event.clientX;
  if (curImg) {
    imgHeight = parseInt(window.getComputedStyle(document.getElementById('__markusZoom')).height);
    imgWidth = parseInt(window.getComputedStyle(document.getElementById('__markusZoom')).width);
  }
  if ((window.scrollY + event.clientY + imgHeight) > (window.scrollY + window.innerHeight)) {
    top = top - ((window.scrollY + event.clientY + imgHeight) - (window.scrollY + window.innerHeight)) - 27;
  }
  if ((window.scrollX + event.clientX + imgWidth) > (window.scrollX + window.innerWidth - 27)) {
    left = left - ((window.scrollX + event.clientX + imgWidth) - (window.scrollX + window.innerWidth)) - 22;
  }
  var css = {
    'position':   'absolute',
    'z-index':    '2147483647',
    'max-height': (window.innerHeight - 27) + 'px',
    'max-width':  (window.innerWidth - 27) + 'px',
    'top':        (top + 5) + 'px',
    left:         (left + 5) + 'px;',
    toCSS: function (){
      var css = '';
      for (prop in this) {
        if (this.hasOwnProperty(prop) && typeof this[prop] !== 'function') {
          css += prop + ':' + this[prop] + ';';
        }
      }
      return css;
    }
  }
  return css.toCSS();
}

function removeTitle(el) {
  if (el.title) {
    el.dataset.markusZoomTitle = el.title;
    el.title = '';
  }
}

function restoreTitle(el) {
  if (!el.title && el.dataset.markusZoomTitle) {
    el.title = el.dataset.markusZoomTitle;
    el.dataset.markusZoomTitle = '';
  }
}
function overLink(event, curRect) {
  if (
      event.clientY > parseInt(curRect.top) && 
      event.clientY < parseInt(curRect.bottom) && 
      event.clientX > parseInt(curRect.left) && 
      event.clientX < parseInt(curRect.right)
    ) {
    return true;
  }
  return false;
}

function hideImg(event, curRect, cur) {
  if (!overLink(event, curRect)) {
    if (curImg) {
      document.body.removeChild(curImg);
      curImg = undefined;
      restoreTitle(cur);
    }
  } else if (curImg) {
    curImg.style.cssText = generateCSS(event);
  }
}
function addEventListenersTo(links) {
  [].slice.call(links).forEach(function(cur){
    if (cur.className.indexOf('__markusZoom') === -1) {
      var ext, domain, href, curRect;
      href = cur.href;
      domain = getDomain(href)
      ext = getExt(href);
      if (options.supported.ext.image.indexOf(ext) > -1 || options.supported.ext.video.indexOf(ext) > -1) {
        cur.addEventListener('mousemove', function(event) {
          curRect = this.getBoundingClientRect();
          if (overLink(event, curRect)) {
            removeTitle(cur);
            if (!curImg) {
              if (options.supported.ext.image.indexOf(ext) > -1) {
                curImg = document.createElement('img');
                curImg.addEventListener('load', function() {
                  if (curImg) {
                    curImg.style.cssText = generateCSS(event);
                  }
                });
              } else if (options.supported.ext.video.indexOf(ext) > -1) {
                curImg = document.createElement('video');
                curImg.addEventListener('canplay', function() {
                  if (curImg) {
                    curImg.style.cssText = generateCSS(event);
                  }
                });
                curImg.autoplay = 'true';
                curImg.loop = true;
                if (ext === 'gifv') {
                  href = href.replace('gifv', 'mp4');
                }
              }
              curImg.addEventListener('mouseover', function(event){
                hideImg(event, curRect, cur);
              });
              curImg.addEventListener('mousemove', function(event){
                hideImg(event, curRect, cur);
              });
              curImg.addEventListener('mouseout', function(event){
                hideImg(event, curRect, cur);
              });
              curImg.addEventListener('click', function(event){
                // ez clickthrough
                cur.click();
              });
              curImg.src = href;
              curImg.id = '__markusZoom';
              document.body.appendChild(curImg);
            }
            if (event.clientX !== last.x || event.clientY !== last.y) {
              if (curImg) {
                last.x = event.clientX;
                last.y = event.clientY;
                curImg.style.cssText = generateCSS(event);
              }
            }
          } else {
            if (curImg) {
              hideImg(event, curRect, cur);
            }
          }
        });
        cur.addEventListener('mouseout', function(event) {
          hideImg(event, curRect, cur);
        });
      }
      cur.className += ' __markusZoom';
    }
  });
}

chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);
      // ----------------------------------------------------------
      // This part of the script triggers when page is done loading
      console.log("Hello. This message was sent from scripts/inject.js");
      // ----------------------------------------------------------
      var observeDOM = (function() {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
        eventListenerSupported = window.addEventListener;
        
        return function(obj, callback) {
          if (MutationObserver) {
            // define a new observer
            var obs = new MutationObserver(function(mutations, observer){
              if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
                callback();
              }
            });
            // have the observer observe foo for changes in children
            obs.observe(obj, { childList:true, subtree:true });
          }
          else if (eventListenerSupported){
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
          }
        }
      })();
      
      // Observe a specific DOM element:
      observeDOM( document.body.parentNode ,function(){ 
        var links = document.getElementsByTagName('a');
        addEventListenersTo(links);
      });
      }
    }, 10);
});