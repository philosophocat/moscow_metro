'use strict';

import { addClass, hasClass, removeClass, closest, collectName, collectChecks, collectStations } from '../src/helpers'
import svg from '../src/data/svg'

test('helpers: addClass', () => {
    let span = document.createElement('span');
    addClass(span, 'test');
    expect( span.getAttribute('class') ).toBe('test');
});

test('helpers: hasClass', () => {
    let span = document.createElement('span');
    addClass(span, 'test');
    expect( hasClass(span, 'test') ).toBe(true);
});

test('helpers: removeClass', () => {
    let span = document.createElement('span');
    addClass(span, 'test');
    removeClass(span, 'test');
    expect( hasClass(span, 'test') ).toBe(false);
});

test('helpers: closest', () => {
    let div = document.createElement('div'),
        span = document.createElement('span');

    addClass(div, 'div');
    addClass(span, 'span');
    div.appendChild(span);

    expect(closest(span, 'div').isEqualNode(div)).toBe(true);
    expect(closest(span, 'span').isEqualNode(span)).toBe(true);
    expect(closest(span, '.div').isEqualNode(div)).toBe(true);
    expect(closest(div, '.div').isEqualNode(div)).toBe(true);
    expect(closest(div, 'div').isEqualNode(div)).toBe(true);
});

test('helpers: collectName', () => {
    let div = document.createElement('div');
    div.innerHTML = '<p>Let <span>the music</span> <i>play</i></p>';
    expect( collectName(div.firstChild) ).toBe('Let the music play');
});

test('helpers: collectChecks && collectStation', () => {
    let div = document.createElement('div');
    div.innerHTML = svg;
    let svgElement = div.getElementsByTagName('svg')[0],
        checks = collectChecks(svgElement),
        stations = collectStations(svgElement);
    expect( stations.length > 0 ).toBe(true);
    expect( Object.keys(stations[0]) ).toEqual(['element', 'id', 'name']);
    expect( checks.length > 0 ).toBe(true);
    expect( Object.keys(checks[0]) ).toEqual(['element', 'id']);
});
