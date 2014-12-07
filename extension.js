
(function () {
  var stylesheetUrl = chrome.extension.getURL("hypestyles.css")

  // This is all the JS that will be injected in the document body
  var main = function () {

    /**
     * Return outerHTML for the first element in a jQuery object,
     * or an empty string if the jQuery object is empty
     */
    jQuery.fn.outerHTML = function () {
      return (this[0]) ? this[0].outerHTML : ''
    }

    function generateRandomString () {
      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
      var str = ""
      for (var i = 0; i < 8; i++) {
        var rnum = Math.floor(Math.random() * chars.length)
        str += chars.charAt(rnum)
      }
      return str
    }

    // Here is where we can randomly generate the name of the styles to avoid them checking for specific names.
    // Can add more here if they check additional names.
    // ref:http://jonraasch.com/blog/javascript-style-node
    var triArrowString = generateRandomString()
    var css = document.createElement('style')
    css.type = 'text/css'
    var styles = '.'+triArrowString+'{ width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent;	border-top: 10px solid #494949; }'
    styles += '.arrow:hover .'+triArrowString+'{ border-top: 10px solid #0063DC; }'

    // handle inserting stylesheet for IE
    if (css.styleSheet) css.styleSheet.cssText = styles
    else css.appendChild(document.createTextNode(styles))

    document.getElementsByTagName("head")[0].appendChild(css)

    // Adds a download button next to each track
    function initDownloadButtons () {
      // Wait for the tracks script to load
      var tracks = window.displayList && window.displayList.tracks

      if (!tracks) {
        setTimeout(initDownloadButtons, 50)
      } else {
        jQuery('ul.tools').each(function (index, track) {
          var song = tracks[index]
          if (!song || !song.id || !song.key) {
            console.log('warning unable to lookup song', index, track)
            return
          }

          var title  = song.song
          var artist = song.artist
          var name   = ''

          if (title || artist) {
            if (title && artist) {
              name = artist + ' - ' + title
            } else {
              name = (title || artist)
            }
          }

          if (!jQuery(track).data("hasDownloadButton")) {
            jQuery.getJSON("/serve/source/" + song.id + "/" + song.key, function (data) {
              var downloadButton = document.createElement("a")
              downloadButton.target = "_top"
              downloadButton.href = data.url
              downloadButton.className = "DownloadSongButton"
              downloadButton.download = name.replace(/\./g, '') + '.mp3'
              downloadButton.innerHTML = '<table class="arrow"><tr><td><div class="rect-arrow"></div></td></tr><tr><td class="' + triArrowString + '"></td></tr></table>'
              jQuery(track).prepend('<li class="dl"><table class="spacer"></table>' + jQuery(downloadButton)[0].outerHTML + '</li>')
            })

            jQuery(track).data("hasDownloadButton", true)
          }
        })
      }
    }

    // workaround for filename downloads issue
    // https://code.google.com/p/chromium/issues/detail?id=373182
    function downloadFile (sUrl, fileName) {
      var xhr = new XMLHttpRequest()
      xhr.open("GET", sUrl, true)
      xhr.responseType = "blob"
      xhr.onload = function () {
        var res = xhr.response
        var blob = new Blob([ res ], { type: "audio/mp3" })
        var url = window.URL.createObjectURL(blob)
        var a = document.createElement("a")
        a.href = url
        a.download = fileName
        a.style = "display: none"
        a.click()
        window.URL.revokeObjectURL(url)
      }
      xhr.send()
    }

    jQuery('ul.tools').on('click', '.DownloadSongButton', function (e) {
      var anchor = e.currentTarget
      console.log("Downloading - " + anchor.download)
      downloadFile(anchor.href, anchor.download)
      return false
    })

    initDownloadButtons()
    jQuery(document).ajaxComplete(initDownloadButtons)
  }

  var top = document.body || document.head

  // create the script objects
  var injectedScript  = document.createElement('script')
  injectedScript.type = 'text/javascript'
  injectedScript.text = '(' + main + ')("");'
  top.appendChild(injectedScript)

  // Lets create the CSS object. This has to be done this way rather than the manifest.json
  // because we want to override some of the CSS properties so they must be injected after.
  var injectedCSS  = document.createElement('link')
  injectedCSS.type = 'text/css'
  injectedCSS.rel  = 'stylesheet'
  injectedCSS.href = stylesheetUrl
  top.appendChild(injectedCSS)
})();

