import helpers from './helpers';

class Engine {

    constructor(svg, options){

        this.viewBox = this.viewBox.bind(this);
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
        this.wheel = this.wheel.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.zoomInThrottled = helpers.throttle(this.zoomIn, 150);
        this.zoomOutThrottled = helpers.throttle(this.zoomOut, 150);
        this.toggle = this.toggle.bind(this);
        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.stationClick = this.stationClick.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getSelected = this.getSelected.bind(this);
        this.fixSubstrates = this.fixSubstrates.bind(this);

        this.svg = svg;
        this.options = options;
        this.stations = helpers.collectStations(this.svg);
        this.checks = helpers.collectChecks(this.svg);
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
            mouse_down: {},
        };

        this.svg.addEventListener('mousedown', this.mouseDown, false);
        this.svg.addEventListener('wheel', this.wheel, false);
        setTimeout(() => {
            helpers.addClass(this.svg, 'ready');
            this.fixSubstrates();
        }, 0);
    }

    mouseUp(e){
        helpers.preventTextSelection();
        window.removeEventListener('mouseup', this.mouseUp, false);
        this.svg.removeEventListener('mousemove', this.mouseMove, false);
        helpers.removeClass(this.svg, 'drag');
    }

    stationClick(station){
        let id = parseInt(station.getAttribute('data-id'), 10);
        let { name } = this.stations_by_id[id];
        let select = this.state.selected.indexOf(id) < 0;
        if (typeof (this.options.middleware) === 'function'){
            return this.options.middleware({ id, name, select }, () => this.toggle(id));
        }
        this.toggle(id);
    }

    mouseDown(e){
        helpers.preventTextSelection();
        let station = helpers.closestByClassName(e.target, 'moscow_metro_map__station');
        if (station) return this.stationClick(station);

        let viewBox = this.viewBox();
        this.state.moves = 0;
        this.state.mouse_down = {
            x: e.pageX,
            y: e.pageY,
        };
        this.state.viewbox_mouse_down = {
            x: viewBox[0],
            y: viewBox[1],
        };
        window.addEventListener('mouseup', this.mouseUp, false);
        this.svg.addEventListener('mousemove', this.mouseMove, false);
        helpers.addClass(this.svg, 'drag');
    }

    mouseMove(e){
        helpers.preventTextSelection();
        if (this.state.moves > 3 && this.state.moves % 2 === 0){
            let diff = {
                x: e.pageX - this.state.mouse_down.x,
                y: e.pageY - this.state.mouse_down.y,
            };
            let viewBox = this.viewBox();
            let k = viewBox[3] / this.svg.parentNode.offsetHeight;
            viewBox[0] = this.state.viewbox_mouse_down.x - diff.x * k;
            viewBox[1] = this.state.viewbox_mouse_down.y - diff.y * k;
            this.viewBox(viewBox);
        }
        this.state.moves++;
    }

    zoomIn(){
        if (this.state.zoom + 1 > this.options.zoom.max) return;
        let viewBox = this.viewBox();
        let _viewBox = [];
        this.state.zoom += 1;
        _viewBox[2] = viewBox[2] / this.options.zoom.k;
        _viewBox[3] = viewBox[3] / this.options.zoom.k;
        _viewBox[0] = viewBox[0] + (viewBox[2] - _viewBox[2]) / 2;
        _viewBox[1] = viewBox[1] + (viewBox[3] - _viewBox[3]) / 2;
        this.viewBox(_viewBox);
    }

    zoomOut(){
        if (this.state.zoom - 1 < this.options.zoom.min) return;
        let viewBox = this.viewBox();
        let _viewBox = [];
        this.state.zoom -= 1;
        _viewBox[2] = viewBox[2] * this.options.zoom.k;
        _viewBox[3] = viewBox[3] * this.options.zoom.k;
        _viewBox[0] = viewBox[0] + (viewBox[2] - _viewBox[2]) / 2;
        _viewBox[1] = viewBox[1] + (viewBox[3] - _viewBox[3]) / 2;
        this.viewBox(_viewBox);
    }

    wheel(e){
        if (Boolean(e.deltaY) && !isNaN(e.deltaY)){
            e.preventDefault();
            e.deltaY > 0 ?
                this.zoomOutThrottled() :
                this.zoomInThrottled();
        }
    }

    toggle(id){
        this.state.selected.indexOf(id) >= 0 ?
            this.deselect(id) :
            this.select(id);
    }

    select(id){
        if (!!id && this.options.selectable && this.state.selected.indexOf(id) < 0){
            id = parseInt(id, 10);
            for (let i = 0; i < this.stations.length; i++){
                if (parseInt(this.stations[i].id, 10) === id){
                    this.state.selected.push(id);
                    helpers.addClass(this.stations[i].element, 'selected');
                    break;
                }
            }
            if (!this.options.check_icons) return;
            for (let i = 0; i < this.checks.length; i++){
                if (parseInt(this.checks[i].id, 10) === id){
                    helpers.addClass(this.checks[i].element, 'selected');
                }
            }
        }
    }

    deselect(id){
        if (this.state.selected.indexOf(id) >= 0){
            for (let i = 0; i < this.stations.length; i++){
                if (parseInt(this.stations[i].id, 10) === id){
                    this.state.selected = this.state.selected.filter(_id => _id !== id);
                    helpers.removeClass(this.stations[i].element, 'selected');
                    break;
                }
            }
            if (!this.options.check_icons) return;
            for (let i = 0; i < this.checks.length; i++) {
                if (parseInt(this.checks[i].id, 10) === id) {
                    helpers.removeClass(this.checks[i].element, 'selected');
                }
            }
        }
    }

    getAll(){
        return this.stations.map(station => {
            let { id, name } = station;
            return { id, name };
        });
    }

    fixSubstrates(){
        this.stations.map(station => {
            let el = station.element;
            let text = el.getElementsByTagName('text')[0];
            let substrate = el.getElementsByClassName('moscow_metro_map__substrate')[0];
            let area = el.getElementsByClassName('moscow_metro_map__area')[0];
            let bounds = text.getBBox();
            let width = Math.ceil(bounds.width);
            let height = Math.ceil(bounds.height);
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
        if (viewBox){
            viewBox = viewBox.map(i => parseInt(i, 10));
            this.svg.setAttribute('viewBox', viewBox.join(' '));
            return viewBox;
        }
        return this.svg.getAttribute('viewBox')
            .split(' ')
            .map(i => parseInt(i, 10));
    }

}

export default Engine;
