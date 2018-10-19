const reportSnapshotPeriod = 5; // in minutes

// Alarm for taking snapshot of Sailboat
chrome.alarms.create('reportSnapshot', {'delayInMinutes': 5, 'periodInMinutes': reportSnapshotPeriod});

function getNArchivedTasks(tasks) {
    let nArchivedTasks = 0;

    if (!tasks)
        return nArchivedTasks;

    for (const taskid in tasks) {
        if (taskid !== 'lastAssignedId') {
            if (tasks[taskid]['archived']) {
                nArchivedTasks++;
            }
        }
    }
    return nArchivedTasks;
}

function getNArchivedPages(tasks) {
    let nArchivedPages = {};

    if (!tasks)
        return nArchivedPages;

    for (const taskid in tasks) {
        if (taskid !== 'lastAssignedId') {
            nArchivedPages[taskid] = tasks[taskid]['likedPages'].length;
        }
    }
    return nArchivedPages;
}

function recordInReport() {
    var todayDate = new Date().toJSON().slice(0, 10);
    chrome.storage.local.get('Report Switches', function (report) {
        report = report['Report Switches'];
        if (report.hasOwnProperty(todayDate)) {
            report[todayDate]['nSwitches']++;
        } else {
            report[todayDate] = {};
            report[todayDate]['nSwitches'] = 1;
        }
        chrome.storage.local.set({'Report Switches': report});
    })
}

function updateClickReport(key) {
    chrome.storage.local.get('Report Clicks', function (report) {
        report = report['Report Clicks'];
        report[key]++;
        chrome.storage.local.set({'Report Clicks': report});
    });
}

function takeReportSnapshot() {

    const now = new Date().getTime();

    chrome.storage.local.get(['Report Snapshots', 'TASKS'], function (response) {
        chrome.windows.getAll({populate: true}, function (windows) {

            let reportSnapshots = response['Report Snapshots'];
            let tasks = response['TASKS'];

            reportSnapshots[now] = {};

            const nTasks = Object.keys(tasks).length - 1;
            const nArchivedTasks = getNArchivedTasks(tasks);
            const nArchivedPages = getNArchivedPages(tasks);
            reportSnapshots[now]['nTasks'] = nTasks;
            reportSnapshots[now]['nArchivedTasks'] = nArchivedTasks;
            reportSnapshots[now]['nArchivedPages'] = nArchivedPages;

            // Windows part
            let windowsState = {};

            for (const k in windows) {
                const windowID = windows[k]['id'];
                const nTabs = windows[k]['tabs'].length;
                const isIncognito = windows[k]['incognito'];
                windowsState[windowID] = {};
                windowsState[windowID]['nTabs'] = nTabs;
                windowsState[windowID]['isIncognito'] = isIncognito;
            }
            reportSnapshots[now]['windowState'] = windowsState;

            chrome.storage.local.set({'Report Snapshots': reportSnapshots});
        });
    });
}
