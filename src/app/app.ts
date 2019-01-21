import SVG from './map';

export interface Options {
    zoom: {
        k: number;
        max: number;
        min: number;
    };
    selectable: boolean;
    check_icons: boolean;
    parking: boolean;
    legend: boolean;
    river: boolean;
    middleware?: (station: object, next: () => void) => void;
}

interface Station {
    element: HTMLElement;
    id: number;
    name: string;
}

interface Check {
    element: HTMLElement;
    id: number;
}

interface State {
    zoom: number;
    moves: number;
    selected: number[];
    viewBox: number[];
    viewBoxDown: number[];
    mouseDown: {
        x: number;
        y: number;
    };
}

const defaultOptions: Options = {
    zoom: {
        k: 1.25,
        max: 8,
        min: -8,
    },
    selectable: true,
    check_icons: true,
    parking: true,
    legend: true,
    river: true,
};

const throttle = (fn: (...args: any[]) => void, wait: number) => {
    let isCalled = false;
    return (...args: any[]) => {
        if (!isCalled) {
            fn(...args);
            isCalled = true;
            setTimeout(() => {
                isCalled = false;
            }, wait);
        }
    };
};

const preventTextSelection = () => {
    if (window.getSelection && window.getSelection().empty) {
        return window.getSelection().empty();
    }

    if (window.getSelection && window.getSelection().removeAllRanges) {
        return window.getSelection().removeAllRanges();
    }

    if (document.selection) { document.selection.empty(); }
};

const hasClass = (el: HTMLElement, className: string): boolean =>
(el.getAttribute('class') || '').indexOf(className) >= 0;

const addClass = (el: HTMLElement, className: string): void => {
    if (hasClass(el, className)) { return; }
    const classNames = el.getAttribute('class') || '';
    el.setAttribute('class', (classNames + ' ' + className).trim());
};

const removeClass = (el: HTMLElement, className: string): void => {
    const classNames = el.getAttribute('class') || '';
    el.setAttribute('class', classNames
        .split(' ')
        .filter((c) => c !== className)
        .join(' '));
};

const closestByClassName = (el: HTMLElement, className: string): HTMLElement | null => {
    if (hasClass(el, className)) { return el; }
    if (document.body.isEqualNode(el)) { return null; }
    return closestByClassName(el.parentNode as HTMLElement, className);
};

export default class App {
    private options: Options;
    private container: HTMLElement;
    private schema: HTMLElement;
    private stations: Station[];
    private stationsById: { [key: number]: Station };
    private checks: Check[];
    private state: State;

    public constructor(container: HTMLElement, options: Options = defaultOptions) {
        if (typeof (container) !== 'object' || !container.tagName) {
            throw new Error('Moscow Metro: map container not provided');
        }

        if (typeof (options) !== 'object') {
            throw new Error('Moscow Metro: wrong options format provided');
        }

        this.options = Object.assign({}, defaultOptions, options);
        this.container = container;
        this.container.innerHTML = this.getSVG();
        this.schema = this.container.firstChild as HTMLElement;
        this.schema.setAttribute('width', '100%');
        this.schema.setAttribute('height', '100%');
        this.stations = this.getStations();
        this.stationsById = this.stations.reduce((o, i) => Object.assign(o, { [i.id]: i }), {});
        this.checks = this.getChecks();
        this.state = {
            selected: [],
            zoom: 0,
            moves: 0,
            viewBox: this.viewBox(),
            viewBoxDown: [],
            mouseDown: {
                x: 0,
                y: 0,
            },
        };
        this.schema.addEventListener('mousedown', this.mouseDown, false);
        this.schema.addEventListener('wheel', this.wheel, false);
        setTimeout(this.enable, 0);
    }

    public destroy = () => this.container.innerHTML = '';

    public use = (fn: () => void) => {
        if (typeof fn === 'function') {
            this.options.middleware = fn;
        }
    }

