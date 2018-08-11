$(document).ready(function () {
    chrome.storage.local.get("Settings", function (settings) {
        settings = settings["Settings"];
        chrome.storage.local.get("TASKS", function (taskObject) {
            if (taskObject["TASKS"]) {
                var TASKS = taskObject["TASKS"];//On retreiving TASKS from chrome storage, one gets an object {TASKS: balhah}, to retreive the actual array call taskObject["TASKS"]
                chrome.storage.local.get("CTASKID", function (cTaskIdObject) {
                    if (cTaskIdObject["CTASKID"] > -1) {
                        var CTASKID = cTaskIdObject["CTASKID"];
                        loadDock(settings);
                        loadTaskNames(TASKS, CTASKID);
                        loadArchiveButton();
                        markLikedStatus(window.location.href, TASKS, CTASKID);
                    }
                });
            }
        });
    });
});

function loadDock(settings) {
    var dock = $('<div class="float dock" id="sailboat-dock"></div>');
    $('body').append(dock);
    dock.draggable();

    // Appending collapse button
    let collapseButton = $('<div id="collapse-dock-btn" class="float round-corner collapse-btn"><img id="collapse-img"></div>');
    $('body').append(collapseButton);
    $('#collapse-dock-btn').draggable();
    let collapseImgURL = chrome.runtime.getURL("images/left-arrow.svg");
    document.getElementById("collapse-img").src = collapseImgURL;
    collapseButton.click(function () {
        $("#sailboat-dock").animate({width: 'toggle', easing: 'slow', right: '+=0'});
        $('#collapse-img').transition({rotate: '+=180'}, 'slow');
        // chrome.storage.local.get("Settings", function (settings) {
        //     settings = settings["Settings"];
        //     if (JSON.parse(settings["isDockCollapsed"])) {
        //         settings["isDockCollapsed"] = "false";
        //     } else {
        //         settings["isDockCollapsed"] = "true";
        //     }
        //     chrome.storage.local.set({"Settings": settings});
        // });
    });
}

function loadArchiveButton() {
    let likeButton = document.createElement('img');
    let archiveIconPath = chrome.runtime.getURL("images/archive-search.svg");
    likeButton.className = 'sailboat-like-btn';
    likeButton.id = 'sailboat-like-btn';
    likeButton.src = archiveIconPath;
    $("#sailboat-like-btn").draggable();
    $(document).on('click', "#sailboat-like-btn", function () {
        $(this).toggleClass("sailboat-like-btn-liked");
        chrome.runtime.sendMessage({
            "type": "like-page",
            "url": window.location.href
        });

        if ($(this).hasClass("sailboat-like-btn-liked")) {
            //Store page content only after a page is liked.
            storePageContent(window.location.href, document.documentElement.innerHTML);
        } else {
            deletePageContent(window.location.href, document.documentElement.innerHTML);
        }
    });
    document.getElementById("sailboat-dock").appendChild(likeButton);
}

function deletePageContent(url, content) {
    chrome.storage.local.get("Page Content", function (pageContentObj) {
        pageContentObj = pageContentObj["Page Content"];
        delete pageContentObj[url];
        chrome.storage.local.set({"Page Content": pageContentObj});
        console.log("Content deleted");
    });
}

function storePageContent(url, content) {
    chrome.storage.local.get("Page Content", function (pageContentObj) {
        pageContentObj = pageContentObj["Page Content"];
        pageContentObj[url] = content;
        chrome.storage.local.set({"Page Content": pageContentObj});
        console.log("Content stored");
    });
}

function markLikedStatus(url, TASKS, ctaskid) {
    let likedPagesOfCurrentTask = TASKS[ctaskid].likedPages;
    const isPageLiked = (likedPagesOfCurrentTask.indexOf(url) > -1);
    if (isPageLiked) {
        $("#sailboat-like-btn").addClass("sailboat-like-btn-liked");
    }
    else {
        if ($("#sailboat-like-btn").hasClass("sailboat-like-btn-liked")) {
            $("#sailboat-like-btn").removeClass("sailboat-like-btn-liked");
        }
    }
}

function loadTaskNames(TASKS, ctaskid) {

    for (let taskid in TASKS) {
        if (TASKS[taskid].archived === false) {
            let task_button = $('<div class="task-btn" id="' + taskid + '">' + TASKS[taskid].name + '</div>');
            if (taskid === ctaskid) {
                task_button.addClass("current-task");
            }
            task_button.click(function (task) {
                return function (task) {
                    chrome.runtime.sendMessage(
                        {
                            "type": "switch-task",
                            "nextTaskId": task.currentTarget.id
                        }
                    );
                }(task);
            });

            $("#sailboat-dock").append(task_button);
        }
    }
}