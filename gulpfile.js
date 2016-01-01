var fs = require("fs"),
	gulp = require('gulp'),
	newer = require('gulp-newer'),
	jshint = require('gulp-jshint'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	size = require('gulp-size'),
	preprocess = require('gulp-preprocess'),
	sass = require('gulp-sass'),
	htmlclean = require('gulp-htmlclean'),
	sourcemaps = require('gulp-sourcemaps'),
    watch = require('gulp-watch'),
    notify = require("gulp-notify"),
    del = require('del'),
    liveServer = require("live-server"),
    changed = require('gulp-changed'),
    pkg = require('./package.json');

process.env.NODE_ENV = 'development';

var
	devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),

	source = 'src/',
	dest = 'dist/',
	html = {
		in: source + 'html/**/*.html',
		watch: [source + 'html/**/*.html'],
		out: dest+'screens/',
		context: {
			devBuild: devBuild,
			author: pkg.author,
			version: pkg.version
		}
	},
	css = {
	    in: source + 'sass/**/*.scss',
	    watch: [source + 'sass/**/*'],
	    out: dest + '/styles',
	    sassOpts: {
	        outputStyle: 'expanded', // compressed
	        imagePath: '../images',
	        precision: 3,
	        errLogToConsole: true,
	        onError: function (err) {
	            return notify().write(err);
	        }
	    }
	},

	js = {
		in: source + 'js/**/*',
		out: dest + 'js/',
		filename: 'main.min.js',
		vendor: source + 'vendor/'
	};

    function getFilesList() {
        var jsFiles = [],
        	indexContents,
            scriptTagsPattern,
            match;

        // if (!grunt.file.exists(indexPath)) {
        //     grunt.log.warn('Index file "' + indexPath + '" not found.');
        //     return false;
        // }

		indexContents = fs.readFileSync(source+'html/templates/_scripts.html');
        scriptTagsPattern = /<script.+?src="(.+?)".*?><\/script>/gm;
        match = scriptTagsPattern.exec(indexContents);
        while (match) {
            // if (!(/livereload-setup\.js/.test(match[1]))) {
            jsFiles.push(source + match[1]);
            // }
            match = scriptTagsPattern.exec(indexContents);
        } 
        jsFiles.pop(); // remove production script `main.min.js` 
        return  jsFiles;
    }
// build HTML files
gulp.task('html', function() {
	var page = gulp.src(html.in).pipe(preprocess({ context: html.context }));
	if (!devBuild) {
		page = page
			.pipe(size({ title: 'HTML in' }))
			.pipe(htmlclean())
			.pipe(size({ title: 'HTML out' }));
	}
	return page.pipe(gulp.dest(html.out));
});

// compile Sass
gulp.task('sass', function () {
    return gulp.src(css.in)
    	//.pipe(watch(css.in))
    	.pipe(changed(css.out))
		.pipe(sourcemaps.init())
		.pipe(sass(css.sassOpts))
        .on('error', notify.onError(function (error) {
            return 'An error occurred while compiling sass.\nLook in the console for details.\n' + error;
        }))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(css.out))
        .pipe(notify({
            message: "Compilation Successful"
        }));
});

gulp.task('js', function() {
	if (devBuild) {
		return gulp.src(js.in)
			.pipe(newer(js.out))
			.pipe(jshint())
			.pipe(jshint.reporter('default'))
			.pipe(jshint.reporter('fail'))
			.pipe(gulp.dest(js.out));
	}
	else {
		// del([
		// 	dest + 'js/*'
		// ]);
		return gulp.src(getFilesList())
			//.pipe(deporder())
			.pipe(concat(js.filename))
			.pipe(size({ title: 'JS in '}))
			// .pipe(stripdebug())
			.pipe(uglify())
			.pipe(size({ title: 'JS out '}))
			.pipe(gulp.dest(js.out));
	}
});

gulp.task('copy', function(){
  // the base option sets the relative root for the set of files,
  // preserving the folder structure
  if(devBuild){
	  gulp.src([
      source + "images/**/*.*",
      source + "fonts/**/*.*",
      source + "vendor/**/*.*",
      source + "views/**/*.*"
    ], { base: source })
	  .pipe(gulp.dest(dest)); 	
  }
});

// clean the build folder
gulp.task('clean', function() {
	del([
		dest + '*'
	]);
});

gulp.task('serve', function () {
	liveServer.start();
});

gulp.task('default', ['serve', 'html', 'sass', 'js', 'copy'], function () {
	// html changes
	gulp.watch(html.watch, ['html']);

	// sass changes
    gulp.watch([css.watch], ['sass']);

    // javascript changes
	gulp.watch(js.in, ['js']);
});
