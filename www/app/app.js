/**
 * Init first time App is running
 */
(function () {

    'use strict';

    var oinio = angular.module('oinio',
        [
            'ionic',
            'ionic-material',
            'ui.router',
            'ngCordova',
            'angular-svg-round-progressbar',
            'pascalprecht.translate',
            'angular-md5',
            'nvd3',
            'angularMoment',
            'oinio.settings',
            'oinio.configuration',
            'oinio.common.touch-id',
            'oinio.common.sliding-tabs',
            'oinio.common.login',
            'oinio.common.message-center',
            'oinio.common.navigation',
            'oinio.common.synchronize',
            'oinio.common.ionicloading',
            'oinio.common.user-setting',
            'oinio.common.directives',
            'oinio.common.filter',
            'oinio.common.camera',
            'oinio.common.services',
            'oinio.common.lookup',
            'oinio.core',
            'oinio.core.error',
            'oinio.core.logger',
            'oinio.core.object-home',
            'oinio.core.pageLayoutRenderer',
            'oinio.core.modal',
            'oinio.core.detail',
            'oinio.core.components',
            'oinio.services',

            'oinio.controllers',//add your custom module from here
            'oinio.MainController',
            'oinio.CalendarController',
            'oinio.GroupController',
            'oinio.PersonalController',
            'oinio.Search_1controllers',
            'oinio.CustomDetailController'
            
        ]);

    oinio.run(function runApp($rootScope, $state, $log, $ionicNavBarDelegate, $ionicPlatform, $filter, APP_SETTINGS, IonicLoadingService, SalesforceLoginService,
                              LoginService, LocalCacheService, SmartStoreService, MetaService, TouchIdService,
                              LocalDataService, $translate, LocalSyncService, LocalesService, ConnectionMonitor, FileService,
                              $ionicPopup, Logger, $injector, UserAssignmentService) {

        console.log('>>>> App is starting');

        if (APP_SETTINGS.DEBUG_ROUTING === true) {
            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                console.log('$stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
            });
            $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
                console.log('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
                console.log(unfoundState, fromState, fromParams);
            });
            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                console.log('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');

                if (toParams) { $rootScope.toParams = toParams; }
                if (fromParams) { $rootScope.fromParams = fromParams; }

                if (fromState) { $rootScope.fromState = fromState; }
                if (toState) { $rootScope.toState = toState; }

            });
            $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                console.log('$stateChangeError - fired when an error occurs during transition.' + JSON.stringify(error));
                console.log(arguments);
            });
            $rootScope.$on('$viewContentLoaded', function (event) {
                console.log('$viewContentLoaded - fired after dom rendered', event);
            });

            $rootScope.$on('$ionicView.beforeEnter', function () {
                $rootScope.$broadcast('UPDATE_SMART_CONNECTOR_COMPONENT');
            });
        }
