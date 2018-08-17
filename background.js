"use strict";

createDefaultTask();

//Add keyboard shortcuts here.
chrome.commands.onCommand.addListener(function (command) {
    if (command === "like-page") {
        chrome.tabs.get(activeTabId, function (tab) {
            likePage(tab.url, "shortcut");
        })
    } else if (command === "pause-tasks") {
        saveTaskInWindow(CTASKID);
        deactivateTaskInWindow(CTASKID);
        activateTaskInWindow("0");
    }
});


//Save downloads to appropriate task folder
chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
    var currentTaskName = TASKS[CTASKID].name;
    suggest({filename: currentTaskName + "/" + item.filename});
});


// // When a cookie is being set
// chrome.cookies.onChanged.addListener(function (changeInfo) {
//     if (!changeInfo['removed']) {
//         const cookie = changeInfo['cookie'];
//         const cause = changeInfo['cause'];
//         const url = extrapolateUrlFromCookie(cookie);
//         delete cookie['hostOnly'];
//         delete cookie['session'];
//         chrome.storage.local.get("CTASKID", function (ctaskid) {
//             ctaskid = ctaskid["CTASKID"];
//             cookie['url'] = url;
//             cookie['storeId'] = ctaskid;
//             chrome.cookies.set(cookie, function (c) {
//                 if (c['storeId'] !== '0') {
//                     console.log(c);
//                 }
//             });
//         })
//     }
// });
//
// // When a cookie is being removed
// chrome.cookies.onChanged.addListener(function (changeInfo) {
//     if (changeInfo['removed']) {
//         const cookie = changeInfo['cookie'];
//         const cause = changeInfo['cause'];
//         const url = extrapolateUrlFromCookie(cookie);
//         let newCookie = {};
//         newCookie['url'] = url;
//         newCookie['name'] = cookie['name'];
//         chrome.storage.local.get("CTASKID", function (ctaskid) {
//             ctaskid = ctaskid["CTASKID"];
//             newCookie['storeId'] = ctaskid;
//             chrome.cookies.remove(newCookie);
//         })
//     }
// });


function extrapolateUrlFromCookie(cookie) {
    var prefix = cookie.secure ? "https://" : "http://";
    if (cookie.domain.charAt(0) == ".")
        prefix += "www";

    return prefix + cookie.domain + cookie.path;
}


//todo consolidate all the message listeners into one listner
chrome.runtime.onMessage.addListener(function (request, sender) {

    // refreshContextMenu();

    if (request.type === "create-task") {

        if (CTASKID === 0) {

            chrome.bookmarks.getTree(function (bookmarks) {
                createTask(request.taskName, request.tabs, bookmarks);
                if (request.activated) {
                    saveTaskInWindow(CTASKID);
                    console.log("task created");
                    deactivateTaskInWindow(CTASKID);
                    activateTaskInWindow(TASKS["lastAssignedId"]);
                }
            });
        }
        else {
            createTask(request.taskName, request.tabs, {});
            if (request.activated) {
                saveTaskInWindow(CTASKID);
                console.log("task created with tabs");
                deactivateTaskInWindow(CTASKID);
                activateTaskInWindow(TASKS["lastAssignedId"]);
            }
        }
    }

    if (request.type === "add-to-task") {
        // console.log(window.tabs);
        const senderTab = sender.tab;
        const senderWindowId = senderTab.windowId;
        chrome.windows.get(senderWindowId, {populate: true}, function (window) {
            const tabs = [];
            for (let i = 0; i < window.tabs.length; i++) {
                if (window.tabs[i].highlighted) {
                    tabs.push(window.tabs[i]);
                }
            }

            //tabs array is now ready to use

            //remove tabs that were highlighted
            const tabIdsToClose = [];
            for (let j = 0; j < tabs.length; j++) {
                tabIdsToClose.push(tabs[j].id)
            }
            chrome.tabs.remove(tabIdsToClose);

            addTabsToTask(request.taskId, tabs);
        });
    }

    if (request.type === "switch-task" && request.nextTaskId !== "") {
        saveTaskInWindow(CTASKID);
        console.log("switch");
        deactivateTaskInWindow(CTASKID);
        activateTaskInWindow(request.nextTaskId);
    }

    if (request.type === "close-task") {
        closeTask(request.taskId);
    }

    if (request.type === "rename-task") {
        renameTask(request.taskId, request.newTaskName);
    }

    if (request.type === "delete-task") {
        deleteTask(request.taskToRemove);
    }

    if (request.type === "download-tasks") {
        downloadTasks();
    }

    if (request.type === "like-page") {
        likePage(request.url, CTASKID);
    }

    if (request.type === "add-url-to-task") {
        addURLToTask(request.url, request.taskId);
    }

    // if(request.type == "idle-time"){
    //   addIdleTime(request.url, request["idle-time"]);
    // }

    if (request.type === "archive-task") {
        archiveTask(request.taskId);
    }

    if (request.type === "pause-tasks") {
        CTASKID = 0;
        updateStorage("CTASKID", 0);
    }

    if (request.type === "open-liked-pages") {
        openLikedPages(request.taskId);
    }

    if (request.type === "search-archive") {
        if (request.query != null) {
            chrome.tabs.create({"url": "html/searchArchive.html?q=" + request.query});
        }
    }

    if (request.type === "onmouseover") {
        const fromWindowID = sender.tab.windowId;
        const targetURL = request["target-url"];
        const highlightTabIndexes = [sender.tab.index];
        chrome.windows.get(fromWindowID, {"populate": true}, function (window) {
            window.tabs.forEach(function (tab) {
                if (targetURL === tab.url) {
                    highlightTabIndexes.push(tab.index)
                }
            });
            chrome.tabs.highlight({"windowId": fromWindowID, "tabs": highlightTabIndexes});
        });
    }

    if (request.type === "onmouseout") {
        chrome.tabs.highlight({"windowId": sender.tab.windowId, "tabs": sender.tab.index});
    }

    if (request.type === "clicklog") {
        chrome.storage.local.get("Click Log", function (clickLog) {
            clickLog = clickLog["Click Log"];
            if (clickLog.hasOwnProperty(request.text)) {
                clickLog[request.text]++;
            } else {
                clickLog[request.text] = 1;
            }
            chrome.storage.local.set({"Click Log": clickLog});
        });
    }

    if (request.type === "give me open tasks") {
        chrome.runtime.sendMessage({
            "type": "array of open tasks",
            "openTasks": Object.keys(taskToWindow)
        });
    }

    if (request.type === "likePages") {
        likePages(request.urls, request.taskId);
    }
    if (request.type === "deletePages") {
        deleteFromHistory(request.urls, request.taskId);
    }

    if(request.type === "restore-tasks"){
      TASKS = request.taskObject;
      updateStorage("TASKS", TASKS);
    }

    if(request.type === "give unarchived tasks dict"){
      let tasksDict = filterTasks({"archived": false});
      chrome.runtime.sendMessage({
        "type": "unarchived tasks dict",
        "tasksDict":tasksDict
      });
    }

    if(request.type === "time spent on page"){
      addTotalTimeToPageInTask(CTASKID, request.url, request.timeSpent);
      console.log("Time Spent on " + request.url + " is " + request.timeSpent/60000 + " minutes");
    }
});




