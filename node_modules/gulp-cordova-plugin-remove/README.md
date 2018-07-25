# gulp-cordova-plugin-remove

[![Build Status](https://travis-ci.org/SamVerschueren/gulp-cordova-plugin-remove.svg?branch=master)](https://travis-ci.org/SamVerschueren/gulp-cordova-plugin-remove)
[![Coverage Status](https://coveralls.io/repos/SamVerschueren/gulp-cordova-plugin-remove/badge.svg?branch=master&service=github)](https://coveralls.io/github/SamVerschueren/gulp-cordova-plugin-remove?branch=master)

> Removes a cordova plugin from the cordova project


## Installation

```
npm install --save-dev gulp-cordova-plugin-remove
```


## Usage

```js
const gulp = require('gulp');
const rmplugin = require('gulp-cordova-plugin-remove');

gulp.task('clean', () => {
    return gulp.src('.cordova')
        .pipe(rmplugin('cordova-plugin-console'));
});
```

This will first add the plugin, builds the `android` project and then it removes the plugin again.


## API

### rmplugin(plugin)

#### plugin

*Required*  
Type: `string`

The plugin that should be removed from the project.

### rmplugin(plugins)

#### plugins

*Required*  
Type: `string[]`

A list of plugins that should be removed from the project.


## Related

See [`gulp-cordova`](https://github.com/SamVerschueren/gulp-cordova) for the full list of available packages.


## License

MIT © Sam Verschueren