//
        $ionicPlatform.ready(function () {

            ConnectionMonitor.startWatching();

            console.log('>>>> Device ready');

            // TODO This is bad style and very hackish. It is here to show a ionic popup instead of ugly alerts
            window.alert = function (content) {
                $log.error(content);
            };
            // ----------------------


            // it seems that the translation module is not available at this stage. Temporary hard coded text here
            IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                '<br/><span>Preparing Application</span>', false);

            // set the theme class for login
            if (APP_SETTINGS.DARK_THEME === true) {
                $rootScope.themeClass = 'theme-dark';
            }
            else {
                $rootScope.themeClass = 'theme-light';
            }

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.disableScroll(false);
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            }

            // OAuth loign in Salesforce //
            SalesforceLoginService.oauthLogin(function () {

                Logger.initializeLogSetting().then(function () {

                    $log.debug('>>>> oauth authentication succeeded');

                    var user = LocalCacheService.get('currentUser');

                    // refresh translation
                    $translate.use(user['LanguageLocaleKey']);

                    // checks whether all necessary folders are already created, if not, create them
                    FileService.initializeUserFolders().then(function () {

                        MetaService.soupInitialized().then(function (setupSoupDone) {

                            // if local soups not already set up, setup soups now
                            if (setupSoupDone === false) {
                                // setup global, framework and business ojbect soups
                                SmartStoreService.setupSoups().then(function (result) {
                                    $log.debug('>>>> setup soups done');

                                    IonicLoadingService.hide();

                                    // local login
                                    localLogin(true);
                                }, function (error) {
                                    // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                                    // hide spinner
                                    IonicLoadingService.hide();

                                    var alertPopup = $ionicPopup.alert({
                                        title: 'Initialization failed',
                                        template: 'Soups could not be setup. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                                    });

                                    alertPopup.then(function (result) {
                                        $log.debug('setupSoups failure ==> ' + error);
                                    });
                                });
                            } else {
                                // check if database should be dropped due to configuration changes
                                var dropDBOnVersionChange = APP_SETTINGS.DROP_DATABASE_ON_VERSION_CHANGE;

                                var utilService = $injector.get('UtilService');
                                utilService.checkAppVersionChanged().then(function (changed) {
                                    if (changed && dropDBOnVersionChange) {

                                        IonicLoadingService.hide();

                                        var alertPopup = $ionicPopup.alert({
                                            title: 'Application Update',
                                            template: 'Application needs to be updated. All not synchronized data will be uploaded to Salesforce and the App will be restarted.' +
                                            '<br/><br/>Please ensure a stable internet connection'
                                        });

                                        alertPopup.then(function () {
                                            IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                                                '<br/><span>Synchronizing</span>', false);

                                            // sync up all not synchronized records
                                            LocalSyncService.syncUpObjectByAll().then(function (done) {
                                                IonicLoadingService.hide();
                                            }).catch(function (error) {
                                            }).finally(function () {

                                                IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                                                    '<br/><span>Restart Application</span>', false);

                                                // drop business soups
                                                SmartStoreService.dropSoupByConfig(false, false, true).then(function () {

                                                    // restart app
                                                    var timeout = $injector.get('$timeout');
                                                    timeout(function () {
                                                        IonicLoadingService.hide();
                                                        window.location.reload();
                                                    }, 500);
                                                });
                                            });
                                        });
                                    } else {
                                        // reset soup spec by configuration include all framework soups.
                                        SmartStoreService.resetSoupSpecByConfig(true, false, true).then(function (result) {

                                            // soups already set up, go to local login
                                            $log.debug('>>>> soups already initialized');

                                            // if current user's language is changed, then setupSoups to refresh related data
                                            var currentUser = LocalCacheService.get('currentUser');
                                            if (currentUser && currentUser.isLanguageChanged) {
                                                $log.debug('>>>> user language changed, reload describeSObjects, describeLayouts, picklists, recordtypes');

                                                // reload describeSObjects, describeLayouts, picklists, recordtypes
                                                LocalSyncService.syncForLanguageChange().then(function () {
                                                    $log.debug('>>>> reloaded necessary information when user language changed');

                                                    // local login
                                                    localLogin(true);
                                                }, function (error) {
                                                    $log.debug('setupSoups error ' + error);
                                                });
                                            } else {
                                                localLogin(false);
                                            }
                                        }, function (error) {
                                            // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                                            // hide spinner
                                            IonicLoadingService.hide();

                                            var alertPopup = $ionicPopup.alert({
                                                title: 'Initialization failed',
                                                template: 'Soups could not be reset spec. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                                            });

                                            alertPopup.then(function (result) {
                                                $log.debug('reset soup spec failure ==> ' + error);
                                            });
                                        });
                                    }
                                });
                            }
                        }, function (error) {
                            // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                            // hide spinner
                            IonicLoadingService.hide();

                            var alertPopup = $ionicPopup.alert({
                                title: 'Initialization failed',
                                template: 'Soups could not be initialized. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                            });

                            alertPopup.then(function (result) {
                                $log.debug('soupInitialized failure ==> ' + error);
                            });
                        });
                    }, function (error) {
                        // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                        // hide spinner
                        IonicLoadingService.hide();

                        var alertPopup = $ionicPopup.alert({
                            title: 'Initialization failed',
                            template: 'User folder could not be initialized. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                        });

                        alertPopup.then(function (result) {
                            $log.debug('folerInitialized failure ==> ' + error);
                        });
                    });
                }, function (error) {
                    $log.debug('Initialized log setting error ' + error);
                });

            }, function (error) {
                // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                // hide spinner
                IonicLoadingService.hide();

                var alertPopup = $ionicPopup.alert({
                    title: 'Login failure',
                    template: 'Please ensure that you are connected to the internet and that your username and password are typed correctly. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                });

                alertPopup.then(function (result) {
                    $log.debug('oauth failure ==> ' + error);
                });
            });
        });

        var localLogin = function (skipReloadDescribe) {
            $log.debug('>>>> local login');

            // try to reload business translation before going into the page
            LocalDataService.loadBusinessDescribeSObjects(skipReloadDescribe).then(function () {

                var user = LocalCacheService.get('currentUser');

                // refresh translation
                $translate.use(user['LanguageLocaleKey']);

                // store the app version
                MetaService.setAppVersion();

                //get the locale information for the current user
                LocalesService.loadLocaleData(user.LocaleSidKey);

                if (user.hasOwnProperty('CurrencyIsoCode')) {
                    LocalesService.setCurrencyIsoCode(user.CurrencyIsoCode);
                }

                var platform = device.platform;

                // should the app have a local password?
                if (APP_SETTINGS.LOCAL_LOGIN === true) {

                    IonicLoadingService.hide();

                    LoginService.localUserExists(user.Username).then(function (exists) {
                        if (exists === true) {
                            if (APP_SETTINGS.TOUCH_ID === true && platform === 'iOS') {
                                // load Touch-ID Service
                                TouchIdService.touchId();
                            }
                            else {
                                // local password already set
                                $state.go('login');
                            }
                        }
                        else {
                            // no local password set already
                            $state.go('password');
                        }
                    }, function (error) {
                        // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                        // hide spinner
                        IonicLoadingService.hide();

                        var alertPopup = $ionicPopup.alert({
                            title: 'Initialization failed',
                            template: 'Local user does not exist. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                        });

                        alertPopup.then(function (result) {
                            $log.debug('appInitialized failure ==> ' + error);
                        });
                    });
                }
                else {
                    MetaService.appInitialized().then(function (initialized) {

                        IonicLoadingService.hide();

                        if (initialized === false) {
                            $state.go('synchronize');
                        }
                        else if (APP_SETTINGS.SYNCHRONIZE_AFTER_LOGIN === true && ConnectionMonitor.isOnline()) {
                            $state.go('synchronize');
                        }
                        else {
                            $state.go(APP_SETTINGS.START_VIEW);
                        }
                    }, function (error) {
                        // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                        // hide spinner
                        IonicLoadingService.hide();

                        var alertPopup = $ionicPopup.alert({
                            title: 'App initialization failure',
                            template: 'Could not initialize app. Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                        });

                        alertPopup.then(function (result) {
                            $log.debug('appInitialized failure ==> ' + error);
                        });
                    });
                }
            });
        };
    });

    oinio.service('AppUtilService', function ($filter, $ionicLoading) {

        var service = this;

        service.showLoading = function () {
            $ionicLoading.show({
                template: '<ion-spinner icon="ripple"></ion-spinner>' +
                '<br /><span>' + $filter('translate')('cl.global.msg_waitLoading') + '</span>'
            });
        };

        service.hideLoading = function () {
            $ionicLoading.hide();
        };
    });
})();
