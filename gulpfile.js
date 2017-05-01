'use strict';

var fs =            require('fs');
var gulp =          require('gulp');
var connect =       require('gulp-connect');
var watch =         require('gulp-watch');
var uglify =        require('gulp-uglify');
var del =           require('del');
var sourcemaps =    require('gulp-sourcemaps');
var gulpIf =        require('gulp-if');
var browserify =    require('browserify');
var babelify =      require('babelify');
var watchify =      require('watchify');
var source =        require('vinyl-source-stream');
var buffer =        require('vinyl-buffer');

function isProduction(){
    return process.env.NODE_ENV == 'production';
}

gulp.task('clean', function(){
    return del(['moscow_metro.js', 'moscow_metro.js.map']);
});

gulp.task('testcafe_server', function(){
    connect.server({
        port: 3000
    });
    // run some headless tests with phantomjs
    // when process exits:
    //connect.serverClose();
});

function JS(watch) {

    var bundler = browserify('./src/index.js',
        {
            cache: {},
            packageCache: {},
            debug: true
        })
            .transform(babelify, {
                presets: ["es2015"],
                sourceMaps: true
            }),
        go = function() {
            return bundler.bundle()
                .on('error', function (err) {
                    console.error(err);
                    this.emit('end');
                })
                .pipe(source('moscow_metro.js'))
                .pipe(buffer())
                .pipe(gulpIf(!isProduction(), sourcemaps.init({ loadMaps: true })))
                .pipe(gulpIf(!isProduction(), sourcemaps.write('./')))
                .pipe(gulpIf(isProduction(), uglify()))
                .pipe(gulp.dest('./'))
                .on('end', function(){
                    console.log('Bundled..');
                });
        };

    if(watch){
        bundler = watchify(bundler);
        bundler.on('update', go);
    }

    return go();
}

gulp.task('js', function(){
    return JS(false);
});

gulp.task('watch', function(){
    JS(true);
});

gulp.task('build', gulp.series('clean', 'js'));
gulp.task('dev', gulp.series('build', 'watch'));