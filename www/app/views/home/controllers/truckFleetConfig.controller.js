(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('TruckFleetConfigController',
      function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                LocalCacheService, ForceClientService) {

        var vm           = this,
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
          //初始化叉车配置页面
          $scope.initTruckFleetConfig($stateParams.truckId);
        });

        $scope.initTruckFleetConfig = function (truckId) {
          ForceClientService.getForceClient().apexrest(
            '/TruckFleetService?truckId=' + truckId,
            'GET',
            null,
            {}, function callBack(res) {
              console.log(res);
            }, function error(msg) {
              console.log(msg);
            });
        };

        /**
         * back to pre page
         */
        $scope.goBack = function () {
          window.history.back();
        };
      });

})();
