"use strict";

var gulp = require('gulp');
var util = require("gulp-util");
var merge = require('merge-stream');
var webpack = require('gulp-webpack');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sass = require('gulp-sass');
var shouldWatch = false;

gulp.task('copy', () => {
  var manifest = gulp.src('src/manifest.json').pipe(gulp.dest('build/'));
  var ui = gulp.src('src/ui/index.html').pipe(gulp.dest('build/ui/'));
  return merge(manifest, ui);
});

gulp.task('copy-assets', () => {
  return gulp.src('assets/*').pipe(gulp.dest('build/assets/'));
});

gulp.task('build-ui-styles', function () {
  return gulp.src('./src/ui/app.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest('./build/ui'));
});

gulp.task('build-ui', () => {
  return gulp.src(`src/ui/app.main.js`)
    .pipe(webpack({
      watch: shouldWatch,
      devtool: shouldWatch ? 'inline-source-map' : undefined,
      module: {
        loaders: [
          { test: /\.html$/, loaders: ["html"] },
          { test: /src.*\.js$/, loaders: ['ng-annotate'] },
        ]
      },
      output: { filename: 'app.js' }
    }))
    .pipe(gulp.dest(`build/ui`));
});

gulp.task('build-background-script', () => {
  return gulp.src(`src/background.main.js`)
    .pipe(webpack({
      watch: shouldWatch,
      devtool: shouldWatch ? 'inline-source-map' : undefined,
      output: { filename: 'background.js' }
    }))
    .pipe(gulp.dest(`build`));
});

gulp.task('build-content-script', () => {
  return gulp.src(`src/content.main.js`)
    .pipe(webpack({
      watch: shouldWatch,
      devtool: shouldWatch ? 'inline-source-map' : undefined,
      output: { filename: 'content.js' }
    }))
    .pipe(gulp.dest(`build`));
});

gulp.task('build-io-proxy', (done) => {
  var exec = require('child_process').exec;
  var child = exec("mvn package", { cwd: 'src/io' }, (err) => {
    if (err) {
      util.log(err);
    } else {
      util.log('done');
    }
    gulp.src("src/io/target/ioproxy-1.0.jar").pipe(gulp.dest("host"));
  });
});

gulp.task('build', ['copy', 'copy-assets', 'build-background-script', 'build-content-script', 'build-ui', 'build-ui-styles']);

gulp.task('default', () => {
  shouldWatch = true;
  gulp.start('build');
  gulp.watch(['src/manifest.json', 'src/ui/index.html'], ['copy']);
  gulp.watch('src/ui/**/*.scss', ['build-ui-styles']);
  gulp.watch('src/io/src/**/*', ['build-io-proxy']);
});