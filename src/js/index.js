import Schema from './schema';

(function(Map){
    // RequireJS
    if (typeof define === 'function' && define.amd){
        return define(Map);
    }

    // <script>
    if (typeof window !== 'undefined' || typeof self !== 'undefined'){
        var global = typeof window !== 'undefined' ? window : self;
        var previous = global.MoscowMetro;
        global.MoscowMetro = Map;
        global.MoscowMetro.noConflict = function() {
            global.MoscowMetro = previous;
            return this;
        };
        return;
    }

    // CommonJS
    if (typeof exports === 'object' && typeof module === 'object'){
        module.exports = Map;
        return;
    }

    throw new Error('This environment was not anticipated by Moscow Metro');
})(Schema);
