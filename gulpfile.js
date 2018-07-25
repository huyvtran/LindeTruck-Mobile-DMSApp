/**
 * @desc load plugins
 */
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    size = require('gulp-size'),
    notify = require('gulp-notify');

/**
 * @author Pierre Großmann
 * @desc minify and rename all Sass Files.
 */
gulp.task('sass', function () {
    var s = size();
    gulp.src('./scss/ionic.app.scss')
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest('./www/css/'))
        .pipe(s)
        .pipe(minifyCss({keepSpecialComments: 0}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./www/css/'))
        .pipe(notify({
            onError: false,
            title: 'SASS Task was completed',
            message: function () {
                return 'Total size ' + s.prettySize;
            }
        }));
});
