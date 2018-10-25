let timeSpentOnTasks = {};

function showTasks(Tasks, ctaskid) {
    $("#tasks-container").empty();
    $("#archived-tasks").empty();

    const createTaskDiv = $('<div class="col-lg-3"><div class="card text-white bg-dark mb-3 col-lg-3" style="max-width: 20rem; height:12em; border-radius:0.8em"><div class="card-header round-corner-top">Create Task</div><div class="card-body"><div class="form-group round-corner"><input type="text" class="form-control round-corner" id="taskName" placeholder="Task name" style="border-radius: 0.6em"></div><button id="createTask" class="btn btn-secondary round-corner btn-sm" style="border-radius:0.6em">CreateTask</button></div></div></div>');
    $("#tasks-container").append(createTaskDiv);

    for (let task_id in Tasks) {
        if (task_id != "lastAssignedId" && !(Tasks[task_id].archived)) {
            setUpUnarchivedTasks(Tasks, task_id, ctaskid);
        }
        else if (task_id != "lastAssignedId" && Tasks[task_id].archived) {
            setUpArchivedTasks(Tasks, task_id);
        }
    }
    document.getElementById("createTask").addEventListener("click", function () {
        if (document.getElementById("taskName").value && document.getElementById("taskName").value.length > 0) {
            const tabs = [];
            chrome.windows.getCurrent({"populate": true}, function (window) {
                for (let i = 0; i < window.tabs.length; i++) {
                    if (window.tabs[i].highlighted) {
                        tabs.push(window.tabs[i]);
                    }
                }
                const closeCurrentTask = confirm("Switch to the new task?");
                sendCreateTaskMessage(closeCurrentTask, tabs);
            });
        } else {
            alert('You need to enter a task name to create a task');
        }
    });
}

function setUpUnarchivedTasks(Tasks, task_id, ctaskid) {
    const col = $("<div class='col-lg-3'></div>");

    if (Tasks[task_id].isOpen) {
        if (ctaskid == task_id) {
            var card = $("<div>", {
                "class": "card border-primary mb-3 task",
                "style": "max-width: 100rem; height:12em; border-radius:0.8em",
                "id": task_id
            });
        }
        else {
            var card = $("<div>", {
                "class": "card mb-3 task",
                "style": "max-width: 100rem; height:12em; border-radius:0.8em",
                "id": task_id
            });
        }
        var card_header = $("<div>", {"class": "card-header", "text": Tasks[task_id].name + "       "});
        var openPill = $('<span class="badge badge-pill badge-success">Open</span>');
        card_header.append(openPill);
    }
    else {
        var card = $("<div>", {
            "class": "card border-secondary mb-3 task",
            "style": "max-width: 100rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
        var card_header = $("<div>", {"class": "card-header", "text": Tasks[task_id].name});
    }

    const card_body = $("<div>", {"class": "card-body text-dark"});
    const card_buttons = $("<div>", {"class": "btn-group"});
    const open_button = $("<button class='btn btn-outline-success btn-sm round-corner-left openTask' type='button' id='" + Tasks[task_id].id + "'>Open</button>");
    const close_button = $("<button class='btn btn-outline-dark btn-sm closeTask' type='button' id='" + Tasks[task_id].id + "'>Close</button>");
    const rename_button = $("<button class='btn btn-outline-dark btn-sm renameTask' type='button' id='" + Tasks[task_id].id + "'>Rename</button>");
    const delete_button = $("<button class='btn btn-outline-danger btn-sm round-corner-right deleteTask' type='button' id='" + Tasks[task_id].id + "'>Delete</button>");
    const archive_button = $("<button class='btn btn-outline-dark btn-sm archiveTask' type='button' id='" + Tasks[task_id].id + "'>Archive</button>");
    const close_button_rounded = $("<button class='btn btn-outline-dark round-corner-right btn-sm closeTask' type='button' id='" + Tasks[task_id].id + "'>Close</button>");

    //Don't Add rename/archive/delete buttons to default task.
    if (task_id != "0") {
        card_buttons.append(open_button);
        card_buttons.append(close_button);
        card_buttons.append(rename_button);
        card_buttons.append(archive_button);
        card_buttons.append(delete_button);
    }
    else {
        card_buttons.append(open_button);
        card_buttons.append(close_button_rounded);

    }

    card_body.append(card_buttons);

    // show the time spent on task today
    let timeSpentOnTask;
    if (!timeSpentOnTasks[task_id]) {
        timeSpentOnTask = "";
    } else {
        timeSpentOnTask = timeSpentOnTasks[task_id];
    }
    const timeSpent = $("<br/><br/> <span>" + timeSpentOnTask + "</span>");
    card_body.append(timeSpent);

    card.append(card_header);
    card.append(card_body);


    col.append(card);
    $("#tasks-container").append(col);
}

function setUpArchivedTasks(Tasks, task_id) {

    const col = $("<div class='col-lg-3'></div>");

    if (Tasks[task_id].isOpen) {
        var card = $("<div>", {
            "class": "card border-primary mb-3 task",
            "style": "max-width: 100rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
    }
    else {
        var card = $("<div>", {
            "class": "card border-secondary mb-3 task",
            "style": "max-width: 100rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
    }

    const card_header = $("<div>", {"class": "card-header", "text": Tasks[task_id].name});
    const card_body = $("<div>", {"class": "card-body text-dark"});
    const card_buttons = $("<div>", {"class": "btn-group"});
    const open_button = $("<button class='btn btn-outline-success btn-sm round-corner-left openTask' type='button' id='" + Tasks[task_id].id + "'>Open</button>");
    const rename_button = $("<button class='btn btn-outline-dark btn-sm round-corner renameTask' type='button' id='" + Tasks[task_id].id + "'>Rename</button>");
    const delete_button = $("<button class='btn btn-outline-danger btn-sm round-corner-right deleteTask' type='button' id='" + Tasks[task_id].id + "'>Delete</button>");
    const archive_button = $("<button class='btn btn-outline-dark btn-sm round-corner archiveTask' type='button' id='" + Tasks[task_id].id + "'>Unarchive</button>");

    // card_buttons.append(open_button);
    // card_buttons.append(rename_button);
    card_buttons.append(archive_button);
    card_buttons.append(delete_button);
    card_body.append(card_buttons);

    card.append(card_header);
    card.append(card_body);

    col.append(card);
    $("#archived-tasks").append(col);
}

// get the time spent on tasks
let date = new Date();
let dd = date.getDate();
let mm = date.getMonth() + 1; //January is 0!
let yyyy = date.getFullYear();
if (dd < 10) {
    dd = '0' + dd
}
if (mm < 10) {
    mm = '0' + mm
}
let dateString = dd + '-' + mm + '-' + yyyy;
let historyDate = 'HISTORY-' + dateString;

chrome.storage.local.get(historyDate, function (result) {
    let history = result[historyDate];
    for (let task in history) {
        let taskHistory = history[task];
        let timeSpentOnTask = taskHistory["totalTime"];
        if (timeSpentOnTask < 60) {
            timeSpentOnTasks[task] = "Less than a minute";
        } else {
            let h = Math.floor(timeSpentOnTask / 3600);
            if (h === 0) {
                h = '';
            }
            if (h.toString() !== '') {
                h += " hrs ";
            }
            let m = Math.floor((timeSpentOnTask % 3600) / 60);
            if (m === 0) {
                m = '';
            }
            if (m.toString() !== '') {
                if (m.toString().length === 1) {
                    m = '0' + m;
                }
                m += " mins";
            }

            timeSpentOnTasks[task] = h + m;
        }
    }
});
