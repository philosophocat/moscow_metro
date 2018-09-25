import Engine from './engine';
import svg from './map';

class Schema {

    constructor(container, options = {}){

        if (typeof (container) !== 'object' || !container.tagName){
            throw new Error('Moscow Metro: map container not provided');
        }

        if (typeof (options) !== 'object'){
            throw new Error('Moscow Metro: wrong options format provided');
        }

        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.select = this.select.bind(this);
        this.deselect = this.deselect.bind(this);
        this.destroy = this.destroy.bind(this);

        this.container = container;
        this.options = {
            middleware: null,
            zoom: {
                k: !!options.zoom && !!options.zoom.k ? parseFloat(options.zoom.k) : 1.25,
                min: !!options.zoom && !!options.zoom.min ? parseInt(options.zoom.min, 10) : -7,
                max: !!options.zoom && !!options.zoom.max ? parseInt(options.zoom.max, 10) : 7,
            },
            selectable: !!options.selectable,
            check_icons: !!options.check_icons,
        };

        this.container.innerHTML = svg;
        this.schema = this.container.firstChild;
        this.schema.setAttribute('width', '100%');
        this.schema.setAttribute('height', '100%');
        this.engine = new Engine(this.schema, this.options);
    }

    destroy(){
        this.container.innerHTML = '';
    }

    zoomIn(){
        this.engine.zoomIn();
    }

    zoomOut(){
        this.engine.zoomOut();
    }

    use(fn){
        if (typeof (fn) === 'function'){
            this.options.middleware = fn;
        }
    }

    select(ids){
        if (typeof (ids) === 'number' || typeof (ids) === 'string'){
            return this.engine.select(ids);
        }

        if (ids instanceof Array){
            ids.forEach(this.engine.select);
        }
    }

    deselect(ids){
        if (typeof (ids) === 'number' || typeof (ids) === 'string'){
            return this.engine.deselect(ids);
        }

        if (ids instanceof Array){
            ids.forEach(id => {
                this.engine.deselect(id);
            });
        }
    }

    getSelected(){
        return this.engine.getSelected();
    }

    getAll(){
        return this.engine.getAll();
    }

}

export default Schema;
