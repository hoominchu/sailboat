let idOfSelectedTask = 0;

const domainsToExclude = ["mail.google.com", "chrome:", "chrome-extension:"];


chrome.storage.local.get("TASKS", function (taskObject) {
    if (taskObject["TASKS"]) {
        const Tasks = taskObject["TASKS"];
        // console.log(Tasks);
        for (let task_id in Tasks) {
            if (task_id != "lastAssignedId") {
                $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name + '</button>');
            }
        }
        $(".tasks").click(function () {
            idOfSelectedTask = Tasks[$(this).attr('id')].id;
            $("#historyTable").empty();
            const selectedTask = Tasks[$(this).attr('id')];
            for (let i = selectedTask.history.length - 1; i > -1; i--) {
                createRow(selectedTask.history[i])
            }
            $("#taskNameBanner").text("History for " + Tasks[$(this).attr('id')].name + " Task");
        });

        //By Default show history of current task
        chrome.storage.local.get("CTASKID", function(cTaskIdObject){
          if(cTaskIdObject["CTASKID"]){
            const ctaskid = cTaskIdObject["CTASKID"];
            $("#"+ctaskid).click();
          }
        })

    }
});

function createRow(page) {

  if(domainsToExclude.indexOf(getDomainFromURL(page.url))<0){ //Show only if domain is not in domainsToExclude
      const tableRow = $('<tr class="historyRow"></tr>');

      tableRow.append('<td><input type="checkbox" class="selectBox" value="'+page.url+'"></td>');
    tableRow.append('<td><a href="' + page.url + '">' + page.title + '</a></td>');

    //Check if page is archived
    if (page.isLiked) {
        tableRow.append('<td>Yes</td>');
    }
    else {
        tableRow.append('<td></td>')
    }

    let timeSpent = Math.round(page.timeSpent/60000);
    if(timeSpent == 0){
      tableRow.append('<td> Less than a minute</td>');
    }
    else{
      tableRow.append('<td>'+ timeSpent + ' minutes</td>');
    }


    tableRow.append('<td>' + page.timeVisited[page.timeVisited.length - 1].slice(0, 25) + '</td>');
    $("#historyTable").append(tableRow)
  }

}


//Sorting Methods

const table = $("#table");

$('#title, #liked, #lastVisit')
    .wrapInner('<span title="sort this column"/>')
    .each(function () {

        const th = $(this),
            thIndex = th.index();
        let inverse = false;

        th.click(function () {

            table.find('td').filter(function () {

                return $(this).index() === thIndex;

            }).sortElements(function (a, b) {

                return $.text([a]) > $.text([b]) ?
                    inverse ? -1 : 1
                    : inverse ? 1 : -1;

            }, function () {

                // parentNode is the element we want to move
                return this.parentNode;

            });

            inverse = !inverse;

        });

    });

$("#openLikedPages").click(function () {
    chrome.runtime.sendMessage({
        "type": "open-liked-pages",
        "taskId": idOfSelectedTask
    });
});

$('#time')
    .wrapInner('<span title="sort this column"/>')
    .each(function () {

        const th = $(this),
            thIndex = th.index();
        let inverse = false;

        th.click(function () {

            table.find('td').filter(function () {

                return $(this).index() === thIndex;

            }).sortElements(function (a, b) {
                console.log(a);
                console.log(b);

                return $.text([a]) > $.text([b]) ?
                    inverse ? -1 : 1
                    : inverse ? 1 : -1;

            }, function () {

                // parentNode is the element we want to move
                return this.parentNode;

            });

            inverse = !inverse;

        });

    });



// var options = {
//     valueNames: [ 'name', 'born' ]
// };
//
//
// var userList = new List('table', options);


$("#selectAll").click(function(){
    const checkBoxes = $(".selectBox");
    checkBoxes.prop("checked", !checkBoxes.prop("checked"));
});


$(document).bind("contextmenu", function (event) {

    // Avoid the real one
    event.preventDefault();

    // Show contextmenu
    $(".custom-menu").finish().toggle(100).

    // In the right position (the mouse)
    css({
        top: event.pageY + "px",
        left: event.pageX + "px"
    });
});


// If the document is clicked somewhere
$(document).bind("mousedown", function (e) {

    // If the clicked element is not the menu
    if (!$(e.target).parents(".custom-menu").length > 0) {

        // Hide it
        $(".custom-menu").hide(100);
    }
});

// $('input[type=checkbox]').each(function () {
//     var sThisVal = (this.checked ? $(this).val() : "");
// });


// If the menu element is clicked
$(".custom-menu li").click(function(){
    const type = $(this).attr("data-action");
    const urls = [];
    $('input[type=checkbox]').each(function () {
        const x = (this.checked ? $(this).val() : "");
        if(x != ""){
            urls.push(x);
        }
    });

    const temp = {
        "urls": urls,
        "type": type,
        "taskId": idOfSelectedTask
    };

    chrome.runtime.sendMessage(temp);

    // Hide it AFTER the action was triggered
    $(".custom-menu").hide(100);

    location.reload();
});
