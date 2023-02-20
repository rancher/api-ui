var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpConnect = require('gulp-connect');
var gulpExec = require('gulp-exec');
var gulpGzip = require('gulp-gzip');
var gulpMap = require('gulp-sourcemaps');
var gulpRename = require('gulp-rename');
var gulpReplace = require('gulp-replace');
var gulpSass = require('gulp-sass')(require('sass'));
var gulpTar = require('gulp-tar');
var gulpUglify = require('gulp-uglify');
var fs = require('fs-extra');
var pkg = require('./package.json');

var DIST = 'dist/';
var VERSION_DIST = DIST+pkg.version+'/';
var CDN = 'cdn.rancher.io/api-ui';

gulp.task('clean', function() {
  return fs.emptyDir('./tmp').then(() => fs.emptyDir('./dist'));
});

gulp.task('server:reload', function() {
  return gulpConnect.reload();
});

gulp.task('templates', function() {
  return gulp.src('templates/*.hbs', {read: false})
    .pipe(gulpExec(file => `./node_modules/.bin/handlebars "${file.path}"`, {pipeStdout: true}))
    .pipe(gulpRename(function(path) {
      path.extname = '.hbs.js';
    }))
    .pipe(gulp.dest('./tmp/tpl'));
});

gulp.task('partials', function() {
  return gulp.src('partials/*.hbs', {read: false})
    .pipe(gulpExec(file => `./node_modules/.bin/handlebars --partial "${file.path}"`, {pipeStdout: true}))
    .pipe(gulpRename(function(path) {
      path.extname = '.hbs.js';
    }))
    .pipe(gulp.dest('./tmp/tpl'));
});

gulp.task('js', gulp.series('templates','partials', function() {
  return gulp.src([
    'node_modules/jquery/dist/jquery.js',
    'vendor/jquery.scrollintoview.js',
    'node_modules/bootstrap/dist/js/bootstrap.js',
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
}));

gulp.task('minjs', gulp.series('js', function() {
  return gulp.src([VERSION_DIST+'/ui.js'], {base: VERSION_DIST})
    .pipe(gulpRename({suffix: '.min'}))
    .pipe(gulpMap.init({loadMaps: true}))
      .pipe(gulpUglify())
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST));
}));

gulp.task('css', function() {
  return gulp.src([
    './node_modules/bootstrap/dist/css/bootstrap.css',
    'styles/main.scss',
    'styles/explorer.scss'
  ])
    .pipe(gulpReplace("/*# sourceMappingURL=bootstrap.css.map */",""))
    .pipe(gulpConcat('ui.css'))
    .pipe(gulpMap.init())
      .pipe(gulpSass())
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST))
});

gulp.task('mincss', gulp.series('css', function() {
  return gulp.src([VERSION_DIST+'/ui.css'], {base: VERSION_DIST})
    .pipe(gulpRename({suffix: '.min'}))
    .pipe(gulpMap.init({loadMaps: true}))
    .pipe(gulpMap.write('./'))
    .pipe(gulp.dest(VERSION_DIST));
}));

gulp.task('bootstrap', function() {
  return gulp.src(['node_modules/bootstrap/dist/**'])
    .pipe(gulp.dest(VERSION_DIST));
});

gulp.task('livereload', function() {
  gulp.watch('./gulpfile.js', ['server:reload']);
  gulp.watch('styles/**', ['css']);
  gulp.watch('src/**', ['js']);
  gulp.watch('templates/**', ['js']);
  gulp.watch('partials/**', ['js']);
})

gulp.task('src', gulp.series('js','minjs','css','mincss','bootstrap'));

gulp.task('tarball', gulp.series('src', function() {
  return gulp.src([VERSION_DIST+'/**'], {base: DIST})
    .pipe(gulpTar(pkg.version+'.tar'))
    .pipe(gulpGzip())
    .pipe(gulp.dest(DIST));
}));

gulp.task('build', gulp.series('src', 'tarball'), () => {});
gulp.task('default', gulp.series('build'));

gulp.task('server', gulp.series('build','livereload', function() {
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
}));

