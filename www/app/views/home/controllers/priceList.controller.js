(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('PriceListController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, ForceClientService,
                AppUtilService, LocalCacheService) {

        var oCurrentUser = LocalCacheService.get('currentUser') || {};

        $scope.queryList = '/ServiceQuoteOverviewService?action=queryList&userId=';
        $scope.priceListItems = [];
        $scope.priceListStatusItems = [];
        $scope.statusTypes = ['草稿', '等待审批', '拒绝', '等待客户确认', '赢单', '丢单', '关闭'];

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {
          AppUtilService.showLoading();
          //人工
          ForceClientService.getForceClient().apexrest($scope.queryList + oCurrentUser.Id, 'GET', {}, null,
            function (response) {
              console.log('success:', response);
              $scope.priceListItems = response;
              $scope.priceListStatusItems = response;
              AppUtilService.hideLoading();
            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();
            });
        });

        $scope.getStatusType = function (status) {
          if (status == 'Draft') {
            return '草稿';
          } else if (status == 'Waiting For Approval') {
            return '等待审批';
          } else if (status == 'Reject') {
            return '拒绝';
          } else if (status == 'Waiting For Customer') {
            return '等待客户确认';
          } else if (status == 'Win') {
            return '赢单';
          } else if (status == 'Lost') {
            return '丢单';
          } else if (status == 'Closed') {
            return '关闭';
          } else {
            return '等待审批';
          }
        };

        $scope.selectStatusChange = function (status) {

          var statusType = '';
          if (status == '草稿') {
            statusType = 'Draft';
          } else if (status == '等待审批') {
            statusType = 'Waiting For Approval';
          } else if (status == '拒绝') {
            statusType = 'Reject';
          } else if (status == '等待客户确认') {
            statusType = 'Waiting For Customer';
          } else if (status == '赢单') {
            statusType = 'Win';
          } else if (status == '丢单') {
            statusType = 'Lost';
          } else if (status == '关闭') {
            return 'Closed';
          }

          $scope.priceListStatusItems = _.filter($scope.priceListItems, function (statusItem) {
            return statusItem.Quotation_Status__c == statusType;
          });

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

        $scope.goToPriceListDetails = function (priceItem) {
          $state.go('app.priceDetail', {overviewId: priceItem.Id});
        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
