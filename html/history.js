function displayHistory(fullTaskHistory, timeSpentOnUrl) {
    let data = [];
    for (let idx in fullTaskHistory) {
        let historyEntry = fullTaskHistory[idx];
        let url = historyEntry[0];
        let title = historyEntry[1];
        if (title === "") {
            title = url
        }
        let titleWithLink = "<a href='" + url + "'>" + title + "</a>";

        // get date and time from visit time
        let visitTime = historyEntry[2];
        let date = new Date(visitTime);
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        let yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();
        if (h < 10) {
            h = '0' + h;
        }
        if (m < 10) {
            m = '0' + m;
        }
        if (s < 10) {
            s = '0' + s;
        }
        let time = "<span class='hide'>" + visitTime + "</span>" + h + ":" + m + ":" + s;
        date = "<span class='hide'>" + visitTime + "</span>" + dd + '-' + mm + '-' + yyyy;

        let totalTimeSpent = timeSpentOnUrl[url];
        if (totalTimeSpent < 60) {
            totalTimeSpent = "<span class='hide'>" + totalTimeSpent + "</span>" + "Less than a minute";
        } else {
            let hours = Math.floor(totalTimeSpent / 3600);
            if (hours === 0) {
                hours = '';
            }
            if (hours.toString() !== '') {
                hours += " hrs ";
            }
            let min = Math.floor((totalTimeSpent % 3600) / 60);
            if (min === 0) {
                min = '';
            }
            if (min.toString() !== '') {
                if (min.toString().length === 1) {
                    min = '0' + min;
                }
                min += " mins";
            }
            totalTimeSpent = "<span class='hide'>" + totalTimeSpent + "</span>" + hours + min;
        }

        data.push([titleWithLink, totalTimeSpent, date, time])
    }

    $('#historyTable').DataTable({
        data: data,
        columns: [
            {title: "Title", width: "60%"},
            {title: "Time Spent", width: "20%"},
            {title: "Date", width: "10%"},
            {title: "Time", width: "10%"}
        ],
        order: [[3, "desc"]],
        columnDefs: [
            {type: 'any-number', targets: [1, 2, 3]}
        ]
    });
}

function getAllHistory(historyDates, taskId) {
    let timeSpentOnUrl = {};
    let fullTaskHistory = [];
    chrome.storage.local.get(historyDates, function (results) {
        for (let historyDate in results) {
            let history = results[historyDate];
            if (history[taskId]) {
                let taskHistory = history[taskId];
                for (let url in taskHistory.urls) {
                    let urlVisited = taskHistory.urls[url];
                    if (!timeSpentOnUrl[url]) {
                        timeSpentOnUrl[url] = urlVisited.timeSpent;
                    } else {
                        timeSpentOnUrl[url] += urlVisited.timeSpent;
                    }
                    let historyEntry = [url, urlVisited.title, urlVisited.lastVisited];
                    fullTaskHistory.push(historyEntry);
                }
            }
        }
        displayHistory(fullTaskHistory, timeSpentOnUrl);
    })
}

function getTaskHistory(taskId) {
    chrome.storage.local.get(null, function (result) {
        let historyDates = [];
        for (let key in result) {
            if (key.includes("HISTORY", 0)) {
                historyDates.push(key);
            }
        }
        getAllHistory(historyDates, taskId);
    });
    chrome.storage.local.get("TASKS", function (tasks) {
        tasks = tasks["TASKS"];
        $("#taskNameBanner").text("History for " + tasks[taskId].name + " Task");
    });
}

function resetTable() {
    $('#historyTable').remove();
    $('#historyTable_wrapper').remove();
    $('#historyTableDiv').append('<table id="historyTable" class="display" width="100%"></table>');
}

