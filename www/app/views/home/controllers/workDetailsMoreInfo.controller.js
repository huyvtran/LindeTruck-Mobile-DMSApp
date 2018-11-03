angular.module('oinio.workDetailsMoreInfoController', [])
    .controller('workDetailsMoreInfoController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                                                   LocalCacheService) {

        var vm = this,
            selectTruckIds=[],

            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            console.log("$stateParams.truckItemAll", $stateParams.truckItemAll);
            console.log("$stateParams.chooseTruckArray", $stateParams.chooseTruckArray);
            $scope.truckItems =JSON.parse($stateParams.chooseTruckArray);
            
        });


        $scope.$on('$ionicView.enter', function () {
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }

        });

        $scope.goBack = function () {
            window.history.back();
        };

        $scope.goSave = function () {
            $state.go("app.workDetails",{truckItemTotal:JSON.stringify($scope.truckItems)});
        };

    });

