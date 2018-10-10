function displayHistory(fullTaskHistory, timeSpentOnUrl) {
    let data = [];
    for (let idx in fullTaskHistory) {
        let historyEntry = fullTaskHistory[idx];
        let url = historyEntry[0];
        let title = historyEntry[1];
        if (title === "") {
            title = url
        }
        let titleWithLink = "<a href='" + url + "'>" + title + "</a>";

        // get date and time from visit time
        let visitTime = historyEntry[2];
        let date = new Date(visitTime);
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();
        if (h < 10) {
            h = '0' + h;
        }
        if (m < 10) {
            m = '0' + m;
        }
        if (s < 10) {
            s = '0' + s;
        }
        let time = "<span class='hide'>" + visitTime + "</span>" + h + ":" + m + ":" + s;
        date = "<span class='hide'>" + visitTime + "</span>" + dd + '-' + mm + '-' + yyyy;

        let totalTimeSpent = timeSpentOnUrl[url];
        if (totalTimeSpent < 60) {
            totalTimeSpent = "<span class='hide'>" + totalTimeSpent + "</span>" + "Less than a minute";
        } else {
            let hours = Math.floor(totalTimeSpent / 3600);
            if (hours === 0) {
                hours = '';
            }
            if (hours.toString() !== '') {
                hours += " hrs ";
            }
            let min = Math.floor((totalTimeSpent % 3600) / 60);
            if (min === 0) {
                min = '';
            }
            if (min.toString() !== '') {
                if (min.toString().length === 1) {
                    min = '0' + min;
                }
                min += " mins";
            }
            totalTimeSpent = "<span class='hide'>" + totalTimeSpent + "</span>" + hours + min;
        }

        data.push([titleWithLink, totalTimeSpent, date, time])
    }

    $('#historyTable').DataTable({
        data: data,
        columns: [
            {title: "Title", width: "60%"},
            {title: "Time Spent", width: "20%"},
            {title: "Date", width: "10%"},
            {title: "Time", width: "10%"}
        ],
        order: [[3, "desc"]],
        columnDefs: [
            {type: 'any-number', targets: [1, 2, 3]}
        ]
    });
}

function getAllHistory(historyDates, taskId) {
    let timeSpentOnUrl = {};
    let fullTaskHistory = [];
    chrome.storage.local.get(historyDates, function (results) {
        for (let historyDate in results) {
            let history = results[historyDate];
            if (history[taskId]) {
                let taskHistory = history[taskId];
                for (let url in taskHistory.urls) {
                    let urlVisited = taskHistory.urls[url];
                    if (!timeSpentOnUrl[url]) {
                        timeSpentOnUrl[url] = urlVisited.timeSpent;
                    } else {
                        timeSpentOnUrl[url] += urlVisited.timeSpent;
                    }
                    let historyEntry = [url, urlVisited.title, urlVisited.lastVisited];
                    fullTaskHistory.push(historyEntry);
                }
            }
        }
        displayHistory(fullTaskHistory, timeSpentOnUrl);
    })
}

function getTaskHistory(taskId) {
    chrome.storage.local.get(null, function (result) {
        let historyDates = [];
        for (let key in result) {
            if (key.includes("HISTORY", 0)) {
                historyDates.push(key);
            }
        }
        getAllHistory(historyDates, taskId);
    });
    chrome.storage.local.get("TASKS", function (tasks) {
        tasks = tasks["TASKS"];
        $("#taskNameBanner").text("History for " + tasks[taskId].name + " Task");
    });
}

function resetTable() {
    $('#historyTable').remove();
    $('#historyTable_wrapper').remove();
    $('#historyTableDiv').append('<table id="historyTable" class="display" width="100%"></table>');
}

$(document).ready(function () {

    chrome.storage.local.get("TASKS", function (taskObject) {
        if (taskObject["TASKS"]) {
            const Tasks = taskObject["TASKS"];
            // console.log(Tasks);
            for (let task_id in Tasks) {
                if (task_id != "lastAssignedId") {
                    if (Tasks[task_id].name.length < 21) {
                        $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name + '</button>');
                    }
                    else {
                        $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name.slice(0, 18) + ".." + '</button>');
                    }
                }
            }
        }
        $('.tasks').click(function () {
            resetTable();
            let idOfSelectedTask = $(this).attr('id');
            getTaskHistory(idOfSelectedTask);
        });
    });

    chrome.storage.local.get("CTASKID", function (cTaskIdObject) {
        if (cTaskIdObject["CTASKID"]) {
            const ctaskid = cTaskIdObject["CTASKID"];
            getTaskHistory(ctaskid);
        } else {
            getTaskHistory(0);
        }
    });
});