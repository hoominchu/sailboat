let timeSpentOnTasks = {};

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

chrome.storage.local.get([historyDate, 'TASKS', 'CTASKID'], function (response) {
    let history = response[historyDate];
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
    showTasks(response["TASKS"], response['CTASKID']);
});

$(document).ready(function() {
    $('#createTask').click(function() {
        createTask();
    });
});

// Handling Enter keypress to create task
$(document).keypress(function(ev){
    if (ev.keyCode === 13) {
        if (document.getElementById("taskName").value && document.getElementById("taskName").value.length > 0) {
            $('#createTask').click();
        }
    }
});

// $(window).focus(function(){
//     getAndShowTasks();
// });

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (request.message === 'update-dock') {
        getAndShowTasks();
    }
});

function getAndShowTasks() {
    chrome.storage.local.get(['TASKS', 'CTASKID'], function(response) {
        showTasks(response['TASKS'], response['CTASKID']);
    });
}

function showTasks(tasks, ctaskid) {
    $(".task-card:not(.template, .create-task-card)").remove();
    for (let task_id in tasks) {
        if (task_id !== "lastAssignedId") {
            showTask(tasks[task_id], ctaskid);
        }
    }
    $('.openTask').click(function(event) {
        chrome.runtime.sendMessage(
            {
                "type": "switch-task",
                "nextTaskId": $(this).closest('.task-card').attr("task-id"),
            }
        );
    });
    $('.renameTask').click(function() {
        $('.newNameForTask').attr('for-task-id', $(this).closest('.task-card').attr('task-id'));
        $('#renameModal').modal('show');
    });
    $('.renameSubmit').click(function() {
        let forTaskId = $('.newNameForTask').attr('for-task-id');
        let newName = $("#newNameForTask").val();
        // setTaskName(newName, forTaskId);
        $('#renameModal').modal('hide');
        chrome.runtime.sendMessage(
            {
                "type": "rename-task",
                "taskId": forTaskId,
                "newTaskName": newName
            }, function(response) {getAndShowTasks();}
        );
    });
    $('.deleteTask').click(function() {
        var delTaskId = $(this).closest(".task-card").attr("task-id");
        if (tasks[delTaskId].isOpen) { // typeof taskToWindow[delTaskId] == 'undefined'
            alert("This task is open. Please close it before deleting.");
        } else {
            const confirmation = confirm("Deleting a task will remove all the history and liked pages of the task. Are you sure you want to delete it?");
            if (confirmation) {
                chrome.runtime.sendMessage(
                    {
                        "type": "delete-task",
                        "taskToRemove": delTaskId
                    }, function(response) {getAndShowTasks();}
                );
            }
        }
    });
    $('.archiveTask').click(function() {
        let taskid = $(this).closest(".task-card").attr("task-id");
        // toggleCardArchiveState(taskid);
        chrome.runtime.sendMessage(
            {
                "type": "archive-task",
                "taskId": taskid
            }, function(response) {getAndShowTasks();}
        );
    });
}

function toggleCardArchiveState(taskid) {
    let $taskCard = $('.task-card[task-id='+taskid+']');
    if (typeof ($taskCard.attr('data-isarchived')) !== 'undefined' && $taskCard.attr('data-isarchived') === 'true') {
        $('.current-tasks').append($taskCard);
        $('.archiveTask', $taskCard).text('Archive');
        $taskCard.attr('data-isarchived', 'false');
    } else {
        $('.archived-tasks').append($taskCard);
        $('.archiveTask', $taskCard).text('Unarchive');
        $taskCard.attr('data-isarchived', 'true');
    }
}

function createTask() {
    if (document.getElementById("taskName").value && document.getElementById("taskName").value.length > 0) {
        const tabs = [];
        const closeCurrentTask = confirm("Switch to the new task?");
        sendCreateTaskMessage(closeCurrentTask, tabs);
    } else {
        alert('You need to enter a task name to create a task');
    }
}

function showTask(task, ctaskid) {
    // var openPill = $('<span class="badge badge-pill badge-success">Open</span>');
    //     card_header.append(openPill);

    let $puzzleCard = $('.task-card.template').clone();
    $puzzleCard.removeClass('template');
    $puzzleCard.attr('task-id', task.id);
    $('.task-name', $puzzleCard).text(task.name);
    let timeSpentOnTask = timeSpentOnTasks[task.id] ? timeSpentOnTasks[task.id] : '';
    $('.time-spent-on-task', $puzzleCard).text(timeSpentOnTask);
    if (task.isOpen) {
        $puzzleCard.addClass('open-task');
    }
    if (task.id === ctaskid) {
        $('.card', $puzzleCard).addClass('border-primary');
    }
    if (task.id == '0') {
        $('.card', $puzzleCard).addClass('default-task-card border-secondary');
    }
    let parentSelector;
    if (task.archived) {
        parentSelector = '.archived-tasks';
        $('.archiveTask', $puzzleCard).text('Unarchive');
        $puzzleCard.attr('data-isarchived', 'true');
    } else {
        parentSelector = '.current-tasks';
    }
    $(parentSelector).append($puzzleCard);
}

function setTaskName(name, id) {
    $('.task-card[task-id=' + id + ']').find('.task-name').text(name);
}

function sendCreateTaskMessage(closeCurrentTask, tabs) {
    chrome.runtime.sendMessage(
        {
            "type": "create-task",
            "taskName": document.getElementById("taskName").value,
            "tabs": tabs,
            "activated": closeCurrentTask
        }, function(response) {getAndShowTasks();}
    );
}