window.onload = function () {

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
                  var Tasks = taskObject["TASKS"];
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

                  var renameElement = element;

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
              var tabs = [];
              chrome.windows.getCurrent({"populate": true}, function (window) {
                  for (var i = 0; i < window.tabs.length; i++) {
                      if (window.tabs[i].highlighted) {
                          tabs.push(window.tabs[i]);
                      }
                  }
                  var closeCurrentTask = confirm("Switch to the new task?")
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
        for (var i = 0; i < document.getElementsByClassName(classNameOrIdName).length; i++) {
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


$("#downloadTasks").click(function () {
    chrome.runtime.sendMessage({
        "type": "download-tasks"
    });
});
