(function () {

    'use strict';

    angular
        .module('oinio.configuration', [])
        .factory('localTranslateLoader', localTranslateLoader)
        .config(components);

    /**
     * @func components
     *
     * @param {*} $translateProvider
     * @param {*} $compileProvider
     * @param {*} $httpProvider
     * @param {*} $ionicConfigProvider
     */
    function components($translateProvider, $compileProvider, $httpProvider, $ionicConfigProvider) {

        /**
         * @desc angular translate loader static files
         */
        $translateProvider.forceAsyncReload(true);
        $translateProvider.preferredLanguage('en');
        $translateProvider.fallbackLanguage('en');

        // As applicationDirectory is not writable, we need a custom loader for dataDirectory,
        // this is needed for storing objects / fields label translations.
        $translateProvider.useLoader('localTranslateLoader', {
            files: [{
                path: 'cordova.file.applicationDirectory',
                prefix: 'www/app/common/i18n/locale-',
                suffix: '.json'
            }, {
                path: 'cordova.file.dataDirectory',
                prefix: 'i18n/locale-objects-',
                suffix: '.json'
            }]
        });

        // Create Whitelist
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|content):|data:image\//);

        /**
         * @desc    set Global Loading Screen with Interceptors
         */
        $httpProvider.interceptors.push(function ($rootScope) {
            return {
                request: function (config) {
                    //console.log(">>>> REUQEST: ", request);

                    // Only load http resource needs to show loading, local resource doesn't need.
                    // Besides, force client request is not intercepted by this, so we need to add show and hide method manually for each servic method using force client.
                    if (config.url.indexOf('http') === 0) {
                        $rootScope.$broadcast('loading:show');
                    }

                    return config;
                },
                response: function (response) {
                    //console.log(">>>> RESPONSE: ", response);

                    // Only load http resource needs to show loading, local resource doesn't need.
                    // Besides, force client request is not intercepted by this, so we need to add show and hide method manually for each servic method using force client.
                    if (response.config.url.indexOf('http') === 0) {
                        $rootScope.$broadcast('loading:hide');
                    }

                    return response;
                }
            };
        });

        /**
         * @desc
         */
        $ionicConfigProvider.backButton.text('').icon('ion-chevron-left').previousTitleText(false);
        $ionicConfigProvider.views.swipeBackEnabled(false);

    }

    /**
     * Custom loader for loading local static files not only in app directory, but also other directories.
     *
     * @param   {*} $q           [description]
     * @param   {*} $http        [description]
     * @param   {*} $cordovaFile [description]
     * @returns {function}              [description]
     */
    function localTranslateLoader($q, $http, $cordovaFile) {
        
        return function (options) {

            //console.log('>>>> options: ' + JSON.stringify(options) + ' ' + JSON.stringify(cordova));

            if (!options || (!angular.isArray(options.files) && (!angular.isString(options.prefix) || !angular.isString(options.suffix)))) {
                throw new Error('Couldn\'t load static files, no files and prefix or suffix specified!');
            }

            if (!options.files) {
                options.files = [{
                    path: options.path,
                    prefix: options.prefix,
                    suffix: options.suffix
                }];
            }

            var load = function (file) {
                if (!file || (!angular.isString(file.prefix) || !angular.isString(file.suffix))) {
                    throw new Error('Couldn\'t load static file, no prefix or suffix specified!');
                }

                var fileName = [
                    file.prefix,
                    options.key,
                    file.suffix
                ].join('');

                console.log('>>>> file.path: ' + file.path);
                console.log('>>>> cordova.file === undefined?: ' + (cordova.file === undefined));
                console.log('>>>> fileName: ' + fileName);

                if (cordova.file !== undefined) {
                    file.path = eval(file.path);
                }

                return $cordovaFile.readAsText(file.path, fileName).then(function (result) {
                    //console.log('>>>> load result: ' + JSON.stringify(result));
                    return JSON.parse(result);
                }, function () {
                    $q.reject(options.key);
                });
            };

            var promises = [],
                length = options.files.length;

            for (var i = 0; i < length; i++) {
                promises.push(load({
                    path: options.files[i].path,
                    prefix: options.files[i].prefix,
                    key: options.key,
                    suffix: options.files[i].suffix
                }));
            }

            return $q.all(promises).then(function (data) {
                var length = data.length,
                    mergedData = {};

                for (var i = 0; i < length; i++) {
                    for (var key in data[i]) {
                        mergedData[key] = data[i][key];
                    }
                }

                return mergedData;
            });
        };

    }

})();
