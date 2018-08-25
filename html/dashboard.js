chrome.storage.local.get("TASKS", function(tasksObject){
  if(tasksObject["TASKS"]){
    chrome.storage.local.get("CTASKID", function(cTaskIdObject){
      if(cTaskIdObject["CTASKID"]){
        const task = tasksObject["TASKS"][cTaskIdObject["CTASKID"]];

        $("#taskNameBanner").text(task.name); //Add task Name

        $("#lastOpenedTime").text("LAST OPENED: " + task.activationTime[task.activationTime.length-1].split("GMT")[0]);

        var timeSpent = 0;

        for(var i =0; i<task.deactivationTime.length; i++){
          var tempAct = new Date(task.activationTime[i]);
          var tempDeact = new Date(task.deactivationTime[i]);
          timeSpent = tempAct-tempDeact + timeSpent;
        }
        if(task.activationTime.length>task.deactivationTime.length){
          var currentTime = new Date();
          var tempAct = new Date(task.activationTime[task.activationTime.length-1]);
          var timeInCurrentSession = currentTime - tempAct;
          timeSpent = timeSpent + timeInCurrentSession;
        }
        $("#timeSpent").text("TIME SPENT: " + Math.round(timeSpent/60000) + " minutes (Extremely experimental)");

        //Add archived Pages
        const archivedPageUrls = task.likedPages;
        const archivedPages = task.history.filter(function(page){
          return (archivedPageUrls.indexOf(page.url)>-1)
        });
        for(var i = 0; i<archivedPages.length; i++){
          let card = $('<div class="card border-dark mb-3 archivedPageCard" style="max-width: 20rem;">'+
'      <div class="card-header" class="page-title"><a href="'+archivedPages[i].url+'">'+ archivedPages[i].title+'</a></div>'+
// '      <div class="card-body">'+
// '        <h4 class="card-title">Dark card title</h4>'+
// '        <p class="card-text" class="page-decription"></p>'+
'      </div>');
          $("#archivedPagesContainer").append(card);
        }

      }
    });
  }
});
