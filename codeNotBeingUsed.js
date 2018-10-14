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

// function extrapolateUrlFromCookie(cookie) {
//     var prefix = cookie.secure ? "https://" : "http://";
//     if (cookie.domain.charAt(0) == ".")
//         prefix += "www";
//
//     return prefix + cookie.domain + cookie.path;
// }


//
// function fireTaskSuggestion(response) {
//     const probableTaskID = response["probable task id"];
//     // console.log("Notification should fire");
//     const matchedTags = response["matched tags"];
//     let matchedTagsString = "";
//     for (var i = 0; i < matchedTags.length; i++) {
//         matchedTagsString = matchedTagsString + matchedTags[i][0] + ", ";
//     }
//     const fromPageURL = response["page url"];
//     const fromPageTitle = response["page title"];
//     const probableTask = response["probable task"];
//
//     chrome.notifications.create({
//         "type": "basic",
//         "iconUrl": "images/logo_white_sails_no_text.png",
//         "title": "Task Suggestion : " + probableTask,
//         "message": matchedTagsString,
//         "buttons": [{"title": "See all matched tags"}, {"title": "Add to task " + probableTask}],
//         // "items":[{"title":"sdfs","message":"sdfawefar"},{"title":"erwq","message":"qweqwer"},{"title":"zxz","message":"vbcxvbx"}],
//         "isClickable": true,
//         "requireInteraction": false
//     }, function (notificationID) {
//         // Respond to the user's clicking one of the buttons
//         chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
//             if (notifId === notificationID) {
//
//                 // This button adds the current webpage to the suggested task and takes the user to the suggested task.
//                 if (btnIdx === 0) {
//                     // // Logging that the suggestion is correct.
//                     // chrome.storage.local.get("Suggestions Log", function (resp) {
//                     //     resp["Suggestions Log"]["Correct suggestions"]++;
//                     //     updateStorage("Suggestions Log", resp);
//                     // });
//
//                     // Call function to add to task and move to task.
//
//                     // Redirecting to matchedTags.html and displaying all matched tags.
//                     chrome.storage.local.set({
//                         "Matched Tags": {
//                             "type": "show matched tags",
//                             "matched tags": matchedTags,
//                             "from page URL": fromPageURL,
//                             "from page title": fromPageTitle,
//                             "probable task name": probableTask
//                         }
//                     }, function () {
//                         chrome.tabs.create({"url": "html/matchedTags.html"})
//                     });
//                 }
//                 // // This button adds the current webpage to the suggested task and stays in the current task.
//                 else if (btnIdx === 1) {
//                     //     // Logging that the suggestion is correct.
//                     //     chrome.storage.local.get("Suggestions Log", function (resp) {
//                     //         resp["Suggestions Log"]["Correct suggestions"]++;
//                     //         updateStorage("Suggestions Log", resp);
//                     //     });
//                     //
//                     //     // Call function to add to task but not move to task.
//
//                     chrome.storage.local.get("Text Log", function (textLog) {
//                         textLog = textLog["Text Log"];
//
//                         for (let i = 0; i < matchedTags.length; i++) {
//                             const key = matchedTags[i][0].toLowerCase();
//                             if (textLog.hasOwnProperty(key)) {
//                                 textLog[key]["correctOccurences"]++;
//                             }
//                         }
//
//                         updateStorage("Text Log", textLog);
//
//                     });
//                 }
//             }
//         });
//
//         // When the user clicks on close the current page is added to the current task.
//         chrome.notifications.onClosed.addListener(function () {
//             // Logging that the suggestion is incorrect.
//             // chrome.storage.local.get("Suggestions Log", function (resp) {
//             //     resp["Suggestions Log"]["Incorrect suggestions"]++;
//             //     updateStorage("Suggestions Log", resp);
//             // });
//             chrome.storage.local.get("Text Log", function (textLog) {
//                 textLog = textLog["Text Log"];
//
//                 for (let i = 0; i < matchedTags.length; i++) {
//                     const key = matchedTags[i][0].toLowerCase();
//                     if (textLog.hasOwnProperty(key)) {
//                         const tag = textLog[key];
//                         textLog[key]["incorrectOccurences"]++;
//                     }
//                 }
//
//                 updateStorage("Text Log", textLog);
//
//             });
//         });
//     });
// }