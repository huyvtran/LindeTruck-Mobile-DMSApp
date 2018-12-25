angular.module('oinio.deliveryListController', [])
  .controller('deliveryListController', function ($scope, $state, $stateParams) {
    $scope.nowSendRefund = [1,2,3];
    $scope.goBack = function () {
      $state.go("app.home");
    };

    $scope.goRefundView = function () {
      $state.go('app.refund', { refundInfo: $scope.nowSendRefund ,orderDetailsId: ""});
    };
    $scope.$on('$ionicView.beforeEnter', function () {

    });
    //退件接口
    $scope.getRefundList = function () {
      ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder + orderDetailsId, 'GET', {}, null,
        function (responseGetDelivery) {
          // ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder + 'a1Zp0000000CWqd', 'GET', {}, null,
          // function (responseGetDelivery) {
          AppUtilService.hideLoading();
          console.log('responseGetDelivery:', responseGetDelivery);
          $scope.rejectedItems = responseGetDelivery;
          for (var i = 0; i < $scope.rejectedItems.length; i++) {
            for (var j = 0; j < $scope.rejectedItems[i].Delivery_Line_Item__r.length; j++) {
              var elementget = $scope.rejectedItems[i].Delivery_Line_Item__r[j];
              elementget['checkBool'] = false;

            }
          }
          console.log('responseGetDeliveryafter:', $scope.rejectedItems);
        }, function (error) {
          console.log('responseGetDelivery_error:', error);
          AppUtilService.hideLoading();
        });
    };
  });

