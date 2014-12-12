var gulp = require('gulp');
var gulpConnect = require('gulp-connect');
var gulpUglify = require('gulp-uglify');
var gulpSass = require('gulp-sass');
var gulpHint = require('gulp-jshint');
var gulpExec = require('gulp-exec');
var gulpConcat = require('gulp-concat');
var gulpRename = require('gulp-rename');
var gulpMap = require('gulp-sourcemaps');
var del = require('del');

var DIST = 'dist/';

gulp.task('clean', function() {
  return del([
    'tmp/**',
    'dist/**'
  ]);
});

gulp.task('build', ['clean','js','css']);

gulp.task('server', ['js','css','livereload'], function() {
  return gulpConnect.server({
    root: ['dist'],
    port: process.env.PORT || 3000
  });
});

gulp.task('livereload', function() {
  gulp.watch('./gulpfile.js', gulpConnect.reload());
  gulp.watch('styles/**', ['css']);
  gulp.watch('src/**', ['js']);
  gulp.watch('templates/**', ['js']);
  gulp.watch('partials/**', ['js']);
})

gulp.task('templates', function() {
  return gulp.src('templates/*.hbs', {read: false})
    .pipe(gulpExec('./node_modules/.bin/handlebars "<%= file.path %>"', {pipeStdout: true}))
    .pipe(gulpRename(function(path) {
      path.extname = '.hbs.js';
    }))
    .pipe(gulp.dest('./tmp/tpl'));
});

gulp.task('partials', function() {
  return gulp.src('partials/*.hbs', {read: false})
    .pipe(gulpExec('./node_modules/.bin/handlebars --partial "<%= file.path %>"', {pipeStdout: true}))
    .pipe(gulpRename(function(path) {
      path.extname = '.hbs.js';
    }))
    .pipe(gulp.dest('./tmp/tpl'));
});

gulp.task('js', ['templates','partials'], function() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'vendor/jquery.scrollintoview.js',
    'vendor/async.js',
    'vendor/json2.js',
    'vendor/polyfill.js',
    'vendor/JSONFormatter.js',
    'src/URLParse.js',
    'src/Cookie.js',
    'node_modules/handlebars/dist/handlebars.runtime.js',
    'src/template.js',
    'tmp/tpl/**',
    'src/HTMLApi.js',
    'src/Explorer.js',
    'src/init.js',
  ])
  .pipe(gulpMap.init())
    .pipe(gulpConcat('ui.js'))
    .pipe(gulp.dest(DIST))
    .pipe(gulpUglify())
  .pipe(gulpMap.write())
  .pipe(gulpRename({suffix: '.min'}))
  .pipe(gulp.dest(DIST));
});

gulp.task('css', function() {
  return gulp.src('styles/ui.scss')
    .pipe(gulpMap.init())
      .pipe(gulpSass())
    .pipe(gulpMap.write())
    .pipe(gulp.dest(DIST))
    .pipe(gulpRename({suffix: '.min'}))
    .pipe(gulp.dest(DIST));
});

gulp.task('default', ['build']);
