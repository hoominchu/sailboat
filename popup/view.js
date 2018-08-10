function showTasks(Tasks, openTasks) {
      for (var task_id in Tasks) {
          if (task_id != "lastAssignedId" && Tasks[task_id].id!= 0 && !Tasks[task_id].archived) {
              if(openTasks.indexOf(task_id)>-1){
                appendTask(task_id, Tasks, true);
              }
              else{
                appendTask(task_id, Tasks, false);
              }
          }
      }
    }

function appendTask(task_id, Tasks, isTaskOpen){
    let li = document.createElement("li");
    let taskName = document.createElement("button");
    taskName.className = "btn round-corner-left task bold-text";
    if(isTaskOpen){
      if(Tasks[task_id].name.length<15){
        taskName.innerText = Tasks[task_id].name;
        taskName.className = taskName.className + " btn-success";
      }
      else{
        taskName.innerText = Tasks[task_id].name.substr(0,12)+"..";
        taskName.className = taskName.className + " btn-success";
      }
    }
    else{
      if(Tasks[task_id].name.length<15){
        taskName.innerText = Tasks[task_id].name;
        taskName.className = taskName.className + " btn-outline-primary";

      }
      else{
        taskName.innerText = Tasks[task_id].name.substr(0,12)+"..";
        taskName.className = taskName.className + " btn-outline-primary";
      }
    }
    taskName.id = Tasks[task_id].id;
    taskName.type = "button";
    // var openButton = document.createElement("button");
    // openButton.innerText = "Open Task";
    // openButton.className = "btn btn-outline-primary task";
    // openButton.type = "button";
    // openButton.id = Tasks[task_id].id;
    let renameButton = document.createElement("button");
    renameButton.innerText = "Add";
    renameButton.className = "btn btn-outline-primary add";
    renameButton.type = "button";
    renameButton.id = Tasks[task_id].id;
    let cancelButton = document.createElement("button");
    cancelButton.innerText = "Close";
    cancelButton.className = "btn btn-outline-danger closeTask round-corner-right";
    cancelButton.type = "button";
    // li.innerText = Tasks[task_id].name + "  ";
    li.id = Tasks[task_id].id;
    li.className = "margin";
    li.appendChild(taskName);
    li.appendChild(renameButton);
    li.appendChild(cancelButton);
    document.getElementById("tasks").appendChild(li);
}
