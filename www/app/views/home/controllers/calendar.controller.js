angular.module('oinio.CalendarController', [])
    .controller('CalendarController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
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
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
        });

        $scope.toRepair1 = function () {
            console.log("search_1");
            $state.go('app.search_1');
        }
    });

