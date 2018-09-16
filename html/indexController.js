window.onload = function () {

  const createTaskDiv = $('<div class="col-lg-3"><div class="card text-white bg-dark mb-3 col-lg-3" style="max-width: 20rem; height:12em; border-radius:0.8em"><div class="card-header">Create Task</div><div class="card-body"><div class="form-group round-corner"><input type="text" class="form-control round-corner" id="taskName" placeholder="Task name" style="border-radius: 0.6em"></div><button id="createTask" class="btn btn-secondary round-corner btn-sm" style="border-radius:0.6em">CreateTask</button></div></div></div>');
  $("#tasks-container").append(createTaskDiv);

    chrome.storage.local.get("TASKS", function (taskObject) {

      chrome.runtime.sendMessage({"type": "give me open tasks"});
      chrome.runtime.onMessage.addListener(function (request, sender) {
        if(request.type == "array of open tasks"){

          if (taskObject["TASKS"]) {

              showTasks(taskObject["TASKS"], request.openTasks);

              funcOnClick("openTask", "class", function (element) {
                  return function (element) {
                          chrome.runtime.sendMessage(
                              {
                                  "type": "switch-task",
                                  "nextTaskId": $(element.srcElement).closest(".card").attr("id"),
                              }
                          );
                  location.reload();
                  }(element);
              });


              funcOnClick("archiveTask", "class", function (element) {
                  return function (element) {
                      chrome.runtime.sendMessage(
                          {
                              "type": "archive-task",
                              "taskId": $(element.srcElement).closest(".card").attr("id")
                          }
                      );
                      location.reload();
                  }(element);
              });

              funcOnClick("deleteTask", "class", function (element) {
                  const Tasks = taskObject["TASKS"];
                  return function (element) {
                          chrome.runtime.sendMessage(
                              {
                                  "type": "delete-task",
                                  "taskToRemove": $(element.srcElement).closest(".card").attr("id")
                              }
                          );
                          location.reload();
                      }(element);


              });

              funcOnClick("renameTask", "class", function (element) {

                  const renameElement = element;

                  $('#renameModal').modal('show');

                  funcOnClick("renameSubmit", "id", function (e) {
                      return function (element) {
                          chrome.runtime.sendMessage(
                              {
                                  "type": "rename-task",
                                  "taskId": $(renameElement.srcElement).closest(".card").attr("id"),
                                  "newTaskName": $("#newNameForTask").val()
                              }
                          );
                          location.reload();

                      }(e);

                  });
              })

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
      });
    });

};



function sendCreateTaskMessage(closeCurrentTask, tabs) {
        if(closeCurrentTask){
            chrome.runtime.sendMessage(
                {
                    "type": "create-task",
                    "taskName": document.getElementById("taskName").value,
                    "tabs": tabs,
                    "activated": true
                }
            );
            location.reload();
        }
        else{
            chrome.runtime.sendMessage(
                {
                    "type": "create-task",
                    "taskName": document.getElementById("taskName").value,
                    "tabs": tabs,
                    "activated": false
                }
            );
            location.reload();
        }
}

function funcOnClick(classNameOrIdName, type, func) {
    if (type == "class") {
        for (let i = 0; i < document.getElementsByClassName(classNameOrIdName).length; i++) {
            document.getElementsByClassName(classNameOrIdName)[i].addEventListener("click", function (element) {
                func(element);
            });
        }
    }
    if (type == "id") {
        document.getElementById(classNameOrIdName).addEventListener("click", function (element) {
            func(element);
        });
    }

}
