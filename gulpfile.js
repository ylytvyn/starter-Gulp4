const SOURCES = {
	css: [
		'./node_modules/bootstrap/dist/css/bootstrap.min.css'
	],
	js: [
		'./node_modules/jquery/dist/jquery.min.js',
		'./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
	]
};

// Libraries
const gulp 			= require('gulp');
const sass 			= require('gulp-sass');
const browsersync 	= require("browser-sync").create();
const plumber 		= require("gulp-plumber");
const rename 		= require("gulp-rename");
const postcss 		= require("gulp-postcss");
const autoprefixer 	= require("autoprefixer");
const cssnano 		= require("cssnano");
const imagemin 		= require("gulp-imagemin");
const del 			= require("del");
const useref 		= require('gulp-useref');
const uglify 		= require('gulp-uglify');
const gulpIf 		= require('gulp-if');
const wait 			= require('gulp-wait');
const notify 		= require('gulp-notify');
const concat		= require('gulp-concat');

// Paths
const paths = {
	css: {
		src: "app/scss/**/*.scss",
		dest: "app/css",
		destBuild: "dist/css"
	},
	html: {
		src: "app/*.html",
		dest: "dist"
	},
	js: {
		src: "app/js/**/*",
		dest: "app/js",
	},
	images: {
		src: "app/images/**/*",
		dest: "dist/images"
	},
	fonts: {
		src: "app/css/fonts/**/*",
		dest: "dist/css/fonts"
	}
};

// Modules
function modulesCSS() {
	return gulp.src(SOURCES.css)
			   .pipe(wait(10))
			   .pipe(plumbError())
			   .pipe(concat("bundle.min.css"))
			   .pipe(gulp.dest(paths.css.dest))
			   .pipe(notify({message: "CSS Libraries Compiled Successfully!"}));
}

function modulesJS() {
	return gulp.src(SOURCES.js)
			   .pipe(wait(10))
			   .pipe(plumbError())
			   .pipe(concat("bundle.min.js"))
			   .pipe(uglify())
			   .pipe(gulp.dest(paths.js.dest))
			   .pipe(notify({message: "JS Libraries Compiled Successfully!"}));
}

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./app/"
    },
    port: 9000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Error Handling
function plumbError() {
  return plumber({
    errorHandler: function(err) {
      notify.onError({
        templateOptions: {
          date: new Date()
        },
        title: "Gulp error in " + err.plugin,
        message: err.formatted
      })(err);
      this.emit('end');
    }
  })
}

// CSS task
function styles() {
	return gulp.src(paths.css.src)
	           .pipe(wait(500))
       		   .pipe(plumbError())
	           .pipe(sass())
	           .pipe(rename({ suffix: ".min" }))
	           .pipe(postcss([autoprefixer('last 2 versions'), cssnano()]))
	           .pipe(gulp.dest(paths.css.dest))
			   .pipe(browsersync.stream())
			   .pipe(notify({message: "SCSS Compiled Successfully!"}));
}

// Optimize Images
function images() {
	return gulp.src(paths.images.src)
        .pipe(
            imagemin([
                imagemin.gifsicle({interlaced: true}),
				imagemin.mozjpeg({quality: 75, progressive: true}),
				imagemin.optipng({optimizationLevel: 5}),
				imagemin.svgo({
					plugins: [
						{removeViewBox: true},
						{cleanupIDs: false}
					]
				})
            ])
        )
		.pipe(gulp.dest(paths.images.dest));
}

// Clean dist
function clean() {
  return del([paths.html.dest]);
}

// Move items to dist
function fonts() {
  return gulp.src(paths.fonts.src)
  			 .pipe(gulp.dest(paths.fonts.dest));
};

function distFiles() {
	return gulp.src(paths.html.src)
			   .pipe(useref())
			   .pipe(gulpIf('*.js', uglify()))
			   .pipe(gulp.src('*.css'))
			   .pipe(gulp.dest(paths.html.dest));
}

// Watch files
function watchFiles() {
  	gulp.watch(paths.css.src, styles);
  	gulp.watch(paths.html.src, browserSyncReload);
  	gulp.watch(paths.js.src, browserSyncReload);
	gulp.watch(paths.images.src, images);
}


// define complex tasks
const modules = gulp.parallel(modulesCSS, modulesJS);
const build = gulp.series(clean, modules, styles, gulp.parallel(distFiles, images, fonts));
const watch = gulp.series(modules, gulp.parallel(watchFiles, browserSync));


// export tasks
exports.modules = modules;
exports.watch = watch;
exports.build = build;
exports.default = watch;
