(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('SearchCustomerController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService,
                ForceClientService, LocalCacheService) {

        $scope.contentItems = [];
        $scope.searchAcctText = '';
        $scope.getTruckFleetTransfer = '/TruckFleetTransferService?action=queryAcct&keyWord=';
        $scope.getAccount = '/AccountService?action=queryAcctNoSharing&keyWord=';

        $scope.searchChange = function () {

        };

        $scope.getAccts = function (keyWord) {
          AppUtilService.showLoading();

          $scope.contentItems = [];
          if ($stateParams.customerType === 'getCustomer') {
            //常用配件
            ForceClientService.getForceClient().apexrest(
              $scope.getTruckFleetTransfer + keyWord + '&limitStr=',
              'GET',
              {},
              null,
              function callBack(res) {

                AppUtilService.hideLoading();

                $scope.contentItems = res;
                console.log(res);
              },
              function error(msg) {
                AppUtilService.hideLoading();
                console.log(msg);
              }
            );
          } else {
            //常用配件
            ForceClientService.getForceClient().apexrest(
              $scope.getAccount + keyWord + '&limitStr=',
              'GET',
              {},
              null,
              function callBack(res) {

                AppUtilService.hideLoading();

                $scope.contentItems = res;
                console.log(res);
              },
              function error(msg) {
                AppUtilService.hideLoading();
                console.log(msg);
              }
            );
          }
        };

        $scope.selectAccount = function (acct) {
          if ($stateParams.customerType === 'getCustomer') {
            LocalCacheService.set('getCustomerInfo', acct);
          } else {
            LocalCacheService.set('outCustomerInfo', acct);
          }
          window.history.back();
        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
