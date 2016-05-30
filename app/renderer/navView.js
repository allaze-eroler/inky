const $ = window.jQuery = require('./jquery-2.2.3.min.js');
const path = require("path");
const _ = require("lodash");

const slideAnimDuration = 200;
var sidebarWidth = 200;

var $sidebar = null;
var $twoPane = null;

var visible = false;
var events = {};

$(document).ready(() => {
    $sidebar = $(".sidebar");
    $twoPane = $(".twopane");
    $sidebarSplit = $("#main").children(".split");
    $sidebarSplit.hide();
    $sidebarSplit.css("left", 0);

    $sidebar.on("click", ".nav-group-item", function(event) {
        event.preventDefault();

        var $targetNavGroupItem = $(event.currentTarget);
        highlight$NavGroupItem($targetNavGroupItem);

        var fileIdStr = $targetNavGroupItem.attr("data-file-id");
        var fileId = parseInt(fileIdStr);
        events.clickFileId(fileId);
    });
});

function setMainInkFilename(name) {
    $sidebar.find(".nav-group.main-ink .nav-group-item .filename").text(name);
}

function setFiles(mainInk, allFiles) {

    var unusedFiles = _.filter(allFiles, f => f.isSpare);
    var normalIncludes = _.filter(allFiles, f => !f.isSpare && f != mainInk);
    var groupedIncludes = _.groupBy(normalIncludes, f => { 
        var dirName = path.dirname(f.relativePath());
        if( dirName == "." )
            dirName = "";
        return dirName;
    });

    var groupsArray = _.map(groupedIncludes, (group, name) => { return {name: name, files: group}; });
    groupsArray = _.sortBy(groupsArray, g => g.name);

    if( unusedFiles.length > 0 )
        groupsArray.push({
            name: "Unused files",
            files: unusedFiles
        });

    var $sidebar = $(".sidebar");
    $sidebar.empty();

    var extraClass = mainInk.hasUnsavedChanges || mainInk.brandNew ? "unsaved" : "";
    var $main = `<nav class="nav-group main-ink">
                    <h5 class="nav-group-title">Main ink file</h5>
                    <a class="nav-group-item ${extraClass}" data-file-id="${mainInk.id}">
                        <span class="icon icon-book"></span>
                        <span class="filename">${mainInk.filename()}</span>
                    </a>
                </nav>`;
    $sidebar.append($main)

    groupsArray.forEach(group => {
        var items = "";

        group.files.forEach((file) => {
            var name = file.isSpare ? file.relativePath() : file.filename();
            var extraClass = file.hasUnsavedChanges || file.brandNew ? "unsaved" : "";
            items = items + `<span class="nav-group-item ${extraClass}" data-file-id="${file.id}">
                                <span class="icon icon-doc-text"></span>
                                <span class="filename">${name}</span>
                            </span>`;
        });

        extraClass = "";
        if( group.files === unusedFiles )
            extraClass = "unused";

        var $group = $(`<nav class="nav-group ${extraClass}"><h5 class="nav-group-title">${group.name}</h5> ${items} </nav>`);
        $sidebar.append($group);
    });
}

function highlight$NavGroupItem($navGroupItem) {
    $sidebar.find(".nav-group-item").not($navGroupItem).removeClass("active");
    $navGroupItem.addClass("active");
}

function highlightRelativePath(relativePath) {
    var dirName = path.dirname(relativePath);
    if( dirName == "." )
        dirName = "";

    var filename = path.basename(relativePath);

    var $group = $sidebar.find(".nav-group").filter((i, el) => $(el).find(".nav-group-title").text() == dirName);
    if( dirName == "" ) $group = $group.add(".nav-group.main-ink");

    var $file = $group.find(".nav-group-item .filename").filter((i, el) => $(el).text() == filename);
    var $navGroupItem = $file.closest(".nav-group-item");
    highlight$NavGroupItem($navGroupItem);
}

function hide() {
    if( !visible )
        return;

    sidebarWidth = $sidebarSplit.position().left;

    $sidebar.animate({
        width: 0,
    }, slideAnimDuration, () => {
        $sidebar.hide();
    });
    $twoPane.animate({
        left: 0
    }, slideAnimDuration);
    $sidebarSplit.animate({
        left: 0
    }, slideAnimDuration);
    visible = false;
}

function show() {
    if( visible )
        return;

    // hidden class only exists in initial state
    $sidebar.removeClass("hidden");
    $sidebarSplit.removeClass("hidden");

    $sidebar.show();
    $sidebarSplit.show();

    $sidebar.animate({
        width: sidebarWidth-1 // border
    }, slideAnimDuration);
    $twoPane.animate({
        left: sidebarWidth
    }, slideAnimDuration);
    $sidebarSplit.animate({
        left: sidebarWidth
    }, slideAnimDuration);
    visible = true;
}

exports.NavView = {
    setMainInkFilename: setMainInkFilename,
    setFiles: setFiles,
    highlightRelativePath: highlightRelativePath,
    setEvents: e => events = e,
    hide: hide,
    show: show,
    toggle: () => { if( visible ) hide(); else show(); }
}