function processHistoryStats(historyStats, historyDateArray) {
    let data = {};

    chrome.storage.local.get("TASKS", function (tasksObject) {
        tasksObject = tasksObject["TASKS"];
        if (tasksObject) {

            let historyStatsWithTaskNames = {};

            for (let taskId in historyStats) {
                let taskObject = tasksObject[taskId];
                let taskName = "";
                if (taskObject) {
                    taskName = taskObject.name;
                } else {
                    taskName = "NULL-" + taskId.toString();
                }
                historyStatsWithTaskNames[taskName] = historyStats[taskId];
            }

            historyStats = historyStatsWithTaskNames;

            let datasets = [];

            for (let task in historyStats) {
                let timeSpentOnTask = [];
                let taskStats = historyStats[task];

                for (let idx in historyDateArray) {
                    let date = historyDateArray[idx];
                    timeSpentOnTask.push(taskStats[date]);
                }
                let round = Math.round, rand = Math.random, s = 255;
                let r = round(rand() * s);
                let g = round(rand() * s);
                let b = round(rand() * s);
                let bgColor = 'rgba(' + r + ',' + g + ',' + b + ',' + ' 0.5)';
                let borderColor = 'rgba(' + r + ',' + g + ',' + b + ',' + ' 1)';
                let
                    taskData = {
                        label: task.toString(),
                        data: timeSpentOnTask,
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        borderWidth: 1
                    };
                datasets.push(taskData);
            }

            data = {
                labels: historyDateArray,
                datasets: datasets
            };


        }
        renderChart(data);
    });

}

function getHistoryStats(historyDateArray) {
    let historyStats = {};

    chrome.storage.local.get(historyDateArray, function (results) {
        for (let historyDate in results) {
            let history = results[historyDate];
            for (let task in history) {
                if (!(historyStats[task])) {
                    let historyStatsOfTask = {};
                    for (let idx in historyDateArray) {
                        let date = historyDateArray[idx];
                        historyStatsOfTask[date] = 0;
                    }
                    historyStats[task] = historyStatsOfTask;
                }
                let taskHistory = history[task];
                historyStats[task][historyDate] += taskHistory["totalTime"];
            }
        }
        processHistoryStats(historyStats, historyDateArray);
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
    getHistoryStats(historyDatesArrray);
}

function resetCanavas() {
    $('#myChart').remove();
    $('#chartDiv').append('<canvas id="myChart" width="250" height="100"></canvas>');
}

$('#today').click(function () {
    resetCanavas();
    getHistory(1);
});
$('#last-1-week').click(function () {
    resetCanavas();
    getHistory(7);
});
$('#last-15-days').click(function () {
    resetCanavas();
    getHistory(15);
});
$('#last-1-month').click(function () {
    resetCanavas();
    getHistory(30);
});

function renderChart(data) {
    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: data,
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