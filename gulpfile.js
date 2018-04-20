import gulp from "gulp";
import mocha from "gulp-mocha";
import sass, { logError } from "gulp-sass";
import bower from "gulp-bower";
import nodemon from "gulp-nodemon";
import eslint from "gulp-eslint";
import browserSync from 'browser-sync';

// set up watch
gulp.task('watch', function () {
    gulp.watch(['app/views/**'], browserSync.reload());

    gulp.watch(['public/js/**', 'app/**/*.js'], ['eslint'], browserSync.reload());

    gulp.watch(['public/views/**'],browserSync.reload());

    gulp.watch(['public/css/**'], ['sass'], browserSync.reload());
})

gulp.task('sass', function () {
    gulp.watch(['public/css/common.scss, public/css/views/articles.scss'], ['sass:dist']);
})

// set up task for babel for transpiling
gulp.task('es6', ()=>{
    gulp.src(['./**/*.js','!build/**','!node_modules/**/*','!bower_components/**','!gulpfile.js'])
    .pipe(babel())
    .pipe(gulp.dest('./build'))
});

// move the all necessary files for deployment to build
gulp.task('move-to-build', ()=>{
    gulp.src(['./public/**/**', '!./public/js/*'])
    .pipe(gulp.dest('./build/public'))
});

// set up for eslint
gulp.task('eslint', function () {
    return gulp.src(['gruntfile.js', 'public/js/**/*.js', 'test/**/*.js', 'app/**/*.js', '!node_modules/**'])
    .pipe(eslint())
});

// nodemon task
gulp.task('nodemon', function () {
    nodemon({
        script: 'server.js',
        ext: 'js',
        env: { PORT: 3000 },
        ignore: ['README.md', 'node_modules/**', '.DS_Store'],
        watch: ['app', 'config']
    })
})   

gulp.task('concurrent', ['nodemon', 'watch'])

// Mocha Test task
gulp.task('mochaTest', function () {
    gulp.src(['test/**/*.js'])
        .pipe(mocha({ reporter: 'spec' }))
})

// Sass conversion task
gulp.task('sass:dist', function () {
    return gulp.src('public/css/common.scss')
        .pipe(sass().on('error', logError))
        .pipe(gulp.dest('./public/css/common.css'))
})

gulp.task('bower', function () {
    return bower()
})

//Default task(s).
gulp.task('default', ['eslint','concurrent','sass']);

//Test task.
gulp.task('test', ['mochaTest']);

// Bower Task
gulp.task('install', ['bower']);

