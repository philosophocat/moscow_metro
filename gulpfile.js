const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const webpack_stream = require('webpack-stream');
const Stations = require('./src/stations.json');
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

gulp.task('map', done => {
    const css = {
        station: 'moscow_metro_map__station',
        area: 'moscow_metro_map__area',
        substrate: 'moscow_metro_map__substrate',
        check: 'moscow_metro_map__check',
    };

    let stations = '';
    for (let i = 0; i < Stations.length; i++){
        let station = Stations[i];
        let substrate_y = !!station.checks.length && station.checks[0].scale === 0.65 ? -5 : -10;
        let x = station.x + (station.substrate_x || 0);
        let y = station.y + substrate_y;
        let translate = `translate(${x} ${y})`;
        let area_translate = `translate(${x} ${y - 5})`;
        stations += `<g class="${css.station}" data-id="${station.id}">`;
        stations += `<rect transform="${translate}" width="1" height="1" class="${css.substrate}"></rect>`;
        stations += `<rect transform="${area_translate}" width="1" height="1" class="${css.area}"></rect>`;
        stations += station.name;
        stations += '</g>';

        for (let k = 0; k < station.checks.length; k++){
            let check = station.checks[k];
            stations += `<g class="${css.check}" `;
            stations += `transform="translate(${check.x} ${check.y}), scale(${check.scale}, ${check.scale})" `;
            stations += `data-id="${station.id}">`;
            stations += '<polygon fill="#FFFFFF" points="8.1,15.1 16.2,7 14.7,5.5 8.1,12.1 5.2,9.2 3.7,10.7"/>';
            stations += '<path fill="#6AC259" d="M10,0C4.5,0,0,4.5,0,10s4.5,10,10,10s10-4.5,10-10S15.5,0,10,0z M8.1,12.1l6.6-6.6L16.2,7l-8.1,8.1l-4.4-4.4l1.5-1.5L8.1,12.1z"/>';
            stations += '</g>';
        }
    }

    let svg = fs.readFileSync('src/map.svg', 'utf8');
    svg = 'export default \'' + svg
        .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
        .replace('id="Layer_1"', 'class="moscow_metro_map"')
        .replace(/font-family(.*?);/gi, '')
        .replace(/<rect id="white-base-(.*?)\/>/gi, '')
        .replace(/<polygon id="white-base-(.*?)\/>/gi, '')
        .replace(/<path id="park-and-ride-(.*?)\/>/gi, '')
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace('	', ' ')
        .replace('</svg>', stations)
        .trim() + '</svg>\'';

    fs.writeFileSync('src/js/map.js', svg);
    done();
});

gulp.task('html', () => gulp.src('./src/html/*.html')
    .pipe(gulp.dest('./build')));


gulp.task('dev', gulp.series('map', 'html', 'js'));
gulp.task('build', gulp.series('dev'));
