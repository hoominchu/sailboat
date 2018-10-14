const url = window.location.href;
const navbar = $('<nav class="navbar navbar-expand-lg navbar-dark bg-dark">' +
    '    <a class="navbar-brand" href="#" style="padding-left: 1.5em"><img src="../images/logo_white_sails_no_text.png" width="40em"></a>' +
    '    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarColor01"' +
    '            aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">' +
    '        <span class="navbar-toggler-icon"></span>' +
    '    </button>' +
    '' +
    '    <div class="collapse navbar-collapse" id="navbarColor01">' +
    '        <ul class="navbar-nav mr-auto">' +
    '            <li class="nav-item ">' +
    '                <a class="nav-link" href="index.html">Home</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="history.html">History</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="searchArchive.html">Search</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="dashboard.html">Dashboard</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="collections.html">Collections</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="notes.html">Notes</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="settings.html">Settings</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="about.html">About</a>' +
    '            </li>' +
    '            <li class="nav-item">' +
    '                <a class="nav-link" href="help.html">Help</a>' +
    '            </li>' +
    '        </ul>' +
    '    </div>' +
    '</nav>');

$("body").append(navbar);

const navItems = document.getElementsByClassName("nav-link");

for (let i = 0; i < navItems.length; i++) {
    if (navItems[i].href == url) {
        navItems[i].parentElement.className += " active";
    }
}
