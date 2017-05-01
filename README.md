# moscow_metro
> Scalable vector moscow metro map ([demo](https://philosophocat.github.io/moscow_metro/))

[![NPM version](https://badge.fury.io/js/moscow_metro.svg)](https://www.npmjs.com/package/moscow_metro)

## Usage

```javascript

    let container = document.body;
    let options = {
        selectable: false,  // default true
        check_icons: false, // default true
        zoom: {
            k: 1.5,         // default 1.25,
            min: -5,        // default -7
            max: 5          // default 7
        }
    };
    let map = new MoscowMetro(container, options);
    
    // middleware
    map.use((station, next) => {
        // do something
        next();
    });
    
    // zoom
    map.zoomIn();
    map.zoomOut();
    
    // selecting
    map.select(81);         // or [80, 81]
    map.deselect(81);       // or [80, 81] 
    map.getAll();
    map.getSelected();
    
    // destroy
    map.destroy();
```

## Contribute

Feel free to push your code if you agree with publishing under the MIT license

