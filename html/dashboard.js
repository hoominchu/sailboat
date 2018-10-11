let colours = ["rgb(118,196,174)", "rgb(202,189,128)", "rgb(216,108,112)", "rgb(0,31,63), rgb(133,20,75)", "rgb(0,116,217)", "rgb(170,170,170)", "rgb(46,204,64)", "rgb(0,31,63), rgb(133,20,75)", "rgb(255,133,27)", "rgb(17,17,17)"];

function processHistoryStats(historyStats, historyDateArray) {

    let datasets = [];
    let i = 0;
    for (let task in historyStats) {
        let timeSpentOnTask = [];
        let taskStats = historyStats[task];

        for (let idx in historyDateArray) {
            let date = historyDateArray[idx];
            let timeInSec = taskStats[date];
            timeSpentOnTask.push(timeInSec);
        }
        let bgColor = colours[i];
        i++;

        let taskData = {
            label: taskStats["taskName"],
            data: timeSpentOnTask,
            backgroundColor: bgColor,
            borderWidth: 1
        };
        datasets.push(taskData);
    }

    let dates = [];
    for (let idx in historyDateArray) {
        let date = historyDateArray[idx];
        date = date.substr(8, date.length)
        date = moment(date, 'DD-MM-YYYY').format('DD MMM');
        dates.push(date);
    }

    let data = {
        labels: dates,
        datasets: datasets
    };

    renderChart(data);
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
                if (!historyStats[task]["taskName"]) {
                    historyStats[task]["taskName"] = taskHistory["taskName"];
                }
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
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        let label = data.datasets[tooltipItem.datasetIndex].label;
                        let timeLabel = tooltipItem.yLabel;
                        if (timeLabel < 60) {
                            return "Less than a minute"
                        }

                        let h = Math.floor(timeLabel / 3600);
                        if (h === 0) {
                            h = '';
                        }
                        if (h.toString() !== '') {
                            h += " hrs ";
                        }
                        let m = Math.floor((timeLabel % 3600) / 60);
                        if (m === 0) {
                            m = '';
                        }
                        if (m.toString() !== '') {
                            if (m.toString().length === 1) {
                                m = '0' + m;
                            }
                            m += " mins";
                        }
                        label = h + m;
                        return label;
                    }
                }
            },
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
    logView(window.location.pathname);
    getHistory(1);
});