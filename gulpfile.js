var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpConnect = require('gulp-connect');
var gulpExec = require('gulp-exec');
var gulpGzip = require('gulp-gzip');
var gulpHint = require('gulp-jshint');
var gulpMap = require('gulp-sourcemaps');
var gulpRename = require('gulp-rename');
var gulpSass = require('gulp-sass');
var gulpTar = require('gulp-tar');
var gulpUglify = require('gulp-uglify');
var del = require('del');

var pkg = require('./package.json');

var DIST = 'dist/';
var VERSION_DIST = DIST+pkg.version+'/';
var CDN = 'cdn.rancher.io/api-ui';

gulp.task('default', ['build']);
gulp.task('build', ['src','tarball']);

gulp.task('src', ['js','minjs','css','mincss','bootstrap']);

gulp.task('clean', function() {
  return del([
    'tmp/**',
    'dist/**'
  ]);
});

gulp.task('server', ['build','livereload'], function() {
  var cors = function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  };

  return gulpConnect.server({
    root: [VERSION_DIST],
    port: process.env.PORT || 3000,
    middleware: function() {
      return [cors];
    },
  });
});

gulp.task('server:reload', function() {
  return gulpConnect.reload();
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
    .pipe(gulpConcat('ui.js',{newLine: ';\n'}))
  .pipe(gulpMap.write('./'))
  .pipe(gulp.dest(VERSION_DIST));
});

gulp.task('minjs', ['js'], function() {
  return gulp.src([VERSION_DIST+'/ui.js'], {base: VERSION_DIST})
    .pipe(gulpRename({suffix: '.min'}))
    .pipe(gulpMap.init({loadMaps: true}))
      .pipe(gulpUglify())
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST));
});

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

gulp.task('css', function() {
  return gulp.src('styles/ui.scss')
    .pipe(gulpMap.init())
      .pipe(gulpSass())
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST))
});

gulp.task('mincss', ['css'], function() {
  return gulp.src([VERSION_DIST+'/ui.css'], {base: VERSION_DIST})
    .pipe(gulpRename({suffix: '.min'}))
    .pipe(gulpMap.init({loadMaps: true}))
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST));
});

gulp.task('bootstrap', function() {
  return gulp.src(['node_modules/bootstrap/dist/**'])
    .pipe(gulp.dest(VERSION_DIST));
});

gulp.task('tarball', ['src'], function() {
  return gulp.src([VERSION_DIST+'/**'], {base: DIST})
    .pipe(gulpTar(pkg.version+'.tar'))
    .pipe(gulpGzip())
    .pipe(gulp.dest(DIST));
});

gulp.task('livereload', function() {
  gulp.watch('./gulpfile.js', ['server:reload']);
  gulp.watch('styles/**', ['css']);
  gulp.watch('src/**', ['js']);
  gulp.watch('templates/**', ['js']);
  gulp.watch('partials/**', ['js']);
})
