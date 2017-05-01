'use strict';

export function hasClass(el, name){
    if( el.tagName ){
        let class_names = el.getAttribute('class') || '';
        return class_names.split(' ').indexOf(name) >= 0;
    }
    else{
        return false;
    }
}

export function addClass(el, name){
    let class_names = el.getAttribute('class') || '';
    el.setAttribute('class', (class_names + ' ' + name).trim());
    return el;
}

export function removeClass(el, name){
    let class_names = el.getAttribute('class');
    el.setAttribute('class', class_names
        .split(' ')
        .filter(c => c !== name)
        .join(' '));
    return el;
}

export function closest(el, selector){
    let matchesFn,
        parent;

    ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn){
        if (typeof document.body[fn] === 'function') {
            matchesFn = fn;
            return true;
        }
        return false;
    });

    if( el && el[matchesFn](selector) ){
        return el;
    }

    while (el) {
        parent = el.parentElement;
        if (parent && parent[matchesFn](selector)) {
            return parent;
        }
        el = parent;
    }
    return null;
}

export function collectName(station){
    let name = station.innerText || station.textContent;
    return name.split(' ').filter(chunk => chunk.length > 0).join(' ');
}

export function collectStations(svg){

    let items = svg.getElementsByClassName('moscow_metro_map__station'),
        left = items.length,
        stations = [];

    while( left-- ){

        let element = items[left],
            id = parseInt(element.getAttribute('data-id')),
            name = collectName(element);

        stations.push({element, id, name });

        if( left === 0 ){
            return stations;
        }
    }
}

export function collectChecks(svg){
    let items = svg.getElementsByClassName('moscow_metro_map__check'),
        left = items.length,
        checks = [];
    
    while( left-- ){
        checks.push({
            element: items[left],
            id: parseInt(items[left].getAttribute('data-id'))
        });
        
        if( left === 0 ){
            return checks;
        }
    }
}

export function preventTextSelection(){
    if(window.getSelection){
        // Chrome
        if(window.getSelection().empty){
            window.getSelection().empty();
        }
        // Firefox
        else if(window.getSelection().removeAllRanges){
            window.getSelection().removeAllRanges();
        }
        return;
    }
    // IE
    if(document.selection){
        document.selection.empty();
    }
}