    public zoomIn = () => {
        const { zoom = 0 } = this.state;
        const { k, max } = this.options.zoom;
        if (zoom + 1 < max ) {
            const currentViewBox = this.viewBox();
            this.state.zoom = zoom + 1;
            const viewBox = [];
            viewBox[2] = currentViewBox[2] / k;
            viewBox[3] = currentViewBox[3] / k;
            viewBox[0] = currentViewBox[0] + (currentViewBox[2] - viewBox[2]) / 2;
            viewBox[1] = currentViewBox[1] + (currentViewBox[3] - viewBox[3]) / 2;
            this.viewBox(viewBox);
        }
    }

    public zoomOut = () => {
        const { zoom = 0 } = this.state;
        const { k, min } = this.options.zoom;
        if (zoom - 1 > min ) {
            const currentViewBox = this.viewBox();
            this.state.zoom = zoom - 1;
            const viewBox = [];
            viewBox[2] = currentViewBox[2] * k;
            viewBox[3] = currentViewBox[3] * k;
            viewBox[0] = currentViewBox[0] + (currentViewBox[2] - viewBox[2]) / 2;
            viewBox[1] = currentViewBox[1] + (currentViewBox[3] - viewBox[3]) / 2;
            this.viewBox(viewBox);
        }
    }

    public select = (ids: number | number[]) => {
        if (typeof ids === 'number') { return this.selectOne(ids); }
        if (Array.isArray(ids)) {
            for (const id of ids) {
                this.selectOne(id);
            }
        }
    }

    public deselect = (ids: number | number[]) => {
        if (typeof ids === 'number') { return this.deselectOne(ids); }
        if (Array.isArray(ids)) {
            for (const id of ids) {
                this.deselectOne(id);
            }
        }
    }

    public getSelected = () => this.stations
        .filter((station) => this.state.selected.includes(station.id))
        .map((station) => ({
            id: station.id,
            name: station.name,
        }))

    public getAll = () => this.stations
        .map((station) => ({
            id: station.id,
            name: station.name,
        }))

    public deselectOne = (id: number) => {
        if (this.state.selected.includes(id)) {
            const { check_icons } = this.options;
            for (const station of this.stations) {
                if (station.id === id) {
                    this.state.selected = this.state.selected.filter((selectedId) => selectedId !== id);
                    removeClass(station.element, 'selected');
                    break;
                }
            }
            if (check_icons) {
                for (const checkIcon of this.checks) {
                    if (checkIcon.id === id) {
                        removeClass(checkIcon.element, 'selected');
                    }
                }
            }
        }
    }

    private enable = () => {
        const { river, legend } = this.options;
        const classNamesToHide: number[] = [];
        if (!legend) {
            for (let i = 0; i < 21; i++) {
                if (i !== 18) { classNamesToHide.push(i); }
            }
            this.state.viewBox[3] = 1500;
            this.viewBox(this.state.viewBox);
        }
        if (!river) {
            for (let i = 21; i < 58; i++) {
                classNamesToHide.push(i);
            }
        }
        if (classNamesToHide.length) {
            for (const i of classNamesToHide) {
                Array
                    .from(this.schema.getElementsByClassName(`st${i}`) as HTMLCollectionOf<HTMLElement>)
                    .map((item: HTMLElement) => {
                        item.style.display = 'none';
                    });
            }
        }
        addClass(this.schema, 'ready');
        this.fixSubstrates();
    }

    private mouseDown = (e: MouseEvent) => {
        preventTextSelection();
        const station = closestByClassName(e.target as HTMLElement, 'moscow_metro_map__station');
        if (station) { return this.stationClick(station); }

        this.state.moves = 0;
        this.state.mouseDown = {
            x: e.pageX,
            y: e.pageY,
        };
        this.state.viewBoxDown = this.viewBox();
        document.addEventListener('mouseup', this.mouseUp, false);
        document.addEventListener('mousemove', this.mouseMove, false);
        addClass(this.schema, 'drag');
    }

    private mouseUp = (e: MouseEvent) => {
        preventTextSelection();
        document.removeEventListener('mouseup', this.mouseUp, false);
        document.removeEventListener('mousemove', this.mouseMove, false);
        removeClass(this.schema, 'drag');
    }

