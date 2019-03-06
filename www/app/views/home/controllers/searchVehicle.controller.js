(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('SearchVehicleController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService,
                ForceClientService, LocalCacheService) {

        $scope.truckFleetItems = [];
        $scope.searchAcctText = '';
        $scope.getTruckFleet = '/TruckFleetService?acctId=';

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

          AppUtilService.showLoading();

          ForceClientService.getForceClient().apexrest(
            $scope.getTruckFleet + $stateParams.acctId,
            'GET',
            {},
            null,
            function callBack(res) {

              AppUtilService.hideLoading();

              $scope.truckFleetItems = res;
              console.log(res);
            },
            function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg);
            }
          );

        });

        $scope.searchChange = function () {

        };

        $scope.getAccts = function (keyWord) {

          AppUtilService.showLoading();

          ForceClientService.getForceClient().apexrest(
            $scope.getTruckFleet + $stateParams.acctId + '&keyword=' + keyWord,
            'GET',
            {},
            null,
            function callBack(res) {

              AppUtilService.hideLoading();

              $scope.truckFleetItems = res;
              console.log(res);
            },
            function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg);
            }
          );
        };

        $scope.selectAccount = function (acct) {
          LocalCacheService.set('vehicle', acct);
          window.history.back();
        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
