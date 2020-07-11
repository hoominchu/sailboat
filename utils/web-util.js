function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function changeBookmarks(lastTaskId, cTaskId) {
    function createBookmarks(taskId, tasks) {
        function addBookmarks(parentNode) {
            let childrenNode = parentNode.children;
            for (let idx in childrenNode) {
                let bookmarkNode = childrenNode[idx];
                // if it has url property, then it is not a folder
                if (bookmarkNode.hasOwnProperty("url")) {
                    // add the url under the parent
                    chrome.bookmarks.create({
                        'index': bookmarkNode.index,
                        'parentId': parentNode.id,
                        'title': bookmarkNode.title,
                        'url': bookmarkNode.url
                    });
                } else {
                    // if it is a folder, create it, call addBookmarks on the node
                    chrome.bookmarks.create({
                        'index': bookmarkNode.index,
                        'parentId': parentNode.id,
                        'title': bookmarkNode.title
                    }, function (newFolder) {
                        bookmarkNode.id = newFolder.id;
                        addBookmarks(bookmarkNode);
                    })
                }
            }
        }

        if (!isEmpty(tasks[taskId].bookmarks)) {
            if (tasks[taskId] && tasks[taskId].bookmarks && tasks[taskId].bookmarks[0] && tasks[taskId].bookmarks[0].children) {
                let bookmarks = tasks[taskId].bookmarks[0].children;
                let bookmarksInBookmarksBar;
                let bookMarksInOtherBookmarks;
                for (let idx in bookmarks) {
                    if (bookmarks[idx].id === "1") { // id = 1 is always bookmarks bar
                        bookmarksInBookmarksBar = bookmarks[idx];
                    } else if (bookmarks[idx].id === "2") { // id = 2 is always other bookmarks
                        bookMarksInOtherBookmarks = bookmarks[idx];
                    }
                }
                addBookmarks(bookmarksInBookmarksBar);
                addBookmarks(bookMarksInOtherBookmarks);
            }
        }
    }

    // Remove the existing bookmarks in bar and other bookmarks
    chrome.bookmarks.getChildren("1", function (children) {
        for (var i = 0; i < children.length; i++) {
            chrome.bookmarks.removeTree(children[i].id);
        }
        chrome.bookmarks.getChildren("2", function (children) {
            for (var i = 0; i < children.length; i++) {
                chrome.bookmarks.removeTree(children[i].id)
            }
            // Now create the bookmarks for the current task.
            createBookmarks(cTaskId, TASKS);
        });
    });
}

function returnQuery(selectorDict) {
    let query = "";

    for (let i = 0; i < selectorDict.length; i++) {
        let tagName, className, idName, attributeName, attributeValue;

        if (selectorDict[i]["tag"] != null) {
            tagName = selectorDict[i]["tag"];
        } else {
            tagName = null;
        }
        if (selectorDict[i]["class"] != null) {
            className = selectorDict[i]["class"];
        } else {
            className = null;
        }
        if (selectorDict[i]["id"] != null) {
            idName = selectorDict[i]["id"];
        } else {
            idName = null;
        }
        if (selectorDict[i]["attribute"] != null) {
            attributeName = selectorDict[i]["attribute"];
        } else {
            attributeName = null;
        }
        if (selectorDict[i]["value"] != null) {
            attributeValue = selectorDict[i]["value"];
        } else {
            attributeValue = null;
        }

        //Creating query for querySelector
        if (tagName != null) {
            query = query + tagName;
        }

        if (className != null) {
            const classes = className.replace(/\s/g, ".");
            query = query + "." + classes;
        }

        if (idName != null) {
            query = query + "#" + idName;
        }

        if (attributeName != null) {
            query = query + "[" + attributeName + "='" + attributeValue + "']";
        }

        if ((i + 1) < selectorDict.length) {
            query = query + " ";
        }
    }
    return query;
}

function updateStorage(key, obj) {
    const tempObj = {};
    tempObj[key] = obj;
    chrome.storage.local.set(tempObj);
}

function getDomainFromURL(url) {
    let domain = "";
    const arr = url.split('/');
    if (url.search("http") !== -1) {
        domain = arr[2];
    }
    else {
        domain = arr[0];
    }
    return domain;
}

function openTabs(arrayOfUrls) {
    for (let i = 0; i < arrayOfUrls.length; i++) {
        chrome.tabs.create({"url": arrayOfUrls[i]});
    }
}

function getIdsOfCurrentlyOpenTabs(windowId, callback) {
    const ids = [];
    if (windowId) {
        chrome.tabs.query({"windowId": windowId}, function (tabs) {
            for (let i = 0; i < tabs.length; i++) {
                ids.push(tabs[i].id);
            }
            if (callback) {
                callback(ids);
            }
        });
    }
    else {
        chrome.tabs.query({}, function (tabs) {
            console.log(tabs);
            for (let i = 0; i < tabs.length; i++) {
                ids.push(tabs[i].id);
            }
            if (callback) {
                callback(ids);
            }
        });
    }

}

function setTaskBadge(windowId, task_id) {
    getIdsOfCurrentlyOpenTabs(windowId, function (ids) {
        for (let i = 0; i < ids.length; i++) {
            chrome.browserAction.setBadgeText({"text": TASKS[task_id].name.slice(0, 4), "tabId": ids[i]});
        }
    });
}

//
// function removeFromPageContentAndTextLog(url){
//     var isLiked = false;
//     var isOpen = false;
//
//     if(TASKS){
//         for(var task in TASKS){
//           if(task != "lastAssignedId"){
//             if(TASKS[task]["likedPages"].indexOf(url)>-1){
//               isLiked = true;
//             }
//             for(var i = 0; i<TASKS[task]["tabs"].length; i++){
//               if(TASKS[task]["tabs"][i].url == url){
//                 isOpen = true;
//               }
//             }
//           }
//         }
//     }
//
//     if(!isLiked && !isOpen){
//       chrome.storage.local.get("Text Log", function(textlog){
//         var textlog = textlog["Text Log"];
//         delete textlog[url];
//         //console.log("Deleted %s from Text Log", url);
//         updateStorage("Text Log", textlog);
//       });
//
//       chrome.storage.local.get("Page Content", function(pageContent){
//         var pageContent = pageContent["Page Content"];
//         delete pageContent[url];
//         //console.log("Deleted %s from Page Content.", url);
//         updateStorage("Page Content", pageContent);
//       });
//     }
// }

function reloadSailboatTabs() {
    return;
    chrome.tabs.query({"title": "Sailboat"}, function (tabs) { //Reload the Sail Boat page when window is switched.
        for (var i = 0; i < tabs.length; i++) {
            chrome.tabs.reload(tabs[i].id);
        }
    });
}

function removeWordsFromString(wordsToRemove, string) {
    //wordsToRemove is an array of words that should be removed.
    //this function returns a string with the specific words removed.

    let words = string.split(" ");
    const stringLength = words.length;
    for (let i = 0; i < stringLength; i++) {
        if (wordsToRemove.indexOf(words[i]) > -1) {
            words.splice(i, 1);
            i = i - 1; //reset the counter to the previous position.
        }
    }
    const newString = words.join(" ");
    return newString;
}


function searchHistory(query, tabId) {
    chrome.history.search(query, function (results) {
        chrome.tabs.sendMessage(tabId, {"type": "set-search-results-from-history", "results": results});
    });
}

