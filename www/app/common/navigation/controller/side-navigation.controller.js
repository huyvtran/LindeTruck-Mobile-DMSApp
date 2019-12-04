(function () {

    'use strict';

    angular.module('oinio.common.navigation')
        .controller('SideNavigationController', function ($scope, $rootScope, $filter, $ionicPopup, $ionicSideMenuDelegate,
            $log, $ionicActionSheet, $cordovaAppVersion, $timeout, LocalCacheService,
            ModalService, APP_SETTINGS, $state, TouchIdService, LoginService,
            LocalDataService, LocalSyncService, IonicLoadingService,
            ConnectionMonitor, UserAssignmentService,$cordovaFile) {
            var vm = this;
            var myTimeout = null;
            var isCountDown = false;
            vm.objectNavigators = [];
            vm.showMessageCenter = true;
            vm.user = null;
            vm.username = '';
            vm.version = '';
            vm.isOnline = null;
            vm.isMOnline = true;
            $scope.onoffline = true;
            // set timer defined default value
            $scope.timer = APP_SETTINGS.SYNCHRONIZE_TIME_INTERVAL;

            $scope.toggleLeft = function () {
                $ionicSideMenuDelegate.toggleLeft();
            };

            /**
             * @desc Returns JSON's help section for application parts where user is currently in
             *
             * @author kacperSlotwinski
             */
            function helpHintMap() {
                var ret = 'none';
                switch ($rootScope.toState.name) {
                    case 'app.user-setting':
                        ret = 'settings';
                        break;
                    case 'app.home':
                        ret = 'home';
                        break;
                    case 'app.job-queue':
                        ret = 'job-queue';
                        break;
                    case 'app.jobDetails':
                        ret = 'jobDetails';
                        break;
                    case 'app.steps':
                        ret = 'jobSteps';
                        break;
                    case 'app.welding-step':
                        ret = 'welding-step';
                        break;
                    case 'app.process-step':
                        ret = 'process-step';
                        break;
                    case 'app.qa-step':
                        ret = 'qa-step';
                        break;
                    case 'app.resourcelist':
                        ret = 'resourceList';
                        break;
                    case 'app.resourcedetail':
                        var resType = $rootScope.toParams.field;
                        if (resType === 'AssignedAsset__c') {
                            ret = 'resourceWelding';
                        }
                        else if ((resType === 'AssignedGas__c') || (resType === 'AssignBackGas__c') || (resType === 'AssignedGas3__c')) {
                            ret = 'resourceGas';
                        }
                        else if ((resType === 'AssignCons1__c') || (resType === 'AssignCons2__c')) {
                            ret = 'resourceConsum';
                        }
                        else if (resType === 'AssignFlux__c') {
                            ret = 'resourceFlux';
                        }
                        break;
                    case 'app.reports':
                        ret = 'reports';
                        break;
                    case 'app.report':
                        var repType = $rootScope.toParams.sid;
                        if (repType === '1') {
                            ret = 'reportsOverdue';
                        }
                        else if (repType === '2') {
                            ret = 'reportsIssues';
                        }
                        else if (repType === '3') {
                            ret = 'qualifications';
                        }
                        else if (repType === '4') {
                            ret = 'machines';
                        }
                        break;
                    case 'app.projects':
                        ret = 'projects';
                        break;

                }
                vm.showHelpMenu = ret === 'none' ? false : true;
                return ret;
            }

            function setupNavigators() {
                LocalDataService.getConfiguredObjects().then(function (objects) {
                    vm.objectNavigators = [];
                    if (objects && objects.length) {
                        angular.forEach(objects, function (obj) {
                            if (obj['MobileVizArt__Use_Navigation__c'] === true) {
                                vm.objectNavigators.push({
                                    name: obj.Name,
                                    label: $filter('translate')(obj.Name + '.labelPlural')
                                });
                            }
                        });
                    }

                    vm.objectNavigators.sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                });
            }

            /**
             * @function     showMessageToSync
             * @description  description
             *
             * @author       pierregrossmann
             */
            function showMessageToSync() {
                var savePopup = $ionicPopup.show({
                    title: $filter('translate')('cl.sync.msg_popup_sync_to_receive_update'),
                    buttons: [
                        {
                            text: $filter('translate')('cl.sync.btn_postpone'),
                            type: 'button-cancel',
                            onTap: function () {
                                savePopup.close();

                                $timeout(function () {
                                    // restart timer
                                    $scope.startTimer();
                                }, 1000);
                            }
                        },
                        {
                            text: $filter('translate')('cl.sync.btn_sync_now'),
                            type: 'button-positive',
                            onTap: function () {
                                savePopup.close();

                                vm.synchronize();
                            }
                        }
                    ]
                });
            }

            $scope.$on('$ionicView.enter', function () {
                vm.isOnline = ConnectionMonitor.isOnline();
                if (!vm.user) {
                    vm.user = LocalCacheService.get('currentUser');
                }

                if (vm.user) {
                    vm.username = vm.user.Username;

                    if ((vm.user.hasOwnProperty('Use_Message_Center__c') && vm.user['Use_Message_Center__c'] === true) || vm.username.indexOf('jens.siffermann') !== -1) {
                        vm.showMessageCenter = true;
                    }
                }

                if ($cordovaAppVersion) {
                    $cordovaAppVersion.getVersionNumber().then(function (version) {
                        vm.version = version;
                    });
                }

                setupNavigators();

                vm.showHelpMenu = false;
                vm.helpSection = helpHintMap();

                // If synchronize after time interval && isCountDown "false"
                if (APP_SETTINGS.SYNCHRONIZE_AFTER_TIME_INTERVAL === true && isCountDown === false) {
                    $scope.startTimer();
                    isCountDown = true;
                }
            });

            $scope.changeOnOffLine = function(){

                if ($scope.onoffline){
                    $scope.onoffline = false;
                    vm.newRefreshAllData();
                    localStorage.setItem("onoffline",0)

                }else {
                    $scope.onoffline = true;
                    localStorage.setItem("onoffline",1)

                }

                console.log('>>>> $scope.onoffline',$scope.onoffline);
                console.log('>>>> get--onoffline',localStorage.onoffline);
                vm.isMOnline = $scope.onoffline;
            };
            /**
             * @desc show smartstore inspector
             */
            vm.showInspector = function () {
                cordova.require('com.salesforce.plugin.smartstore').showInspector();
            };

            /**
             * @desc logout current user and drop database
             */
            vm.logout = function () {
                // should the app have a local password?
                if (APP_SETTINGS.LOCAL_LOGIN === true) {

                    // stop and destroy time interval for mobile data synchronisation
                    $scope.$broadcast('timer-stopped', 'destroy-timer');

                    //Local logout doesn't need to confirm as no impact would be on this action
                    if (vm.user === null) {
                        vm.user = LocalCacheService.get('currentUser');
                    }

                    var platform = device.platform;

                    LoginService.localUserExists(vm.user.Username).then(function (exists) {
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
                    });
                } else {
                    vm.logoutAndDrop();
                }
            };

            /**
             * @desc
             */
            vm.helpHint = function () {

                ModalService.show(
                    'app/common/navigation/templates/modal/side-navigation.help-details.view.html',
                    'SideNavigationHelpModalController as vm', {
                        //backURL: $rootScope.toState.name
                        helpSection: vm.helpSection
                    });
            };

            /**
             * @desc logout and drop database
             */
            vm.logoutAndDrop = function () {

                // Show the action sheet
                $ionicActionSheet.show({
                    buttons: [
                        { text: $filter('translate')('cl.global.btn_yes') }
                    ],
                    titleText: $filter('translate')('cl.global.msg_logoutAndDropDatabase'),
                    cancelText: $filter('translate')('cl.global.btn_cancel'),
                    cancel: function () {
                        return false;
                    },
                    buttonClicked: function () {

                        localStorage.setItem("firstLogin", "last"); //初次存储
                        //console.log('buwen::$cordovaFile::',$cordovaFile);
                        let path = cordova.file.dataDirectory;
                        $cordovaFile.createFile(path, "isNeedLevel2Login.txt", true).then(function (success) {
                            console.log('createFile::success::',success);
                            $cordovaFile.writeFile(path, "isNeedLevel2Login.txt", "isNeedLevel2Login", true)
                                .then(function (writesuccess) {
                                    console.log('writesuccess::success::',writesuccess);
                                    $cordovaFile.readAsText(path, "isNeedLevel2Login.txt").then(function (result) {
                                        console.log('readAsText::result::',result);
                                        //return JSON.parse(result);

                                        // stop and destroy time interval for mobile data synchronisation
                                        $scope.$broadcast('timer-stopped', 'destroy-timer');
                                        cordova.require('com.salesforce.plugin.sfaccountmanager').logout();
                                    }, function (error2) {
                                        console.log('readAsText::error2::',error2);
                                    });
                                }, function (writeerror) {
                                    console.log('writesuccess::writeerror::',writeerror);
                                });

                        }, function (error) {
                            console.log('createFile::error::',error);
                        });


                    }
                });
            };

            vm.newRefreshAllData = function () {

                $state.go('synchronize',{isNeededSync:true});
            };

            /**
             * @function    onTimeout
             * @description The timer is running in seconds and stops at zero.
             */
            $scope.onTimeout = function () {
                if ($scope.timer === 0) {
                    // send $broadcast event "timer-stopped" with remaining time
                    $scope.$broadcast('timer-stopped', 0);
                    return;
                }
                $scope.timer--;

                myTimeout = $timeout($scope.onTimeout, 1000);
            };

            /**
             * @function startTimer
             */
            $scope.startTimer = function () {
                myTimeout = $timeout($scope.onTimeout, 1000);
            };

            /**
             * @description Once the event is broadcast via "timer-stopped" receives the synchronization process is
             *              started when the device "online". Otherwise the timer will be reset or the timer is
             *   completely destroyed.
             */
            $scope.$on('timer-stopped', function (event, data) {
                // cancel $timeout
                $timeout.cancel(myTimeout);
                // set timer back to defined default value
                $scope.timer = APP_SETTINGS.SYNCHRONIZE_TIME_INTERVAL;

                if (data === 0) {
                    if (ConnectionMonitor.isOnline()) {
                        // showMessageToSync(); //推迟
                    } else {
                        // start time interval for mobile data synchronisation
                        $scope.startTimer();
                    }
                } else if (data === 'destroy-timer') {
                    isCountDown = false;
                }
            });

            $scope.$on('timer-start', function (event, data) {
                // start time interval for mobile data synchronisation
                $scope.startTimer();
            });

            /**
             * synchronize data
             */
            vm.synchronize = function () {
                if (ConnectionMonitor.isOnline()) {

                    IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));

                    LocalSyncService.syncBusinessSObjects().then(function (promise) {
                        $log.debug('>>>> synchronization finished');

                        if (promise) {
                            IonicLoadingService.show($filter('translate')('cl.sync.lb_sync_done'));
                        }
                    }, function (error) {
                        $log.debug('ERROR in SynchronizeController: ' + error);

                        if (error === 'OFFLINE') {
                            IonicLoadingService.show($filter('translate')('cl.sync.lb_sync_offline'));
                        }
                    }).finally(function () {

                        // cleanup and reload user assignment
                        UserAssignmentService.cleanupForUserAssignment()
                            .then(function () {
                                $log.debug('user assignment updated');
                            })
                            .catch(function (error) {
                                $log.error('error while updating user assignment');
                            })
                            .finally(function () {
                                $timeout(function () {
                                    // restart timer
                                    $scope.startTimer();

                                    IonicLoadingService.hide();
                                }, 2000);
                            });
                    });
                }
                else {
                    IonicLoadingService.show($filter('translate')('cl.sync.lb_sync_offline'));

                    $timeout(function () {
                        IonicLoadingService.hide();
                    }, 2000);
                }
            };
        });
})();
