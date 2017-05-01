'use strict';

import Engine from './engine'
import svg from './data/svg'

class Schema {
    
    constructor(container, options = {}){

        if( typeof(container) !== 'object' || !Boolean(container.tagName) ){
            throw new Error('Moscow Metro: map container not provided');
        }

        if( typeof(options) !== 'object' ){
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
                k: Boolean(options.zoom) && Boolean(options.zoom.k) ? parseFloat(options.zoom.k) : 1.25,
                min: Boolean(options.zoom) && options.zoom.min !== null && !isNaN(options.zoom.min) ? parseInt(options.zoom.min) : -7,
                max: Boolean(options.zoom) && options.zoom.max !== null && !isNaN(options.zoom.max) ? parseInt(options.zoom.max) : 7
            },
            selectable: typeof(options.selectable) === 'undefined' ? true : Boolean(options.selectable),
            check_icons: typeof(options.check_icons) === 'undefined' ? true : Boolean(options.check_icons)
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
        if( typeof(fn) === 'function' ){
            this.options.middleware = fn;
        }
    }

    select(ids){
        if( typeof(ids) === 'number' || typeof(ids) === 'string' ){
            this.engine.select(ids);
            return;
        }

        if( ids instanceof Array){
            ids.forEach(this.engine.select);
        }
    }

    deselect(ids){
        if( typeof(ids) === 'number' || typeof(ids) === 'string' ){
            this.engine.deselect(ids);
            return;
        }

        if( ids instanceof Array ){
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