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


// duplicate the all necessary files for deployment to build
gulp.task('dup-public-build', ()=>{
    gulp.src(['./public/**/**', '!./public/js/*'])
    .pipe(gulp.dest('./build/public'))
});

// duplication app folder 
gulp.task('dup-app-build', ()=>{
    gulp.src(['./app/**/**'])
    .pipe(gulp.dest('./build/app'))
});

// duplication server.js file 
gulp.task('dup-server-build', ()=>{
    gulp.src(['./server.js'])
    .pipe(gulp.dest('./build'))
});

// duplicate config file into build
gulp.task('dup-config-file', ()=>{
    gulp.src(['./config/**/**'])
    .pipe(gulp.dest('./build/config'))
});

// task to duplicate all files
gulp.task('dup-all-files',[
    'dup-public-build',
    'dup-app-build',
    'dup-server-build',
    'dup-config-file',
    'es6'
    
])

// set up for eslint
gulp.task('eslint', function () {
    return gulp.src(['gruntfile.js', 'public/js/**/*.js', 'test/**/*.js', 'app/**/*.js', '!node_modules/**'])
    .pipe(eslint())
});

// nodemon task
gulp.task('nodemon', function () {
    nodemon({
        script: 'server.js',
        ext: 'js, jade',
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
        .pipe(gulp.dest('../build/public/css/common.css'))
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

