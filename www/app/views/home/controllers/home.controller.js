angular.module('oinio.controllers', [])
    .controller('HomeController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService) {

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
            // set current user in header
            var cachedUser = LocalCacheService.get('currentUser');

            if (cachedUser) {
                vm.username = cachedUser.Name;
            }
        });

        this.toRepair1 = function () {
            console.log("toRepair1");
            $state.go('app.repair1');
          }
         this.toRepair2 = function () {
            console.log("toRepair2");
            $state.go('app.repair2');
          }

        this.toDiscovery = function () {
            console.log("toDiscovery");
            $state.go('app.discovery');
        }

    });
    
        