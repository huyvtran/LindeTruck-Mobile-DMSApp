(function () {
    'use strict';



});

angular.module('oinio.MainController', [])
    .controller('MainController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,$ionicTabsDelegate) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        });
        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            $ionicTabsDelegate.select(1);
        });
    });

