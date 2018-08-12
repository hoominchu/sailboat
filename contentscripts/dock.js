let TASKS = {};
let CTASKID = 0;

$(document).ready(function () {
    chrome.storage.local.get("Settings", function (settings) {
        settings = settings["Settings"];
        chrome.storage.local.get("TASKS", function (taskObject) {
            if (taskObject["TASKS"]) {
                TASKS = taskObject["TASKS"];//On retreiving TASKS from chrome storage, one gets an object {TASKS: balhah}, to retreive the actual array call taskObject["TASKS"]
                chrome.storage.local.get("CTASKID", function (cTaskIdObject) {
                    if (cTaskIdObject["CTASKID"] > -1) {
                        CTASKID = cTaskIdObject["CTASKID"];
                        loadDock(settings);
                        loadTaskNames(CTASKID);
                        loadArchiveButton();
                        markLikedStatus(window.location.href, TASKS, CTASKID);
                        loadArchiveSearchBar();
                        loadHoverBooster();
                    }
                });
            }
        });
    });
});

function loadHoverBooster() {
    $('a').on({
        mouseenter: function () {
            const targetURL = this.href;
            chrome.runtime.sendMessage({"type": "onmouseover", "target-url": targetURL});
            const tasksWithURL = getTasksWithURL(targetURL);
            if (tasksWithURL.length > 0) {
                let tooltipData = '';
                for (let i = 0; i < tasksWithURL.length; i++) {
                    tooltipData += tasksWithURL[i];
                    if (i !== tasksWithURL.length - 1) {
                        tooltipData += ', ';
                    }
                }
                $(this).attr('data-toggle', 'tooltip');
                $(this).attr('data-placement', 'top');
                $(this).attr('title', tooltipData);
            }
        },
        mouseleave: function () {
            chrome.runtime.sendMessage({"type": "onmouseout"});
        }
    });
}

function getTasksWithURL(targetURL) {
    const tasksWithURL = [];
    for (let taskid in TASKS) {
        if (taskid !== "lastAssignedId" && taskid !== CTASKID) {
            const task = TASKS[taskid];
            for (const tabIndex in task.tabs) {
                const tab = task.tabs[tabIndex];
                if (tab.url === targetURL) {
                    tasksWithURL.push(task.name);
                }
            }
        }
    }
    return tasksWithURL;
}

function loadArchiveSearchBar() {
    const archiveSearchBar = $('<input type="search" autofocus="autofocus" autocomplete="on" class="float search-archive-input form-control round-corner" style="" id="searchArchiveInput" placeholder="Search through the content of your archived pages">');
    archiveSearchBar.hide();
    $('body').append(archiveSearchBar);
    archiveSearchBar.draggable();
    // Keypress shortcut
    $(document).keyup(function (keyEvent) {
        if (keyEvent.keyCode === 83 && keyEvent.altKey == true) {
            $('#searchArchiveInput').siblings().css({"filter": "blur(100px) grayscale(100%) brightness(30%)"});
            $('#searchArchiveInput').show();
            $('#searchArchiveInput').focus();
        } else if (keyEvent.keyCode === 27) {
            $('#searchArchiveInput').siblings().css({"filter": ""});
            $('#searchArchiveInput').hide();
        }
    });

    $("#searchArchiveInput").keyup(function (event) {
        if (event.keyCode === 13) {
            $('#searchArchiveInput').siblings().css({"filter": ""});
            $('#searchArchiveInput').hide();
            const query = $("#searchArchiveInput").val();
            chrome.runtime.sendMessage({"type": "search-archive", "query": query});
        }
    });
}

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
            storePageContent(window.location.href, document.documentElement.innerText);
        } else {
            deletePageContent(window.location.href);
        }
    });
    document.getElementById("sailboat-dock").appendChild(likeButton);
}

function deletePageContent(url) {
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

function loadTaskNames(ctaskid) {

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