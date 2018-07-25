(function () {

    'use strict';

    angular
        .module('oinio.common.user-setting')
        .controller('UserSettingController', UserSettingController);

    function UserSettingController($scope, $state, $ionicActionSheet, $filter, $cordovaAppVersion, $log, $injector,
                                   LocalCacheService, APP_SETTINGS, FileService, IonicLoadingService, $window, Exception, EXCEPTION_SEVERITY) {
        var vm = this;

        /**
         * @desc get username from current user
         * @type {*|string}
         */
        vm.user = LocalCacheService.get('currentUser').Username;
        vm.version = '...';

        vm.lastSyncDate = '...';

        vm.local = false;
        if (APP_SETTINGS.LOCAL_LOGIN === true) {
            vm.local = true;
        }

        vm.showSyncLogfiles = false;

        // Triggered on a button click, or some other target
        vm.showNote = function () {

            // Show the action sheet
            $ionicActionSheet.show({
                buttons: [
                    {text: 'Yes, I want to switch users.'}
                ],
                titleText: 'You sure you want to switch users?',
                cancelText: 'Cancel',
                cancel: function () {
                    return false;
                },
                buttonClicked: function () {
                    $state.go('app.switch-user');
                }
            });
        };

        // When user click "Log out"
        vm.logout = function () {
            //Disconnect from SmartConnector
            $injector.get('SmartConnectorService').disconnectSmartConnector().then(function () {
                $log.info('SwitchUserController loginAsNewUser: SmartConnector disconnected');
            }).finally(function () {
                // should the app have a local password?
                if (APP_SETTINGS.LOCAL_LOGIN === true) {

                    // stop and destroy time interval for mobile data synchronisation
                    $scope.$emit('timer-stopped', 'destroy-timer');

                    var user = LocalCacheService.get('currentUser');

                    var platform = device.platform;

                    $injector.get('LoginService').localUserExists(user.Username).then(function (exists) {
                        if (exists === true) {
                            if (APP_SETTINGS.TOUCH_ID === true && platform === 'iOS') {
                                // load Touch-ID Service
                                $injector.get('TouchIdService').touchId();
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
                    });
                } else {
                    logoutAndDrop();
                }
            });
        };

        function logoutAndDrop() {

            // Show the action sheet
            $ionicActionSheet.show({
                buttons: [
                    {text: $filter('translate')('cl.global.btn_yes')}
                ],
                titleText: $filter('translate')('cl.global.msg_logoutAndDropDatabase'),
                cancelText: $filter('translate')('cl.global.btn_cancel'),
                cancel: function () {
                    return false;
                },
                buttonClicked: function () {
                    // stop and destroy time interval for mobile data synchronisation
                    $scope.$emit('timer-stopped', 'destroy-timer');
                    cordova.require('com.salesforce.plugin.sfaccountmanager').logout();
                }
            });
        }

        // Find the latest sync date
        var runSQL = function (sql, size) {
            var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, size);
            navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                    var lastSyncDate = 0, itemSyncDate;

                    var localesService = $injector.get('LocalesService');
                    for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                        var item = cursor.currentPageOrderedEntries[i];
                        itemSyncDate = item[1].lastSyncDownDate;
                        if (itemSyncDate > lastSyncDate) {
                            lastSyncDate = itemSyncDate;
                        }
                    }

                    vm.lastSyncDate = $filter('date')(itemSyncDate, localesService.getDateTimeFormat(), timeZoneToISOoffset());
                }
            }, function (err) {
                vm.lastSyncDate = 'Check with error';
            });
        };

        // Convert time zone javascript to time offset
        var timeZoneToISOoffset = function () {
            var userTZ = new Date().getTimezoneOffset();
            var offsetprefix;

            //offset works opposite direction
            offsetprefix = userTZ < 0 ? '+' : '-';
            userTZ = Math.abs(userTZ);

            var hours = Math.trunc(userTZ / 60);
            var minutes = userTZ % 60;

            minutes = minutes < 10 ? '0' + minutes : minutes;
            hours = hours < 10 ? '0' + hours : hours;

            var ret = offsetprefix + hours + minutes;
            //protection if there is something wrong with timezone offset
            ret = ret.length == 5 ? ret : '+0000';

            return ret;
        };

        $scope.$on('$ionicView.enter', function () {
            runSQL('select * from {_objectMeta}', 100);

            if ($cordovaAppVersion) {
                $cordovaAppVersion.getVersionNumber().then(function (version) {
                    vm.version = version;
                });
            }

            // check if log files are available for upload
            FileService.checkLogFolderEmpty().then(function (result) {
                if (result) {
                    vm.showSyncLogfiles = true;
                }
            });
        });

        /**
         * synchronize data
         */
        vm.synchronize = function () {

            var ionicLoadingService = $injector.get('IonicLoadingService');
            ionicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));

            var timeout = $injector.get('$timeout');

            if ($injector.get('ConnectionMonitor').isOnline()) {
                $injector.get('LocalSyncService').syncBusinessSObjects().then(function (promise) {
                    $log.debug('>>>> synchronization finished');

                    if (promise) {
                        ionicLoadingService.show($filter('translate')('cl.sync.lb_sync_done'));
                    }
                }, function (error) {
                    $log.debug('ERROR in SynchronizeController: ' + error);

                    if (error === 'OFFLINE') {
                        ionicLoadingService.show($filter('translate')('cl.sync.lb_sync_offline'));
                    }
                }).finally(function () {
                    timeout(function () {
                        // restart timer
                        $scope.startTimer();

                        ionicLoadingService.hide();
                    }, 2000);
                });
            }
            else {
                ionicLoadingService.show($filter('translate')('cl.sync.lb_sync_offline'));

                timeout(function () {
                    ionicLoadingService.hide();
                }, 2000);
            }
        };

        /**
         * synchronize log files to salesforce
         */
        vm.synchronizeLogfiles = function () {
            FileService.checkLogFolderEmpty().then(function (result) {
                if (result) {

                    // show spinner
                    IonicLoadingService.show('<ion-spinner icon="ripple" style="stroke: #ffffff; fill: #ffffff"></ion-spinner>' +
                        '<br/><span>' + $filter('translate')('cl.sync.lb_synchronizing') + '</span>', false);

                    FileService.sendLogFileToSalesforce().then(function () {
                        IonicLoadingService.hide();

                        $window.plugins.toast.showWithOptions({
                            message: $filter('translate')('cl.sync.lb_sync_done'),
                            duration: 2000,
                            position: 'bottom',
                            styling: {
                                opacity: 1.0, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
                                backgroundColor: '#54698d', // make sure you use #RRGGBB. Default #333333
                                textColor: '#FFFFFF', // Ditto. Default #FFFFFF
                                textSize: 13, // Default is approx. 13.
                                cornerRadius: 4, // minimum is 0 (square). iOS default 20, Android default 100
                                horizontalPadding: 24, // iOS default 16, Android default 50
                                verticalPadding: 12 // iOS default 12, Android default 30
                            }
                        });
                    }, function (error) {
                        $log.error('Save log to salesforce failed', error);

                        if (error && typeof error.handle === 'function') {
                            error.retry = vm.synchronizeLogfiles;
                            error.cancel = function () {
                            };
                            error.handle();
                        } else {
                            new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, error.message, error.stack, error).handle();
                        }
                    });
                } else {
                    $window.plugins.toast.showWithOptions({
                        message: $filter('translate')('cl.sync.lb_no_logfiles'),
                        duration: 2000,
                        position: 'bottom',
                        styling: {
                            opacity: 1.0, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
                            backgroundColor: '#54698d', // make sure you use #RRGGBB. Default #333333
                            textColor: '#FFFFFF', // Ditto. Default #FFFFFF
                            textSize: 13, // Default is approx. 13.
                            cornerRadius: 4, // minimum is 0 (square). iOS default 20, Android default 100
                            horizontalPadding: 24, // iOS default 16, Android default 50
                            verticalPadding: 12 // iOS default 12, Android default 30
                        }
                    });
                }
            }, function (error) {
                $log.error('SaveLogToSF error occurs: ' + JSON.stringify(error));
            });
        };
    }
})();
