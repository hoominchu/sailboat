let historyStats = {};
let taskNames = [];
let n = 0;
let allTaskNameRetrieved = 0;
let numDays = 1;
let timeSpentArray = [];


function getTaskNamesFromIDs(taskIds) {
    chrome.storage.local.get("TASKS", function (tasksObject) {
        tasksObject = tasksObject["TASKS"];
        if (tasksObject) {
            for (var idx in taskIds) {
                var taskId = taskIds[idx];
                var task = tasksObject[taskId];
                if (task) {
                    taskNames.push(task.name);
                } else {
                    taskNames.push("NULL");
                }
            }
            allTaskNameRetrieved = 1;
        }
        renderChart();
    });
    // while (1 === 1) {
    //     if (allTaskNameRetrieved === 1) {
    //         break;
    //     }
    // }
}

function getHistoryStats(historyDate, callback) {
    chrome.storage.local.get(historyDate, function (history) {
        history = history[historyDate];
        for (task in history) {
            if (!(historyStats[task])) {
                historyStats[task] = 0;
            }

            var taskHistory = history[task];
            historyStats[task] += taskHistory["totalTime"];
        }
        n += 1;
        var taskIds = [];
        for (task in historyStats) {
            taskIds.push(task);
            timeSpentArray.push(historyStats[task]);
        }
        callback(taskIds);
    });

}

function getLastWeekHistory() {

    let date = new Date();

    for (var i = 0; i < numDays; i++) {
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        var dateString = dd + '-' + mm + '-' + yyyy;
        var historyDate = 'HISTORY-' + dateString;
        getHistoryStats(historyDate, getTaskNamesFromIDs);
        date.setDate(date.getDate() - 1);

    }

    // while (1 === 1) {
    //     if (n === numDays) {
    //         break;
    //     }
    // }
}

getLastWeekHistory();
// var taskIds = [];
// var timeSpent = [];
// for (task in historyStats) {
// taskIds.push(task);
// timeSpent.push(historyStats[task]);
// }
// getTaskNamesFromIDs(taskIds);

function renderChart() {
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: taskNames,
            datasets: [{
                label: 'Time Spent',
                data: timeSpentArray,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}