angular.module('oinio.deliveryListController', [])
  .controller('deliveryListController', function ($scope, $state, $stateParams ,ForceClientService ,AppUtilService) {
    $scope.nowSendRefund = [];
    $scope.getDeliveryOrder = "/DeliverOrderService?action=queryAll";
    $scope.rejectedItems = [];
    $scope.draftRejectedItems = [];
    $scope.goBack = function () {
      $state.go("app.home");
    };

    $scope.goRefundView = function () {
      _.each($scope.rejectedItems, function (partItem) {
        console.log('partItem.isClick:', partItem.isClick);
        if (partItem.isClick){
          $scope.nowSendRefund.push(partItem);
        }
      });
      console.log(' $scope.nowSendRefund:',  $scope.nowSendRefund);

      $state.go('app.refund', { refundInfo: $scope.nowSendRefund ,orderDetailsId: ""});
    };
    $scope.$on('$ionicView.enter', function () {
      $scope.getRefundList();
    });
    //退件接口
    $scope.getRefundList = function () {
      AppUtilService.showLoading();

      ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder , 'GET', {}, null,
        function (responseGetDelivery) {
          AppUtilService.hideLoading();
          console.log('responseGetDelivery:', responseGetDelivery);
          if (responseGetDelivery.length!=0){
            _.each(responseGetDelivery, function (partItem) {
              partItem.isClick = false;

              if (partItem.Delivery_Order_Status__c == "null"){
                $scope.draftRejectedItems.push(partItem);

              }else if (partItem.Delivery_Order_Status__c =="03") {
                $scope.rejectedItems.push(partItem);
              }
            });


          }

        }, function (error) {
          console.log('responseGetDelivery_error:', error);
          AppUtilService.hideLoading();
        });
    };

    $scope.isRefundSelected = function (partItem) {
      console.log('partItem:', partItem);

      if (partItem.isClick === true) {
        _.assign(partItem, {isClick: false});
      } else {
        _.assign(partItem, {isClick: true});
      }
    };

  });

