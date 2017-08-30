"use strict";
var tasks = process.argv.slice(2);
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var gulp = require('gulp');
var util = require("gulp-util");
var zip = require('gulp-zip');
var replace = require('gulp-replace');

// few flags
var shouldWatch = tasks.length === 0;
var release = tasks.indexOf('release') !== -1;

function runNgBuild(app, done) {
  util.log('building ' + (shouldWatch ? ' and watching ' : '') + app);
  var args = ['build', '--vendor-chunk=false', '--output-hashing=none'];
  args.push('--app=' + app);
  if (shouldWatch) {
    args.push('--watch');
  }
  if (release) {
    args.push('--prod');
  }

  var cmd = spawn(process.platform === "win32" ? "ng.cmd" : "ng", args, { stdio: 'inherit' });
  cmd.on('exit', done);
}
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

gulp.task('build-background-script', runNgBuild.bind(this, 'background'));
gulp.task('build-content-script', runNgBuild.bind(this, 'content'));
gulp.task('build-ui', runNgBuild.bind(this, 'ui'));

gulp.task('build-io-proxy', (done) => {

  var child = exec("mvn package", { cwd: 'src/io' }, (err) => {
    if (err) {
      util.log(err);
    } else {
      util.log('io built');
    }
    gulp.src("src/io/target/ioproxy-1.0.jar").pipe(gulp.dest("host"));
    gulp.src("src/io/target/ioproxy-1.0.jar").pipe(gulp.dest("host-win"));
    done();
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
  return gulp.src(['build/**/*', '!**/*.db', '!background/index.html', '!content/index.html'])
    .pipe(zip('build.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', ['copy-assets', 'build-manifest', 'build-background-script', 'build-content-script', 'build-ui']);
gulp.task('release', ['build'], (cb) => {
  gulp.start('pack', [], cb);
});

gulp.task('default', () => {
  gulp.start('build');
  gulp.watch(['src/manifest.json', 'package.json'], ['build-manifest']);
  gulp.watch('src/io/src/**/*', ['build-io-proxy']);

});