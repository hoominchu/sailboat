var idOfSelectedTask = 0;

chrome.storage.local.get("TASKS", function (taskObject) {
    if (taskObject["TASKS"]) {
        var Tasks = taskObject["TASKS"];
        // console.log(Tasks);
        for (var task_id in Tasks) {
            if (task_id != "lastAssignedId") {
                $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name + '</button>');
            }
        }
        $(".tasks").click(function () {
            idOfSelectedTask = Tasks[$(this).attr('id')].id;
            $("#historyTable").empty();
            var selectedTask = Tasks[$(this).attr('id')];
            for (var i = selectedTask.history.length - 1; i > -1; i--) {
                createRow(selectedTask.history[i])
            }
        });
    }
});

function createRow(page) {

    var tableRow = $('<tr class="historyRow"></tr>');

    tableRow.append('<td><input type="checkbox" class="selectBox" value="'+page.url+'"></td>');

    tableRow.append('<td><a href="' + page.url + '">' + page.title + '</a></td>');

    if (page.isLiked) {
        tableRow.append('<td>Yes</td>');
    }
    else {
        tableRow.append('<td></td>')
    }

    // var td = $('<td></td>');

    // if(page.totalTimeSpent.seconds>0){
    //   td.text(page.totalTimeSpent.seconds + " seconds")
    // }
    // if(page.totalTimeSpent.minutes>0){
    //   td.text(page.totalTimeSpent.minutes + " minutes")
    // }
    // if(page.totalTimeSpent.hours>0){
    //   td.text(page.totalTimeSpent.hours + " hours");
    // }
    // if (!Number.isNaN(page.totalTimeSpent))
        // td.text(Math.floor(page.totalTimeSpent / 60000) + " minutes")

    // tableRow.append(td)
    tableRow.append('<td>' + page.timeVisited[page.timeVisited.length - 1].slice(0, 25) + '</td>')

    $("#historyTable").append(tableRow)
}


//Sorting Methods

var table = $("#table");

$('#title, #liked, #time, #lastVisit')
    .wrapInner('<span title="sort this column"/>')
    .each(function () {

        var th = $(this),
            thIndex = th.index(),
            inverse = false;

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

// var options = {
//     valueNames: [ 'name', 'born' ]
// };
//
//
// var userList = new List('table', options);


$("#selectAll").click(function(){
    var checkBoxes = $(".selectBox");
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
    var type = $(this).attr("data-action");
    var urls = [];
    $('input[type=checkbox]').each(function () {
        var x = (this.checked ? $(this).val() : "");
        if(x != ""){
            urls.push(x);
        }
    });

    var temp = {
        "urls": urls,
        "type": type,
        "taskId": idOfSelectedTask
    }

    chrome.runtime.sendMessage(temp);

    // Hide it AFTER the action was triggered
    $(".custom-menu").hide(100);

    location.reload();
});

