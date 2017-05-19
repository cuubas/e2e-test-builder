"use strict";
var tasks = process.argv.slice(2);

var fs = require('fs');
var gulp = require('gulp');
var util = require("gulp-util");
var webpack = require('gulp-webpack');
var ngAnnotate = require('gulp-ng-annotate');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sass = require('gulp-sass');
var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var replace = require('gulp-replace');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

// few flags
var shouldWatch = tasks.length === 0;
var shouldUglify = tasks.length && tasks[0].indexOf('release') !== -1;

var babelLoader = {
  test: /.js$/,
  loader: 'babel-loader',
  exclude: /node_modules[\/\\](?!(selenium-protractor|some-other-module))/,
  query: {
    plugins: ["transform-es2015-arrow-functions", "transform-es2015-template-literals"]
  }
};

gulp.task('copy-assets', () => {
  return gulp.src('assets/**/*').pipe(gulp.dest('build/assets/'));
});

gulp.task('build-manifest', () => {
  var pack = JSON.parse(fs.readFileSync('./package.json'));
  return gulp.src('src/manifest.json')
    .pipe(replace('{{package.version}}', pack.version))
    .pipe(replace('{{defaultIcon}}', 'assets/icon-c@32.png'))
    .pipe(replace('"{{icons}}"', '{ ' + [16, 32, 48, 128, 256, 512].map((size) => `"${size}" : "assets/icon-c@${size}.png"`).join(', ') + ' }'))
    .pipe(gulp.dest('build/'));
});

gulp.task('build-ui-html', () => {
  return gulp.src('src/ui/index.html').pipe(gulp.dest('build/ui/'));
});

gulp.task('build-ui-styles', () => {
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
          shouldUglify ? babelLoader : []
        ]
      },
      plugins: shouldUglify ? [new UglifyJSPlugin()] : [],
      output: { filename: 'app.js' }
    }))
    .pipe(gulp.dest(`build/ui`));
});


gulp.task('build-background-script', () => {
  return gulp.src(`src/background.main.js`)
    .pipe(webpack({
      watch: shouldWatch,
      devtool: shouldWatch ? 'inline-source-map' : undefined,
      module: {
        loaders: [shouldUglify ? babelLoader : []]
      },
      output: { filename: 'background.js' },
      plugins: shouldUglify ? [new UglifyJSPlugin()] : []
    }))
    .pipe(gulp.dest(`build`));
});

gulp.task('build-content-script', () => {
  return gulp.src(`src/content.main.js`)
    .pipe(webpack({
      watch: shouldWatch,
      devtool: shouldWatch ? 'inline-source-map' : undefined,
      module: {
        loaders: [shouldUglify ? babelLoader : []]
      },
      output: { filename: 'content.js' },
      plugins: shouldUglify ? [new UglifyJSPlugin()] : [],
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
    gulp.src("src/io/target/ioproxy-1.0.jar").pipe(gulp.dest("host-win"));
  });
});

gulp.task('pack', () => {
  try {
    fs.unlinkSync('build.zip');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return gulp.src(['build/**/*', '!**/*.db'])
    .pipe(zip('build.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', ['copy-assets', 'build-manifest', 'build-background-script', 'build-content-script', 'build-ui-html', 'build-ui', 'build-ui-styles']);
gulp.task('build-release', ['build']);
gulp.task('release', ['build'], (cb) => {
  gulp.start('pack', [], cb);
});

gulp.task('default', () => {
  gulp.start('build');
  gulp.watch(['src/manifest.json', 'package.json'], ['build-manifest']);
  gulp.watch('src/ui/index.html', ['build-ui-html']);
  gulp.watch('src/ui/**/*.scss', ['build-ui-styles']);
  gulp.watch('src/io/src/**/*', ['build-io-proxy']);
});