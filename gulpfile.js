const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const webpack_stream = require('webpack-stream');
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
        .trim() + '\'';
    fs.writeFileSync('src/js/map.js', svg);
    done();
});

gulp.task('html', () => gulp.src('./src/html/*.html')
    .pipe(gulp.dest('./build')));


gulp.task('dev', gulp.series('map', 'html', 'js'));
gulp.task('build', gulp.series('dev'));
