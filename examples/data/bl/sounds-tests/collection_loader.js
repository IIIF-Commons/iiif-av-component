function makeUrl(manifestId, rangeId){
    var s = "http://universalviewer.io/examples/template.html#?manifest=" + manifestId;
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