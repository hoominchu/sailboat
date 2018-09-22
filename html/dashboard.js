function processHistoryStats(historyStats) {
    let taskNames = [];
    let taskIds = [];
    let timeSpentOnTasks = [];

    for (var task in historyStats) {
        taskIds.push(task);
        timeSpentOnTasks.push(historyStats[task]);
    }

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
        }
        renderChart(taskNames, timeSpentOnTasks);
    });

}

function getHistoryStats(historyDateArray) {
    let historyStats = {};
    chrome.storage.local.get(historyDateArray, function (results) {
        for (let historyDate in results) {
            let history = results[historyDate];
            for (let task in history) {
                if (!(historyStats[task])) {
                    historyStats[task] = 0;
                }
                let taskHistory = history[task];
                historyStats[task] += taskHistory["totalTime"];
            }
        }
        processHistoryStats(historyStats);
    });
}


function getHistory(numDays) {

    let date = new Date();
    let historyDatesArrray = [];
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
        historyDatesArrray.push(historyDate);
        date.setDate(date.getDate() - 1);
    }
    getHistoryStats(historyDate);
}


$('#today').click(function () {
    getHistory(1);
});
$('#last-1-week').click(function () {
    getHistory(7);
});
$('#last-15-days').click(function () {
    getHistory(15);
});
$('#last-1-month').click(function () {
    getHistory(30);
});

function renderChart(tasks, timeSpentOnTasks) {
    document.getElementById("myChart").innerHTML = '';
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tasks,
            datasets: [{
                label: 'Time Spent',
                data: timeSpentOnTasks,
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

$(document).ready(function () {
    getHistory(1);
});