angular.module('oinio.RefundController', [])
    .controller('RefundController', function ($scope, $rootScope, $filter, $state, $ionicHistory,$stateParams, ConnectionMonitor,
                                                LocalCacheService) {

        $scope.selectRefundInfo = [];
        
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

        

        });
        $scope.$on('$ionicView.enter', function () {
            $scope.selectRefundInfo = $stateParams.refundInfo;
            console.log("$scope.selectRefundInfo:",$scope.selectRefundInfo);
        });

        $scope.goBackgw = function () {
            // window.history.back();
            $ionicHistory.goBack();
        };
    });

