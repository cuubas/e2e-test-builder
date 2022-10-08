const { series, parallel, watch, src, dest } = require('gulp');
const replace = require('gulp-replace');
var zip = require('gulp-zip');
const spawn = require('child_process').spawn;
const fs = require('fs');

function createNgBuildTask(app, shouldWatch, isProduction) {
  console.log('building ' + (shouldWatch ? 'and watching ' : '') + app);
  var args = ['build', app];
  if (shouldWatch) {
    args.push('--watch');
  }
  if (isProduction) {
    args.push('--configuration=production');
  }

  const ngBuild = function () {
    return spawn(process.platform === "win32" ? "ng.cmd" : "ng", args, { stdio: 'inherit' });
  }

  ngBuild.displayName = 'ng ' + args.join(' ');

  return ngBuild;
}

function pack() {
  try {
    fs.unlinkSync('build.zip');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return src(['build/**/*', '!**/*.db', '!background/index.html', '!content/index.html'])
    .pipe(zip('build.zip'))
    .pipe(dest('./'));
}

function copyAssets() {
  return src('assets/**/*').pipe(dest('build/assets/'));
}

function buildManifest(_isProduction) {
  const runtimeScript = 'runtime.js';
  const polyfillsScript = 'polyfills.js';
  const mainScript = 'main.js';
  return function () {
    const pack = JSON.parse(fs.readFileSync('./package.json'));
    return src('src/manifest.json')
      .pipe(replace('{{package.version}}', pack.version))
      .pipe(replace('{{defaultIcon}}', 'assets/icon-c@32.png'))
      .pipe(replace('"{{icons}}"', '{ ' + [16, 32, 48, 128, 256, 512].map((size) => `"${size}" : "assets/icon-c@${size}.png"`).join(', ') + ' }'))
      .pipe(replace('{{runtimeScript}}', runtimeScript))
      .pipe(replace('{{polyfillsScript}}', polyfillsScript))
      .pipe(replace('{{mainScript}}', mainScript))
      .pipe(dest('build/'));
  };
}


exports.manifest = series(
  buildManifest(true)
);

exports.dev = series(
  parallel(copyAssets, buildManifest(false)),
  parallel(
    createNgBuildTask('background', true),
    createNgBuildTask('content', true),
    createNgBuildTask('ui', true),
    function watchManifest() { watch(['src/manifest.json', 'package.json'], buildManifest()) },
  )
);

exports.build = series(
  parallel(copyAssets, buildManifest(true)),
  parallel(
    createNgBuildTask('background'),
    createNgBuildTask('content'),
    createNgBuildTask('ui')
  )
);

exports.release = series(
  parallel(copyAssets, buildManifest(true)),
  parallel(
    createNgBuildTask('background', false, true),
    createNgBuildTask('content', false, true),
    createNgBuildTask('ui', false, true)
  ),
  pack
);
