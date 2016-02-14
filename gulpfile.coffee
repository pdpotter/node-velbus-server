gulp = require 'gulp'

coffee = require 'gulp-coffee'
plumber = require 'gulp-plumber'
watch = require 'gulp-watch'

gulp.task 'coffee', ->
  return gulp.src('coffee/**/*.coffee')
  .pipe(do plumber)
  .pipe(do coffee)
  .pipe(gulp.dest 'server')

gulp.task 'watch', ->
  watch 'coffee/**/*.coffee', ->
    gulp.start 'coffee'
