(function (angular) {

    'use strict';

    angular
        .module('oinio.common.synchronize')
        .controller('SynchronizeController', function ($state, $scope, $log, $timeout, $filter, LocalSyncService,
                                                       IonicLoadingService, $ionicScrollDelegate, $ionicPosition, MetaService, APP_SETTINGS, UserAssignmentService) {
            var vm = this;
            vm.sObjects = {};

            $scope.$on('$ionicView.enter', function () {

                // stop and reset time interval for mobile data synchronisation
                $scope.$emit('timer-stopped');

                function navigateToStart() {

                    // start time interval for mobile data synchronisation
                    $scope.$emit('timer-start');

                    $timeout(function () {
                        IonicLoadingService.hide();
                        $state.go(APP_SETTINGS.START_VIEW);
                    }, 2000);
                }

                MetaService.appInitialized().then(function (initialized) {
                    console.log('>>>> synchronization initialized: ' + initialized);

                    var option = {
                        appInitialized: initialized
                    };

                    LocalSyncService.syncBusinessSObjects(option).then(function () {
                        $log.debug('>>>> synchronization finished');

                        // set initialized flag
                        if (!initialized) {
                            MetaService.setAppInitialized();
                        }

                        IonicLoadingService.show($filter('translate')('cl.sync.lb_sync_done'));

                        UserAssignmentService.cleanupForUserAssignment().then(function () {
                            $log.debug('user assignment updated');
                            navigateToStart();
                        }, function (error) {
                            $log.error('error while updating user assignment');
                            navigateToStart();
                        });

                    }, function (error) {
                        $log.debug('ERROR in SynchronizeController: ' + error);

                        if (error === 'OFFLINE') {
                            IonicLoadingService.show($filter('translate')('cl.sync.lb_sync_offline'));
                            navigateToStart();
                        }
                    }, function (notify) {
                        // Set Objects for the HTML-View
                        vm.sObjects.syncDown = notify.syncDownObjects.syncProgress;

                        if (typeof notify.progress !== 'undefined' && typeof notify.progress === 'object') {
                            vm.getProgressData = function () {
                                return {
                                    name: notify.progress.name,
                                    total: notify.progress.status.total,
                                    processed: notify.progress.status.processed,
                                    done: notify.progress.status.done,
                                    status: notify.progress.status
                                };
                            };

                            $scope.$watch(vm.getProgressData, function (newValue, oldValue) {
                                if (newValue.name !== oldValue.name) {
                                    if (true === oldValue.done && newValue.total > 0) {
                                        $timeout(function () {
                                            var oItemPosition = $ionicPosition.position(angular.element(document.getElementById(newValue.name)));
                                            $ionicScrollDelegate.$getByHandle('progressScroll').scrollTo(0, oItemPosition.top, true);
                                        }, 100);
                                    }
                                }
                            }, true);
                        }

                        if (typeof notify.reference !== 'undefined' && typeof notify.reference === 'object') {
                            vm.getReferenceData = function () {
                                return {
                                    name: notify.reference.name,
                                    total: notify.reference.status.referenceTotal,
                                    done: notify.reference.status.done
                                };
                            };

                            $scope.$watch(vm.getReferenceData, function (newValue, oldValue) {
                                if (newValue.name !== oldValue.name) {
                                    if (true === oldValue.done && newValue.total > 0) {
                                        $timeout(function () {
                                            var oItemPosition = $ionicPosition.position(angular.element(document.getElementById(newValue.name)));
                                            $ionicScrollDelegate.$getByHandle('synchronizeScroll').scrollTo(oItemPosition.left, oItemPosition.top, true);
                                        }, 100);
                                    }
                                }
                            }, true);
                        }
                    });
                }, function (error) {
                    error.method = 'SynchronizeController';
                    $log.error(error);
                });
            });
        });
})(angular);
