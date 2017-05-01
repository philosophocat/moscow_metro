'use strict';

import { 
    addClass,
    removeClass, 
    closest,
    preventTextSelection,
    collectStations,
    collectChecks } from './helpers'

class Engine {
    
    constructor(svg, options){
        
        this.viewBox = this.viewBox.bind(this);
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.wheel = this.wheel.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.toggle = this.toggle.bind(this);
        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.stationClick = this.stationClick.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getSelected = this.getSelected.bind(this);
        this.fixSubstrates = this.fixSubstrates.bind(this);

        this.svg = svg;
        this.options = options;
        this.stations = collectStations(this.svg);
        this.checks = collectChecks(this.svg);
        this.stations_by_id = this.stations.reduce((list, station) => {
            list[ station.id ] = station;
            return list;
        }, {});

        this.state = {
            selected: [],
            zoom: 0,
            moves: 0,
            _viewbox: this.viewBox(),
            viewbox_mouse_down: {},
            mouse_down: {}
        };

        this.svg.addEventListener('mousedown', this.mouseDown, false);
        this.svg.addEventListener('wheel', this.wheel, false);
        setTimeout(()=> {
            addClass(this.svg, 'ready');
            this.fixSubstrates();
        }, 0);
    }

    mouseUp(e){
        preventTextSelection();
        window.removeEventListener('mouseup', this.mouseUp, false);
        this.svg.removeEventListener('mousemove', this.mouseMove, false);
        removeClass(this.svg, 'drag');
    }
    
    stationClick(station){
        let id = station.getAttribute('data-id'),
            { name } = this.stations_by_id[id],
            select = !(this.state.selected.indexOf(id) >= 0);

        if( typeof(this.options.middleware) === 'function' ){
            this.options.middleware({ id, name, select }, () => {
                this.toggle(id);
            });
            return;
        }

        this.toggle(id);
    }

    mouseDown(e){
        preventTextSelection();
        let station = closest(e.target, '.moscow_metro_map__station');
        if( Boolean(station) ){
            this.stationClick(station);
            return;
        }

        let viewBox = this.viewBox();
        this.state.moves = 0;
        this.state.mouse_down = {
            x: e.pageX,
            y: e.pageY
        };
        this.state.viewbox_mouse_down = {
            x: viewBox[0],
            y: viewBox[1]
        };

        window.addEventListener('mouseup', this.mouseUp, false);
        this.svg.addEventListener('mousemove', this.mouseMove, false);
        addClass(this.svg, 'drag');
    }

    mouseMove(e){
        preventTextSelection();
        if( this.state.moves > 3 && this.state.moves % 2 == 0  ){
            let diff = {
                    x: e.pageX - this.state.mouse_down.x,
                    y: e.pageY - this.state.mouse_down.y
                },
                viewBox = this.viewBox(),
                k = viewBox[3] / this.svg.parentNode.offsetHeight;
            viewBox[0] = this.state.viewbox_mouse_down.x - diff.x * k;
            viewBox[1] = this.state.viewbox_mouse_down.y - diff.y * k;
            this.viewBox(viewBox);
        }
        this.state.moves++;
    }

    zoomIn(){
        if( this.state.zoom + 1 > this.options.zoom.max ){
            return;
        }

        let viewBox = this.viewBox(),
            _viewBox = [];
        this.state.zoom += 1;
        _viewBox[2] = viewBox[2] / this.options.zoom.k;
        _viewBox[3] = viewBox[3] / this.options.zoom.k;
        _viewBox[0] = viewBox[0] + ( viewBox[2] - _viewBox[2] ) / 2;
        _viewBox[1] = viewBox[1] + ( viewBox[3] - _viewBox[3] ) / 2;
        this.viewBox(_viewBox);
    }

    zoomOut(){
        if( this.state.zoom - 1 < this.options.zoom.min ){
            return;
        }

        let viewBox = this.viewBox(),
            _viewBox = [];
        this.state.zoom -= 1;
        _viewBox[2] = viewBox[2] * this.options.zoom.k;
        _viewBox[3] = viewBox[3] * this.options.zoom.k;
        _viewBox[0] = viewBox[0] + ( viewBox[2] - _viewBox[2] ) / 2;
        _viewBox[1] = viewBox[1] + ( viewBox[3] - _viewBox[3] ) / 2;
        this.viewBox(_viewBox);
    }
    
    wheel(e){
        if( Boolean( e.deltaY ) && !isNaN(e.deltaY) ){
            e.preventDefault();
            e.deltaY > 0 ?
                this.zoomOut() :
                this.zoomIn();
        }
    }

    toggle(id){
        this.state.selected.indexOf(id) >= 0 ?
            this.deselect(id) :
            this.select(id);
    }

    select(id){
        if( this.options.selectable && this.state.selected.indexOf(id) < 0 && Boolean(id) && !isNaN(id) ){
            let s = this.stations.length,
                c = this.checks.length;
            while(s--){
                if( this.stations[s].id == id ){
                    this.state.selected.push(id);
                    addClass(this.stations[s].element, 'selected');
                }
            }
            if( this.options.check_icons ){
                while(c--){
                    if( this.checks[c].id == id ){
                        addClass(this.checks[c].element, 'selected');
                    }
                }
            }
        }
    }

    deselect(id){
        let index = this.state.selected.indexOf(id);
        if( this.options.selectable && index >= 0 ){
            let s = this.stations.length,
                c = this.checks.length;
            while(s--){
                if( this.stations[s].id == id ){
                    this.state.selected = this.state.selected.filter(_id => _id != id);
                    removeClass(this.stations[s].element, 'selected');
                }
            }
            if( this.options.check_icons ){
                while(c--){
                    if( this.checks[c].id == id ){
                        removeClass(this.checks[c].element, 'selected');
                    }
                }
            }
        }
    }

    getAll(){
        return this.stations.map(station => {
            let { id, name } = station;
            return { id, name };
        })
    }

    fixSubstrates(){
        this.stations.map(station => {
            let text = station.element.getElementsByTagName('text')[0],
                substrate = station.element.getElementsByClassName('moscow_metro_map__substrate')[0],
                area = station.element.getElementsByClassName('moscow_metro_map__area')[0],
                bounds = text.getBBox(),
                width = Math.ceil(bounds.width),
                height = Math.ceil(bounds.height);

            substrate.setAttribute('width', width.toString());
            substrate.setAttribute('height', height.toString());
            area.setAttribute('width', width.toString());
            area.setAttribute('height', (height + 10).toString());
        });
    }

    getSelected(){
        return this.stations
            .filter(station => this.state.selected.indexOf(station.id.toString()) >= 0)
            .map(station => {
                let { id, name } = station;
                return { id, name };
            });
    }

    viewBox(viewBox){
        if(Boolean(viewBox)){
            viewBox = viewBox.map(i => parseInt(i));
            this.svg.setAttribute('viewBox', viewBox.join(' '));
            return viewBox;
        }
        return this.svg.getAttribute('viewBox')
            .split(' ')
            .map(i => parseInt(i));
    }

}

export default Engine;