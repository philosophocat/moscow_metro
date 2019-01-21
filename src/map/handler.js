const fs = require('fs');
const path = require('path');
const Stations = require('./stations.json');

const CSS = {};
CSS.BASE = 'moscow_metro_map';
CSS.SUBSTRATE = CSS.BASE + '__substrate';
CSS.AREA = CSS.BASE + '__area';
CSS.CHECK = CSS.BASE + '__check';

const Station = {
    substrateCoordinates: station => {
        const { x, y } = station;
        let dx = 0;
        let dy = 0;
        if (station.monorail) dy = 4;
        if (station.title_chunks){
            for (const chunk of station.title_chunks) {
                if (chunk.x < dx) dx = chunk.x;
            }
        }
        return [x + dx, y + dy];
    },
    substrate: (x, y) => {
        let markup = '<rect ';
        markup += `transform="translate(${x} ${y - 10})" `;
        markup += 'width="1" height="1" ';
        markup += `class="${CSS.SUBSTRATE}">`;
        markup += '</rect>';
        return markup;
    },
    area: (x, y) => {
        let markup = '<rect ';
        markup += `transform="translate(${x} ${y - 5})" `;
        markup += 'width="1" height="1" ';
        markup += `class="${CSS.AREA}">`;
        markup += '</rect>';
        return markup;
    },
    title: (s, x, y) => {
        let markup = '<text ';
        if (s.monorail) markup += 'font-size="6" ';
        markup += `transform="translate(${x} ${y})">`;
        if (s.title_chunks){
            const title = s.title.split(' ');
            for (let i = 0; i < s.title_chunks.length; i++){
                const chunk = s.title_chunks[i];
                let text = title.shift();
                if (text.length <= 3) text += ` ${title.shift()}`;
                if (i === s.title_chunks.length - 1 && !!title.length){
                    text += ` ${title.join(' ')}`;
                }
                markup += `<tspan x="${chunk.x}" y="${chunk.y}">${text}</tspan>`;
            }
        } else {
            markup += s.title;
        }
        markup += '</text>';
        return markup;
    }
};

const stations = () => {
    const markup = [];
    for (const station of Stations) {
        const { x, y } = station;
        let svg = `<g class="moscow_metro_map__station" data-id="${station.id}">`;
        svg += Station.substrate(...Station.substrateCoordinates(station));
        svg += Station.area(x, y);
        svg += Station.title(station, x, y);
        svg += '</g>';

        for (let k = 0; k < station.checks.length; k++){
            const check = station.checks[k];
            svg += `<g class="${CSS.CHECK}" `;
            svg += `transform="translate(${check.x} ${check.y}), `;
            svg += `scale(${check.scale}, ${check.scale})" `;
            svg += `data-id="${station.id}">`;
            svg += '<polygon fill="#FFFFFF" ';
            svg += 'points="8.1,15.1 16.2,7 14.7,5.5 8.1,12.1 5.2,9.2 3.7,10.7"/>';
            svg += '<path fill="#6AC259" d="M10,0C4.5,0,0,4.5,0,10s4.5,10,10,10s10-4.5,10-10S15.5,0';
            svg += ',10,0z M8.1,12.1l6.6-6.6L16.2,7l-8.1,8.1l-4.4-4.4l1.5-1.5L8.1,12.1z"/>';
            svg += '</g>';
        }
        markup.push(svg);
    }
    return markup.join('');
};

const handle = svg => 'export default \'' + svg
    .replace('<?xml version="1.0" encoding="utf-8"?>', '')
    .replace(/\t/g, '')
    .replace(/ +/g, ' ')
    .replace('id="Layer_1"', `class="${CSS.BASE}"`)
    .replace(/<!--\s*(.*?)\s*-->/gi, '')
    .replace(/font-family(.*?);/gi, '')
    .replace(/<rect id="white-base-(.*?)\/>/gi, '')
    .replace(/<polygon id="white-base-(.*?)\/>/gi, '')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace('</svg>', stations())
    .trim() + '</svg>\';';

const svgToModule = (() => {
    const src = path.resolve(__dirname, 'map.svg');
    const dest = path.resolve(__dirname, '../app/map.ts');
    const svg = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, handle(svg));
})();
