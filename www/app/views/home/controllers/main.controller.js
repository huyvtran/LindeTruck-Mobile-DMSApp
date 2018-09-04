(function () {
    'use strict';



});

angular.module('oinio.MainController', [])
    .controller('MainController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,$ionicTabsDelegate) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;
        cordova.plugins.backgroundMode.on('activate', function () {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();

        });
        cordova.plugins.backgroundMode.setEnabled(true);
        // cordova.plugins.backgroundMode.overrideBackButton();
    
  
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            $ionicTabsDelegate.select(1);
            console.log("mainController.$ionicView.beforeEnter");

        });
        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log("mainController.$ionicView.enter");
        });

    });

