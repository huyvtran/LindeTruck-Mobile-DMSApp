angular.module('oinio.controllers', [])
    .controller('HomeController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
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
        $scope.items = ["Chinese","English","Russian","Japanese"];

        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            // set current user in header
            var cachedUser = LocalCacheService.get('currentUser');

            if (cachedUser) {
                vm.username = cachedUser.Name;
            }
            $ionicTabsDelegate.select(1);
        });

        $scope.toRepair1 = function () {
            console.log("search_1");
            $state.go('app.search_1');
        }
         
        
        //   $scope.toRepair3 = function (){
        //     console.log("toRepair3");
        //     $state.go('app.customDetail');
        //   };
    });
    
        