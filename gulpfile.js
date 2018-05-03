import gulp from 'gulp';
import mocha from 'gulp-mocha';
import sass, { logError } from 'gulp-sass';
import bower from 'gulp-bower';
import nodemon from 'gulp-nodemon';
import eslint from 'gulp-eslint';
import browserSync from 'browser-sync';

// set up watch
gulp.task('watch', () => {
  gulp.watch(['app/views/**'], browserSync.reload());

  gulp.watch(['public/js/**', 'app/**/*.js'], ['eslint'], browserSync.reload());

  gulp.watch(['public/views/**'], browserSync.reload());

  gulp.watch(['public/css/**'], ['sass:dist'], browserSync.reload());
});

gulp.task('sass', () => {
  gulp.watch(
    ['public/css/common.scss, public/css/common2.scss, public/css/views/articles.scss'],
    ['sass:dist']
  );
});

// duplicate the all necessary files for deployment to build
gulp.task('dup-public-build', () => {
  gulp
    .src(['./public/**/**', '!./public/js/*'])
    .pipe(gulp.dest('./build/public'));
});

// duplication app folder
gulp.task('dup-app-build', () => {
  gulp.src(['./app/**/**']).pipe(gulp.dest('./build/app'));
});

// duplication server.js file
gulp.task('dup-server-build', () => {
  gulp.src(['./server.js']).pipe(gulp.dest('./build'));
});

// duplicate config file into build
gulp.task('dup-config-file', () => {
  gulp.src(['./config/**/**']).pipe(gulp.dest('./build/config'));
});

// task to duplicate all files
gulp.task('dup-all-files', [
  'dup-public-build',
  'dup-app-build',
  'dup-server-build',
  'dup-config-file',
  'es6'
]);

// set up for eslint
gulp.task('eslint', () =>
  gulp
    .src([
      'gruntfile.js',
      'public/js/**/*.js',
      'test/**/*.js',
      'app/**/*.js',
      '!node_modules/**'
    ])
    .pipe(eslint()));

// nodemon task
gulp.task('nodemon', () => {
  nodemon({
    script: 'server.js',
    ext: 'js, jade',
    exec: 'babel-node',
    env: { PORT: process.env.PORT || 3000 },
    ignore: ['README.md', 'node_modules/**', '.DS_Store'],
    watch: ['app', 'config']
  });
});

gulp.task('concurrent', ['nodemon', 'watch', 'sass']);

// Mocha Test task
gulp.task('mochaTest', () => {
  gulp.src(['test/**/*.js']).pipe(mocha({ reporter: 'spec', exit: true }));
});

// Sass conversion task
gulp.task('sass:dist', () =>
  gulp
    .src('public/css/*.scss')
    .pipe(sass().on('error', logError))
    .pipe(gulp.dest('./public/css')));

gulp.task('bower', () => bower());

// Default task(s).
gulp.task('default', ['eslint', 'concurrent', 'sass']);

// Test task.
gulp.task('test', ['mochaTest']);

// Bower Task
gulp.task('install', ['bower']);
