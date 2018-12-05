const Stations = require('../stations.json').reverse();

const hasClass = (el, classname) => {
    let class_names = el.getAttribute('class') || '';
    return class_names.split(' ').indexOf(classname) >= 0;
};

const addClass = (el, classname) => {
    if (hasClass(el, classname)) return;
    let class_names = el.getAttribute('class') || '';
    el.setAttribute('class', (class_names + ' ' + classname).trim());
};

const removeClass = (el, classname) => {
    let class_names = el.getAttribute('class');
    el.setAttribute('class', class_names
        .split(' ')
        .filter(c => c !== classname)
        .join(' '));
};

const closestByClassName = (el, classname) => {
    if (hasClass(el, classname)) return el;
    if (document.body.isEqualNode(el)) return null;
    return closestByClassName(el.parentNode, classname);
};

const preventTextSelection = () => {
    // Chrome
    if (!!window.getSelection && !!window.getSelection().empty){
        return window.getSelection().empty();
    }
    // Firefox
    if (!!window.getSelection && !!window.getSelection().removeAllRanges){
        return window.getSelection().removeAllRanges();
    }
    // IE
    if (document.selection){
        document.selection.empty();
    }
};

const collectStations = (svg) => {
    return Array.from(svg.getElementsByClassName('moscow_metro_map__station'))
        .map(element => {
            let id = parseInt(element.getAttribute('data-id'), 10);
            let name = Stations.find(x => x.id === id).title;
            return {
                element,
                id,
                name,
            };
        });
};

const collectChecks = (svg) => Array
    .from(svg.getElementsByClassName('moscow_metro_map__check'))
    .map(element => {
        let id = parseInt(element.getAttribute('data-id'), 10);
        return { element, id };
    });

const throttle = (func, ms) => {
    let isThrottled = false;


    let savedArgs;


    let savedThis;

    function wrapper() {
        if (isThrottled) {
            savedArgs = arguments;
            savedThis = this;
            return;
        }
        func.apply(this, arguments);
        isThrottled = true;
        setTimeout(function() {
            isThrottled = false;
            if (savedArgs) {
                wrapper.apply(savedThis, savedArgs);
                savedArgs = savedThis = null;
            }
        }, ms);
    }
    return wrapper;
};

export default {
    hasClass,
    addClass,
    removeClass,
    closestByClassName,
    preventTextSelection,
    collectStations,
    collectChecks,
    throttle,
};

// export function collectStations(svg){
//

// }
//
// export function collectChecks(svg){
//     let items = svg.getElementsByClassName('moscow_metro_map__check'),
//         left = items.length,
//         checks = [];
//
//     while( left-- ){
//         checks.push({
//             element: items[left],
//             id: parseInt(items[left].getAttribute('data-id'))
//         });
//
//         if( left === 0 ){
//             return checks;
//         }
//     }
// }