function loadTimelineChart() {
    let topics = {};

//     [
//         [Date.UTC(1970, 10, 25), 0],
//         [Date.UTC(1970, 11,  6), 0.25],
//     ]
// }, {
//     name: "Winter 2015-2016",
//     data: [
//         [Date.UTC(1970, 10,  9), 0],
//         [Date.UTC(1970, 10, 15), 0.23],
//     ]
// }, {
//     name: "Winter 2016-2017",
//     data: [
//         [Date.UTC(1970, 9, 15), 0],
//         [Date.UTC(1970, 9, 31), 0.09],
//     ]
// }]

    let freqCounter = {};

    // Go over the object and append an element to main body.
    for (let i = 0; i < historyObject.length; i++) {

        var video = historyObject[i];

        if (video.title.indexOf('video that has been removed') > -1)
            continue;

        // var $elem = $template.clone();
        // $elem.removeClass('template');
        // $elem.find('.video-title').text(video.title.replace('Watched ', '') + '           |                ' + video.time);
        // $elem.css('display', 'block');
        // $('.container').append($elem);

        let dateString = video.time.substr(0,10);
        let title = video.title.replace('Watched ', '');

        let year = parseInt(dateString.substr(0, 4));
        let month = parseInt(dateString.substr(5, 2));
        let date = parseInt(dateString.substr(8, 2));

        let key = year + '-' + month;

        // Chart 2
        let doc = nlp(title.toLowerCase());
        let t = doc.topics().json();
        for (let j = 0; j < t.length; j++) {
            let topic = t[j].text;

            // Clean the topic string
            topic = topic.replace(/[^a-z0-9]/gmi, ' ').replace(/\s+/g, ' ').trim();

            if (topics.hasOwnProperty(topic)) {
                topics[topic]['data'].push(Date.UTC(year, month, date));
            } else {
                topics[topic] = {
                    name: video.title.replace('Watched ', ''),
                    data:[Date.UTC(year, month, 1)]
                };
            }

            if (freqCounter.hasOwnProperty(topic)) {
                if (freqCounter[topic].hasOwnProperty(key)) {
                    freqCounter[topic][key] = freqCounter[topic][key] + 1;
                } else {
                    freqCounter[topic][key] = 1;
                }
            } else {
                freqCounter[topic] = {};
                freqCounter[topic][key] = 1;
            }
        }
    }

    let chartData = [];
    for (let topic in topics) {
        let obj = {};
        obj.name = topic;
        obj.data = [];
        let freqObj = freqCounter[topic];

        for (let key in freqObj) {
            if (freqObj[key] < 5)
                continue;
            const y = parseInt(key.split('-')[0]);
            const m = parseInt(key.split('-')[1]);
            let entry = [Date.UTC(y, m, 15), freqObj[key]];
            obj.data.push(entry);
        }
        if (obj.data.length > 0) {
            obj.data.reverse();
            chartData.push(obj);
        }
    }

    Highcharts.chart('history-timeline', {
        chart: {
            type: 'spline'
        },
        title: {
            text: 'See how your browsing habits have changed'
        },
        subtitle: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Frequency'
            },
            min: 0
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%b}: {point.y:.2f} times'
        },

        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        },

        colors: ['#6CF', '#39F', '#06C', '#036', '#000'],

        // Define the data points. All series have a dummy year
        // of 1970/71 in order to be compared on the same x axis. Note
        // that in JavaScript, months start at 0 for January, 1 for February etc.
        series: chartData,

        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    plotOptions: {
                        series: {
                            marker: {
                                radius: 2.5
                            }
                        }
                    }
                }
            }]
        }
    });
}

$(document).ready(function () {
    logView(window.location.pathname);
    chrome.storage.local.get("TASKS", function (taskObject) {
        if (taskObject["TASKS"]) {
            const Tasks = taskObject["TASKS"];
            // console.log(Tasks);
            for (let task_id in Tasks) {
                if (task_id != "lastAssignedId") {
                    if (Tasks[task_id].name.length < 21) {
                        $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name + '</button>');
                    }
                    else {
                        $("#tasks-list").append('<button type="button" class="tasks btn btn-outline-primary" id="' + Tasks[task_id].id + '"> ' + Tasks[task_id].name.slice(0, 18) + ".." + '</button>');
                    }
                }
            }
        }
        $('.tasks').click(function () {
            resetTable();
            let idOfSelectedTask = $(this).attr('id');
            getTaskHistory(idOfSelectedTask);
        });
    });

    chrome.storage.local.get("CTASKID", function (cTaskIdObject) {
        if (cTaskIdObject["CTASKID"]) {
            const ctaskid = cTaskIdObject["CTASKID"];
            getTaskHistory(ctaskid);
        } else {
            getTaskHistory(0);
        }
    });
    loadTimelineChart();
});