angular.module('oinio.deliveryListController', [])
  .controller('deliveryListController', function ($scope, $state, $stateParams ,ForceClientService ,AppUtilService ,$ionicPopup) {
    $scope.nowSendRefund = [];
    $scope.getDeliveryOrder = "/DeliverOrderService?action=queryAll";
    $scope.rejectedItems = [];
    var myPopup = null;
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

    $scope.goRefundDetailView = function (itemDetail) {
      console.log(' itemDetail:',  itemDetail);

      $state.go('app.refundDetail', { refundInfo: itemDetail ,orderDetailsId: ""});
    };

    $scope.$on('$ionicView.enter', function () {
      $scope.getRefundList();
      document.addEventListener('click', newHandle);//初始化弹框

    });
    /**
     * 离开页面前
     */
    $scope.$on('$ionicView.beforeLeave', function () {
      console.log('移除点击事件');
      document.removeEventListener('click', newHandle);
    });
    var newHandle = function(e) {
      if (event.target.nodeName === 'HTML') {
        if (myPopup) {//myPopup即为popup
          myPopup.close();
        }
      }
    };

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
    $scope.popupRefundContext = function (reitems) {
      var setButtons = [];
      // 自定义弹窗
      myPopup = $ionicPopup.show({
        title: '<div><span>交货单状态:' + reitems.D_Status__c + '</span></div>' +
               '<div><span>到货物流单号:' + reitems.Tracking_Number__c + '</span></div>' +
               '<div><span>到货物流状态:' + reitems.TrackState + '</span></div>' +
               '<div><span>退货物流单号:' + reitems.Return_Tracking_Number__c + '</span></div>' +
               '<div><span>退货物流状态:' + reitems.ReturnTrackState + '</span></div>',
        scope: $scope,
        buttons: setButtons
      });
      myPopup.then(function (res) {
        console.log('Tapped!', res);
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

