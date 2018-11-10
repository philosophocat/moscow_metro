const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const webpack_stream = require('webpack-stream');
const Stations = require('./src/stations.json').reverse();
const is_production = process.env.NODE_ENV === 'production';

gulp.task('js', done => gulp.src('./src/js/index.js')
    .pipe(webpack_stream({
        watch: !is_production,
        mode: is_production ? 'production' : 'development',
        entry: './src/js/index.js',
        output: {
            path: path.resolve(__dirname, 'build'),
            publicPath: '/',
            filename: 'moscow_metro.js',
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                    },
                },
            ],
        },
    }))
    .pipe(gulp.dest('build')), error => { throw error; });

const titleMarkup = (s, x, y) => {
    let markup = '<text ';
    if (s.monorail){
        markup += 'font-size="6" ';
    }
    markup += `transform="translate(${x} ${y})">`;
    if (!!s.title_chunks){
        let title = s.title.split(' ');
        for (let i = 0; i < s.title_chunks.length; i++){
            let chunk = s.title_chunks[i];
            let text = title.shift();
            if (text.length <= 3){
                text += ' ' + title.shift();
            }
            if (i === s.title_chunks.length - 1 && !!title.length){
                text += ' ' + title.join(' ');
            }
            markup += `<tspan x="${chunk.x}" y="${chunk.y}">${text}</tspan>`;
        }
    } else {
        markup += s.title;
    }
    markup += '</text>';
    return markup;
};

const areaMarkup = (x, y) => {
    let markup = '<rect ';
    markup += `transform="translate(${x} ${y - 5})" `;
    markup += 'width="1" height="1" ';
    markup += 'class="moscow_metro_map__area">';
    markup += '</rect>';
    return markup;
};

const substrateMarkup = (x, y) => {
    let markup = '<rect ';
    markup += `transform="translate(${x} ${y - 10})" `;
    markup += 'width="1" height="1" ';
    markup += 'class="moscow_metro_map__substrate">';
    markup += '</rect>';
    return markup;
};

const substrateCoords = station => {
    let { x, y } = station;
    let dx = 0;
    let dy = 0;
    if( station.monorail ){
        dy = 4;
    }
    if(!!station.title_chunks){
        for (let i = 0; i < station.title_chunks.length; i++){
            if( station.title_chunks[i].x < dx){
                dx = station.title_chunks[i].x;
            }
        }
    }
    return [x + dx, y + dy];
};

const stationMarkup = (markup = '', station) => {
    let { x, y } = station;
    markup += `<g class="moscow_metro_map__station" data-id="${station.id}">`;
    markup += substrateMarkup(...substrateCoords(station));
    markup += areaMarkup(x, y);
    markup += titleMarkup(station, x, y);
    markup += '</g>';

    for (let k = 0; k < station.checks.length; k++){
        let check = station.checks[k];
        markup += '<g class="moscow_metro_map__check" ';
        markup += `transform="translate(${check.x} ${check.y}), `;
        markup += `scale(${check.scale}, ${check.scale})" `;
        markup += `data-id="${station.id}">`;
        markup += '<polygon fill="#FFFFFF" points="8.1,15.1 16.2,7 14.7,5.5 8.1,12.1 5.2,9.2 3.7,10.7"/>';
        markup += '<path fill="#6AC259" d="M10,0C4.5,0,0,4.5,0,10s4.5,10,10,10s10-4.5,10-10S15.5,0,10,0z ';
        markup += 'M8.1,12.1l6.6-6.6L16.2,7l-8.1,8.1l-4.4-4.4l1.5-1.5L8.1,12.1z"/>';
        markup += '</g>';
    }

    return markup;
};

/*
 * We're using the map from the official site http://mosmetro.ru/metro-map/,
 * cleaning station names substrates, parking signs
 * and adding stations from json file
 */

gulp.task('map', done => {
    let svg = fs.readFileSync('src/map.svg', 'utf8');
    svg = 'export default \'' + svg
        .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
        .replace('id="Layer_1"', 'class="moscow_metro_map"')
        .replace(/font-family(.*?);/gi, '')
        .replace(/<rect id="white-base-(.*?)\/>/gi, '')
        .replace(/<polygon id="white-base-(.*?)\/>/gi, '')
        .replace(/<path id="park-and-ride-(.*?)\/>/gi, '')
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace('</svg>', Stations.reduce(stationMarkup, 0))
        .trim() + '</svg>\'';
    fs.writeFileSync('src/js/map.js', svg);
    done();
});

gulp.task('html', () => gulp.src('./src/html/*.html')
    .pipe(gulp.dest('./build')));

gulp.task('dev', gulp.series('map', 'html', 'js'));
gulp.task('build', gulp.series('dev'));
