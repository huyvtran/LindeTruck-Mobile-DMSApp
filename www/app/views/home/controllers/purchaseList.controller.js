(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('PurchaseListController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, ForceClientService,
                AppUtilService, Service1Service, LocalCacheService) {

        $scope.purchaseListItems = [];
        $scope.purchaseListStatusItems = [];
        $scope.statusTypes = ['草稿', '审核中', '审核通过', '完成'];

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {
          AppUtilService.showLoading();

          Service1Service.getProcurementInfoList().then(function (response) {
            AppUtilService.hideLoading();
            $scope.purchaseListItems = response;
            $scope.purchaseListStatusItems = response;
            console.log('response', response);
          }, function (error) {
            AppUtilService.hideLoading();
            console.log('error', error);
          })

        });

        $scope.getStatusType = function (status) {
          if (status == 'Draft') {
            return '草稿';
          } else if (status == 'Approved') {
            return '审核通过';
          } else if (status == 'Approving') {
            return '审核中';
          } else if (status == 'Completed') {
            return '完成';
          } else {
            return '等待审批';
          }
        };

        $scope.selectStatusChange = function (status) {

          var statusType = '';
          if (status == '草稿') {
            statusType = 'Draft';
          } else if (status == '审核通过') {
            statusType = 'Approved';
          } else if (status == '审核中') {
            statusType = 'Approving';
          } else if (status == '完成') {
            statusType = 'Completed';
          }

          $scope.purchaseListStatusItems = _.filter($scope.purchaseListItems, function (statusItem) {
            return statusItem.Status__c == statusType;
          });

        };

        $scope.goToPriceListDetails = function (priceItem) {
          $state.go('app.purchaseDetail', {overviewId: priceItem.Id});
        };

        $scope.goToWorkDetails = function (priceItem) {
          if (priceItem.Service_Order_Overview__r) {
            $state.go('app.workDetails', {
              SendInfo: priceItem.Service_Order_Overview__r.Id,
              workDescription: null,
              AccountShipToC: null,
              workOrderId: priceItem.Service_Order_Overview__r.Id,
              enableArrivalBtn: null,
              goOffTime: null,
              isNewWorkList: true,
              accountId: null,
              orderBelong: null
            });
          }
        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
