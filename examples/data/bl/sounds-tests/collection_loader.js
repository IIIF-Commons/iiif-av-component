
var rangeDetails = {}

function determineRangePlayInfo(range, manifestId){
    var playList = [];
    addToPlayList(playList, range);
    var message = "Range: <b>" + getString(range.label) + "</b> (" + range.id + ")<br/>Parts: <br/>";
    segments = [];
    for(var i=0; i<playList.length; i++){
        part = playList[i];
        // is this playable chunk a continuation of the previous one?
        var continuedSegment = null;
        if(segments.length > 0){
            segment = segments[segments.length - 1];
            if(segment.canvas == part.canvas){
                // here it gets tricky - how much slosh time do we allow?
                // For now, they must match exactly to be considered continuous
                if(segment.stop == part.start){
                    continuedSegment = segment;
                    segment.stop = part.stop;
                }
            }
        }
        if(!continuedSegment){
            segments.push(part);
        }
        message += (i+1) + ": start: " + part.start + ", stop: " + part.stop + ", canvas: " + part.canvas;
        message += "<br/>";
    }

    message += "<i>Virtual</i> coalesced segments, what canvas time actually needs to be played: <br/>";
    for(var i=0; i<segments.length; i++){
        segment = segments[i];
        message += (i+1) + ": start: " + segment.start + ", stop: " + segment.stop + ", canvas: " + segment.canvas;
        message += "<br/>";
    }
    rangeDetails[manifestId + range.id] = message;
}

function addToPlayList(playList, range){
    // compute the playable canvas time of the range
    // walk tree, gathering playable nodes
    var children = range.items || range.members; // yes, in flux...
    if(children){
        for(var i=0; i<children.length; i++){
            var child = children[i];
            if(child.type == "Canvas"){
                var parts = child.id.split("#");
                var part = {
                    "canvas": parts[0],
                    "start": 0,
                    "stop": "END"
                }
                if(parts.length > 1){
                    var t = /t=(.*)/g.exec(parts[1]);
                    if(t && t[1]){
                        // we have time...
                        startStop = t[1].split(",");
                        part["start"] = startStop[0];
                        if(t.length > 1){
                            part["stop"] = startStop[1];
                        }
                    }
                }
                playList.push(part);
            } else if(child.type == "Range") {
                addToPlayList(playList, child);
            }
        }
    }      
}



function makeUrl(manifestId, rangeId){
    var s = "http://localhost:8002/examples/template.html#?manifest=" + manifestId;
    if(rangeId){
        s += "&rid=" + rangeId;
    }
    return s;
}

function getString(langMap){
    if(typeof langMap === 'string') return langMap; // not valid, but...
    var anyValue = null;
    for(lang in langMap){
        anyValue = langMap[lang][0];
        break;
    }
    return anyValue;
}

function loadRanges(manifestId, listId){
    $.getJSON(manifestId, function(manifest){
        processItems(manifestId, manifest.structures, $("#" + listId), "r_");
    });
}

function processItems(manifestId, items, $element, prefix){
    var $list = null;
    for(var i=0; i<items.length; i++){
        var range = items[i];
        if(range.type == "Range"){
            var label = getString(range.label);
            if(label && "hidden" != range.behavior){
                if(!$list){
                    $list = $("<ul class='range'></ul>").appendTo($element);
                }
                elementId = prefix + "_" + i;
                var $listItem = appendListItemLink($list, elementId, makeUrl(manifestId, range.id), getString(range.label))
                var $link = $listItem.children("a").first();
                $link.attr("data-range-id", manifestId + range.id);
                determineRangePlayInfo(range, manifestId);
                $link.on("mouseover", function(){                    
                    rangeId = $(this).attr("data-range-id");
                    if(rangeId){
                        $("#footer").html(rangeDetails[rangeId]);
                    }
                });
                children = range.items || range.members; // yes, in flux...
                if(children){
                    processItems(manifestId, children, $listItem, elementId);
                }     
            }
        }
    }
}

function appendListItemLink($element, liId, linkUrl, text){
    var html = '<li id="' + liId + '"><a href="' + linkUrl + '">' + text + '</a></li>';
    return $(html).appendTo($element);
}

function loadCollection(collectionURL, $list){
    var iiifIcon = "<img src='https://avatars1.githubusercontent.com/u/5812589?s=20&v=4' />";
    $.getJSON( collectionURL, function( collection ) {
        $.each( collection.items, function( index, manifest ) {
            var listItemId = 'li' + index;
            var $listItem = appendListItemLink($list, listItemId, makeUrl(manifest.id), getString(manifest.label))
            $listItem.prepend(" <a href='" + manifest.id + "?manifest=" + manifest.id + "'>" + iiifIcon + "</a> ")
            loadRanges(manifest.id, listItemId);
        });
    });
}
