angular.module('oinio.SendMorePeopleController', [])
    .controller('SendMorePeopleController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,
                                                      ConnectionMonitor, LocalCacheService,ForceClientService) {
        $scope.getInitDataUri="/WorkDetailService";
        $scope.$on('$ionicView.beforeEnter', function () {
            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);



        });

        $scope.$on('$ionicView.enter', function () {
            console.log("$stateParams.workOrderId",$stateParams.workOrderId);
        });


        $scope.goBack=function () {
          window.history.back();
        };

        $scope.submit=function () {

        };

    });