chrome.windows.onRemoved.addListener(function (windowId) {
    if (windowId !== backgroundPageId) {
        // deactivateTaskInWindow(getKeyByValue(taskToWindow, windowId));
        //console.log("Window Removed" + TASKS);
        //console.log(TASKS);
        delete taskToWindow[getKeyByValue(taskToWindow, windowId)];
        // getIdsOfCurrentlyOpenTabs(windowId, function(ids){console.log(ids)});
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

    if (changeInfo.status === "complete") {
        if (tabIdToURL !== {}) {
            var date = new Date();
            // updateExitTime(tabIdToURL[tabId], date.toString())
        }
        tabIdToURL[tabId] = tab.url;
        saveTaskInWindow(CTASKID);
        // console.log(tab);
        // chrome.tabs.get(tab.openerTabId, function(tab){
        //     console.log(tab.url);
        // });
        addToHistory(tab.url, tab.title, CTASKID);
    }
    chrome.tabs.sendMessage(tabId, {"type": "reload-like-button", data: tab})

});

// chrome.tabs.onActivated.addListener(function(activeInfo){
//
//   // //Set the exit time for previous url
//   // if(tabIdToURL!= {} && activeTabId != 0){
//   //   var date = new Date();
//   //   updateExitTime(tabIdToURL[activeTabId], date.toString());
//   // }
//
//   activeTabId = activeInfo.tabId;
//
//   // chrome.tabs.get(activeTabId, function(tab){
//   //   if(tab.url){
//   //     if(TASKS[CTASKID].history.find((page) => page.url === tab.url)){
//   //       var date = new Date();
//   //       TASKS[CTASKID].history.find((page) => page.url === tab.url).timeVisited.push(date.toString());
//   //     }
//   //   }
//   // })
// });

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (removeInfo.isWindowClosing) {
        console.log("window closing");
        deactivateTaskInWindow(CTASKID);
        CTASKID = 0;
        // chrome.windows.getCurrent(function(window){
        //   if(getKeyByValue(taskToWindow, window.id)){
        //     activateTaskInWindow(getKeyByValue(taskToWindow, window.id));
        //   }
        //   else{
        //     CTASKID = 0;
        //   }
        // });
    }
    else {

        saveTaskInWindow(CTASKID);
    }
});

