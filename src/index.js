'use strict';

import Schema from '../src/schema'

(function(Map){
    // RequireJS
    if( typeof define === "function" && define.amd ){
        define(Map);
        return;
    }

    // <script>
    if( typeof window !== "undefined" || typeof self !== "undefined" ){
        var global = typeof window !== "undefined" ? window : self,
            previous = global.MoscowMetro;
        global.MoscowMetro = Map;
        global.MoscowMetro.noConflict = function () {
            global.MoscowMetro = previous;
            return this;
        };
    }

    // CommonJS
    if( typeof exports === "object" && typeof module === "object" ){
        module.exports = Map;
        return;
    }

    throw new Error("This environment was not anticipated by Moscow Metro");
})(Schema);