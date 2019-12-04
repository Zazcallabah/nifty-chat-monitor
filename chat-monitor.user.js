// ==UserScript==
// @name           Nifty Chat Monitor - InlineImgOnly
// @namespace      http://somewhatnifty.com
// @description    inlines images in twitch chat, both in live chat and on vods
// @match        https://www.twitch.tv/*
// @version    0.1
// @updateURL https://raw.githubusercontent.com/Zazcallabah/nifty-chat-monitor/master/chat-monitor.user.js
// @downloadURL https://raw.githubusercontent.com/Zazcallabah/nifty-chat-monitor/master/chat-monitor.user.js
// @require  https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @resource material-icons https://fonts.googleapis.com/icon?family=Material+Icons
// ==/UserScript==

function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        btargetsFound   = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound     = actionFunction (jThis);
                if (cancelFound)
                    btargetsFound   = false;
                else
                    jThis.data ('alreadyFound', true);
            }
        } );
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            iframeSelector
                                        );
                },
                3000
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}

//text-fragment

var MESSAGE_CONTAINER = ".chat-list .tw-full-height";
waitForKeyElements(MESSAGE_CONTAINER, function(){loadlive(MESSAGE_CONTAINER)});

var MESSAGE_CONTAINER2 = ".qa-vod-chat .tw-full-height";
waitForKeyElements(MESSAGE_CONTAINER2, function(){loadvod(MESSAGE_CONTAINER2)});


function loadvod(sel) {

	var target = document.querySelector(sel);
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			var newNodes = mutation.addedNodes; // DOM NodeList
			if (newNodes !== null) {
				// If there are new nodes added
				newNodes.forEach(function(newNode) {

					if (newNode.nodeType == Node.ELEMENT_NODE) {
						newNode.querySelectorAll(".text-fragment").forEach(function(fragment) {
                            if( fragment.innerHTML.includes("<") )
                                return;
							var re = /(https?:\/\/.*(?:jpg|png|gif|jpeg))/gm;
                            fragment.innerHTML = fragment.innerHTML.replace("media.giphy.com", "media1.giphy.com").replace(re,"<img src=\"$&\"/>");
                    		var giphy_re = /https?:\/\/giphy\.com\/gifs\/(.*-)?([a-zA-Z0-9]+)/gm;
						   fragment.innerHTML = fragment.innerHTML.replace(giphy_re,"https://media1.giphy.com/media/$2/giphy.gif");
						});
					}
				});
			}
		});
	});
	observer.observe(target, {childList: true,subtree:true});
}


function loadlive(sel) {

	var target = document.querySelector(sel);
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			var newNodes = mutation.addedNodes; // DOM NodeList
			if (newNodes !== null) {
				// If there are new nodes added
				newNodes.forEach(function(newNode) {
					if (newNode.nodeType == Node.ELEMENT_NODE) {
						if (!newNode.classList.contains("chat-line__message")) {
							// Only treat chat messages
							return;
						}
						newNode.querySelectorAll(".chat-line__message > a").forEach(function(link) {
							var re = /(.*(?:jpg|png|gif|jpeg))$/gm;
							if (re.test(link.textContent)) {
								link.innerHTML =
								'<img src="' + link.textContent.replace("media.giphy.com", "media1.giphy.com") + '" alt="' + link.textContent + '"/>';
							}
							var match = /^https?:\/\/giphy\.com\/gifs\/(.*-)?([a-zA-Z0-9]+)$/gm.exec(link.textContent);
							if (match) {
								var imageUrl = "https://media1.giphy.com/media/" + match[2].split("-").pop() + "/giphy.gif";
								link.innerHTML = '<img src="' + imageUrl + '" alt="' + link.textContent + '"/>';
							}
							match = /^https?:\/\/(www\.)?(youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+).*$/gm.exec(link.textContent);
							if (match) {
								imageUrl = "https://img.youtube.com/vi/" + match[3] + "/mqdefault.jpg";
								link.innerHTML = link.textContent + '<br/><img src="' + imageUrl + '" alt="' + link.textContent + '"/>';
							}
						});
					}
				});
			}
		});
	});
	observer.observe(target, {childList: true});
}

