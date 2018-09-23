function showTasks(Tasks, ctaskid) {
  $("#tasks-container").empty();
  $("#archived-tasks").empty();

  const createTaskDiv = $('<div class="col-lg-3"><div class="card text-white bg-dark mb-3 col-lg-3" style="max-width: 20rem; height:12em; border-radius:0.8em"><div class="card-header">Create Task</div><div class="card-body"><div class="form-group round-corner"><input type="text" class="form-control round-corner" id="taskName" placeholder="Task name" style="border-radius: 0.6em"></div><button id="createTask" class="btn btn-secondary round-corner btn-sm" style="border-radius:0.6em">CreateTask</button></div></div></div>');
  $("#tasks-container").append(createTaskDiv);

    for (let task_id in Tasks) {
        if (task_id != "lastAssignedId" && !(Tasks[task_id].archived)) {
            setUpUnarchivedTasks(Tasks, task_id, ctaskid);
        }
        else if (task_id != "lastAssignedId" && Tasks[task_id].archived) {
            setUpArchivedTasks(Tasks, task_id);
        }
    }
    document.getElementById("createTask").addEventListener("click", function(){
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
    });
}

function setUpUnarchivedTasks(Tasks, task_id, ctaskid){
    const col = $("<div class='col-lg-3'></div>");

    if (Tasks[task_id].isOpen) {
      if(ctaskid == task_id){
        var card = $("<div>", {
            "class": "card border-primary mb-3 task",
            "style": "max-width: 20rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
      }
      else{
        var card = $("<div>", {
            "class": "card mb-3 task",
            "style": "max-width: 20rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
      }
        var card_header = $("<div>", {"class": "card-header", "text": Tasks[task_id].name + "       "});
        var openPill = $('<span class="badge badge-pill badge-success">Open</span>');
        card_header.append(openPill);
    }
    else{
      var card = $("<div>", {
          "class": "card border-secondary mb-3 task",
          "style": "max-width: 20rem; height:12em; border-radius:0.8em",
          "id": task_id
      });
      var card_header = $("<div>", {"class": "card-header", "text": Tasks[task_id].name});
    }

    const card_body = $("<div>", {"class": "card-body text-dark"});
    const card_buttons = $("<div>", {"class": "btn-group"});
    const open_button = $("<button class='btn btn-outline-success btn-sm round-corner-left openTask' type='button' id='" + Tasks[task_id].id + "'>Open</button>");
    const open_button_rounded = $("<button class='btn btn-outline-success btn-sm openTask' style='border-radius:10px;'type='button' id='" + Tasks[task_id].id + "'>Open</button>");
    const rename_button = $("<button class='btn btn-outline-dark btn-sm renameTask' type='button' id='" + Tasks[task_id].id + "'>Rename</button>");
    const delete_button = $("<button class='btn btn-outline-danger btn-sm round-corner-right deleteTask' type='button' id='" + Tasks[task_id].id + "'>Delete</button>");
    const archive_button = $("<button class='btn btn-outline-dark btn-sm archiveTask' type='button' id='" + Tasks[task_id].id + "'>Archive</button>");

    //Don't Add rename/archive/delete buttons to default task.
    if(task_id != "0"){
      card_buttons.append(open_button);
      card_buttons.append(rename_button);
      card_buttons.append(archive_button);
      card_buttons.append(delete_button);
    }
    else{
      card_buttons.append(open_button_rounded);
    }

    card_body.append(card_buttons);

    card.append(card_header);
    card.append(card_body);


    col.append(card);
    $("#tasks-container").append(col);
}

function setUpArchivedTasks(Tasks, task_id){

    const col = $("<div class='col-lg-3'></div>");

    if (Tasks[task_id].isOpen) {
        var card = $("<div>", {
            "class": "card border-primary mb-3 task",
            "style": "max-width: 20rem; height:12em; border-radius:0.8em",
            "id": task_id
        });
    }
    else {
        var card = $("<div>", {
            "class": "card border-secondary mb-3 task",
            "style": "max-width: 20rem; height:12em; border-radius:0.8em",
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
