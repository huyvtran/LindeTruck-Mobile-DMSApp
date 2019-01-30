(function () {
    'use strict';



});

angular.module('oinio.MainController', [])
    .controller('MainController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,$ionicTabsDelegate,TimeCardService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;
        cordova.plugins.backgroundMode.on('activate', function () {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();

        });
        cordova.plugins.backgroundMode.setEnabled(true);
        // cordova.plugins.backgroundMode.overrideBackButton();
        var firstIntoApp = true;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            if (firstIntoApp) {
                $ionicTabsDelegate.select(1);
                firstIntoApp = false;
            }
            console.log("mainController.$ionicView.beforeEnter");
            TimeCardService.fetchVersionInfo();

        });

        $scope.addNewLinkMan = function () {
            $state.go('app.newLinkMan');
        };

        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log("mainController.$ionicView.enter");
        });

    });

