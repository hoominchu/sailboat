function fireTaskNameNotification(taskId, notificationType) {
    let taskNAME = " Default";
    if (TASKS[taskId]) {
        taskNAME = " " + TASKS[taskId].name
    }
    if (notificationType === "timeSpentNotification") {
        const date = new Date();
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        var dateString = dd + '-' + mm + '-' + yyyy;
        var historyDate = 'HISTORY-' + dateString;
        chrome.storage.local.get(historyDate, function (historyObject) {
            historyObject = historyObject[historyDate];
            const hrsSpent = Math.floor(historyObject[taskId].totalTime / 3600);
            const minsSpent = Math.floor((historyObject[taskId].totalTime / 3600 - hrsSpent) * 60);
            let message = "";
            if (hrsSpent > 0) {
                if (minsSpent > 0) {
                    message = "Total Time Spent on the task: " + hrsSpent + " hour and " + minsSpent + " minutes"
                }
                else {
                    message = "Total Time Spent on the task: " + hrsSpent + " hour"
                }
            }
            else {
                if (minsSpent > 0) {
                    message = "Total Time Spent on the task: " + minsSpent + " minutes"
                }
                else {
                    message = "Total Time Spent on the task: Less than a minute"
                }
            }
            chrome.notifications.create({
                "type": "basic",
                "iconUrl": "images/logo_white_sails_no_text.png",
                "title": "You are on : " + taskNAME,
                "message": message
            });
        });

    }
    else if (notificationType === "switchNotification") {
        chrome.storage.local.get("task-switch-notification", function (value) {
            if (value["task-switch-notification"]) {
                chrome.notifications.create({
                    "type": "basic",
                    "iconUrl": "images/logo_white_sails_no_text.png",
                    "title": "Task Switched to:" + taskNAME,
                    "message": "You have switched to" + taskNAME
                });
            }
        })
    }
}

function fireInterestNotification(interests) {
    const interestsList = [];
    let messageString = "";
    for (let i = 0; i < interests.length; i++) {
        const interest = interests[i];
        const collectionName = interest.collectionName;
        const itemName = interest.itemName;
        const frequency = interest.frequency;
        const interestListItem = {};
        interestListItem['title'] = itemName;
        interestListItem['message'] = collectionName + ' (' + frequency + ')';
        interestsList.push(interestListItem);
        messageString += itemName + ' (' + collectionName + ') | ';
    }

    chrome.notifications.create({
        "type": "basic",
        "iconUrl": "images/logo_white_sails_no_text.png",
        "title": "This page looks interesting!",
        "message": messageString,
        "requireInteraction": false
    }, function (notificationID) {
        console.log("Last error:", chrome.runtime.lastError);
    });
}

chrome.storage.local.get("time-period-for-task-notification", function (result) {
    if (!result["time-period-for-task-notification"]) {
        chrome.alarms.create("taskName notification", {"delayInMinutes": 0, "periodInMinutes": 10})

    }
    else {
        chrome.alarms.create("taskName-notification", {
            "delayInMinutes": 0,
            "periodInMinutes": parseInt(result["time-period-for-task-notification"])
        })
    }
});