chrome.windows.onFocusChanged.addListener(function (newWindowId) {
    if (newWindowId !== chrome.windows.WINDOW_ID_NONE) {
        chrome.windows.get(newWindowId, function (window) {
            if (window.type === "normal") {
                if (getKeyByValue(taskToWindow, newWindowId)) {
                    //saveTaskInWindow(CTASKID);
                    console.log("focus changed and window not default");
                    deactivateTaskInWindow(CTASKID);
                    activateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
                }
                else {
                    chrome.browserAction.setBadgeText({"text": ""});
                }
            }
        });
    }
    else {
        if (getKeyByValue(taskToWindow, newWindowId)) {
            console.log("focus changed and window default");
            deactivateTaskInWindow(getKeyByValue(taskToWindow, newWindowId));
            CTASKID = 0;
            chrome.storage.local.set({"CTASKID": 0});
        }
        else {
            chrome.browserAction.setBadgeText({"text": ""});
        }
    }

    // chrome.storage.local.get("Text Log", function(textLog){
    //   if(textLog["Text Log"]){
    //     for(var url in textLog["Text Log"]){
    //       // removeFromPageContentAndTextLog(url);
    //     }
    //   }
    // })

});

//If a window is created outside Task context then remove task Badge
chrome.windows.onCreated.addListener(function (window) {
    if (!getKeyByValue(taskToWindow, window.id)) {
        chrome.browserAction.setBadgeText({"text": ""});
    }
});


// Creates notification for suggested task.
// chrome.runtime.onMessage.addListener(function (response, sender) {
//     if (response.type == "task suggestion") {
//         var probableTaskID = response["probable task id"];
//         console.log("Notification should fire");
//         var matchedTags = response["matched tags"];
//         var matchedTagsString = "";
//         for (var i = 0; i < matchedTags.length; i++) {
//             matchedTagsString = matchedTagsString + matchedTags[i][0] + ", ";
//         }
//         var fromPageURL = response["page url"];
//         var fromPageTitle = response["page title"];
//         var probableTask = response["probable task"];
//
//         chrome.notifications.create({
//             "type": "basic",
//             "iconUrl": "images/logo_white_sails_no_text.png",
//             "title": "Task Suggestion : " + probableTask,
//             "message": matchedTagsString,
//             "buttons": [{"title": "See all matched tags"}, {"title": "Add to task " + probableTask}],
//             // "items":[{"title":"sdfs","message":"sdfawefar"},{"title":"erwq","message":"qweqwer"},{"title":"zxz","message":"vbcxvbx"}],
//             "isClickable": true,
//             "requireInteraction": false
//         }, function (notificationID) {
//             // Respond to the user's clicking one of the buttons
//             chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
//                 if (notifId === notificationID) {
//
//                     // This button adds the current webpage to the suggested task and takes the user to the suggested task.
//                     if (btnIdx === 0) {
//                         // // Logging that the suggestion is correct.
//                         // chrome.storage.local.get("Suggestions Log", function (resp) {
//                         //     resp["Suggestions Log"]["Correct suggestions"]++;
//                         //     updateStorage("Suggestions Log", resp);
//                         // });
//
//                         // Call function to add to task and move to task.
//
//                         // Redirecting to matchedTags.html and displaying all matched tags.
//                         chrome.storage.local.set({
//                             "Matched Tags": {
//                                 "type": "show matched tags",
//                                 "matched tags": matchedTags,
//                                 "from page URL": fromPageURL,
//                                 "from page title": fromPageTitle,
//                                 "probable task name": probableTask
//                             }
//                         }, function () {
//                             chrome.tabs.create({"url": "html/matchedTags.html"})
//                         });
//                     }
//                     // // This button adds the current webpage to the suggested task and stays in the current task.
//                     else if (btnIdx === 1) {
//                         //     // Logging that the suggestion is correct.
//                         //     chrome.storage.local.get("Suggestions Log", function (resp) {
//                         //         resp["Suggestions Log"]["Correct suggestions"]++;
//                         //         updateStorage("Suggestions Log", resp);
//                         //     });
//                         //
//                         //     // Call function to add to task but not move to task.
//
//                         chrome.storage.local.get("Text Log", function (textLog) {
//                             textLog = textLog["Text Log"];
//
//                             for (var i = 0; i < matchedTags.length; i++) {
//                                 var key = matchedTags[i][0].toLowerCase();
//                                 if (textLog.hasOwnProperty(key)) {
//                                     textLog[key]["correctOccurences"]++;
//                                 }
//                             }
//
//                             updateStorage("Text Log", textLog);
//
//                         });
//                     }
//                 }
//             });
//
//             // When the user clicks on close the current page is added to the current task.
//             chrome.notifications.onClosed.addListener(function () {
//                 // Logging that the suggestion is incorrect.
//                 // chrome.storage.local.get("Suggestions Log", function (resp) {
//                 //     resp["Suggestions Log"]["Incorrect suggestions"]++;
//                 //     updateStorage("Suggestions Log", resp);
//                 // });
//                 chrome.storage.local.get("Text Log", function (textLog) {
//                     textLog = textLog["Text Log"];
//
//                     for (var i = 0; i < matchedTags.length; i++) {
//                         var key = matchedTags[i][0].toLowerCase();
//                         if (textLog.hasOwnProperty(key)) {
//                             var tag = textLog[key];
//                             textLog[key]["incorrectOccurences"]++;
//                         }
//                     }
//
//                     updateStorage("Text Log", textLog);
//
//                 });
//             });
//         });
//     }
// });