    private mouseMove = (e: MouseEvent) => {
        preventTextSelection();
        const { moves, mouseDown, viewBoxDown } = this.state;
        if (moves > 3 && moves % 2 === 0) {
            const diff = {
                x: e.pageX - mouseDown.x,
                y: e.pageY - mouseDown.y,
            };
            const viewBox = this.viewBox();
            const k = viewBox[3] / this.container.offsetHeight;
            viewBox[0] = viewBoxDown[0] - diff.x * k;
            viewBox[1] = viewBoxDown[1] - diff.y * k;
            this.viewBox(viewBox);
        }
        this.state.moves++;
    }

    private stationClick = (station: HTMLElement) => {
        const id = parseInt(station.getAttribute('data-id') || '0', 10);
        const { name } = this.stationsById[id];
        const { middleware } = this.options;
        const select = !this.state.selected.includes(id);
        if (typeof middleware === 'function') {
            return middleware({ id, name, select }, () => this.toggle(id));
        }
        this.toggle(id);
        setTimeout(preventTextSelection, 0);
    }

    private toggle = (id: number) => {
        if (this.state.selected.includes(id)) {
            this.deselectOne(id);
        } else {
            this.selectOne(id);
        }
    }

    private selectOne = (id: number) => {
        const { selectable, check_icons } = this.options;
        if (selectable && !this.state.selected.includes(id)) {
            for (const station of this.stations) {
                if (station.id === id) {
                    this.state.selected.push(id);
                    addClass(station.element, 'selected');
                    break;
                }
            }
            if (check_icons) {
                for (const checkIcon of this.checks) {
                    if (checkIcon.id === id) {
                        addClass(checkIcon.element, 'selected');
                    }
                }
            }
        }
    }

    private wheel = (e: MouseWheelEvent) => {
        e.preventDefault();
        e.deltaY > 0 ?
            this.tZoomOut() :
            this.tZoomIn();
    }

    private getSVG = () => this.options.parking ? SVG : SVG.replace(/<path id="park-and-ride-(.*?)\/>/gi, '');

    private viewBox = (viewBox?: number[]): number[] => {
        if (viewBox) { this.schema.setAttribute('viewBox', viewBox.join(' ')); }
        return (this.schema.getAttribute('viewBox') || '0 0 0 0')
            .split(' ')
            .map((i: string) => parseInt(i, 10));
    }

    private fixSubstrates = () => {
        for (const station of this.stations) {
            const { element } = station;
            const texts = element.getElementsByTagName('text') as HTMLCollectionOf<SVGTextElement>;
            const text: any = texts[0];
            const substrate = element.getElementsByClassName('moscow_metro_map__substrate')[0] as HTMLElement;
            const area = element.getElementsByClassName('moscow_metro_map__area')[0] as HTMLElement;
            const bounds = text.getBBox();
            const width = Math.ceil(bounds.width);
            const height = Math.ceil(bounds.height);
            substrate.setAttribute('width', width.toString());
            substrate.setAttribute('height', height.toString());
            area.setAttribute('width', width.toString());
            area.setAttribute('height', (height + 10).toString());
        }
    }

    private getStations = () => Array
        .from(this.schema.getElementsByClassName('moscow_metro_map__station') as HTMLCollectionOf<HTMLElement>)
        .map((element: HTMLElement) => ({
            element,
            id: parseInt(element.getAttribute('data-id') || '0', 10),
            name: (element.innerText || element.textContent || '')
                .split(' ')
                .filter((chunk: string) => chunk.length > 0)
                .join(' '),
        }))

    private getChecks = () => Array
        .from(this.schema.getElementsByClassName('moscow_metro_map__check') as HTMLCollectionOf<HTMLElement>)
        .map((element: HTMLElement) => ({
            element,
            id: parseInt(element.getAttribute('data-id') || '0', 10),
        }))

    private tZoomIn = throttle(this.zoomIn, 100);
    private tZoomOut = throttle(this.zoomOut, 100);
}
