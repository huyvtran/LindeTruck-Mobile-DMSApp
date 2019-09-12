(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('RefundController',
      function ($scope, $state, $ionicPopup, $ionicHistory, $stateParams, AppUtilService, ForceClientService) {

        $scope.selectRefundInfo = [];
        $scope.serviceEnd = "false";
        $scope.paramSaveDeliveryOrdersUrl = "/DMSDelivaryService?DMSReturnQtyWrapper=";
        $scope.paramUpdateSubmitDeliverOrders = "/UpdateSubmitDeliverOrders?recordId=";
        $scope.paramSaveAndSubminDeliveryOrdersUrl = "/submitDeliverOrders/";
        $scope.diffReasonSites = [
          {site: "1", name: "多订"},
          {site: "2", name: "订错件"},
          {site: "3", name: "故障判断有误"},
          {site: "4", name: "客户原因取消"}
        ];
        $scope.deleteIds = [];
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

        });
        $scope.$on('$ionicView.enter', function () {

          // _.each($scope.selectRefundInfo, function (refundItems) {
          //   _.each(refundItems, function (refundItem) {
          //     partItem.isClick = false;
          //   });
          // });
          if ($stateParams.refundInfo.length != 0) {
            _.each($stateParams.refundInfo, function (refundItem) {
              if (!$stateParams.refundInfo[0].Delivery_Line_Item__r[0]) {
                return;
              }
              if (refundItem.D_Status__c == "Service Completed" || refundItem.D_Status__c == "End") {
                $scope.serviceEnd = "true";
              }
              refundItem.Temp_Return_Reason__c = $stateParams.refundInfo[0].Delivery_Line_Item__r[0].Return_Reason__c;
              _.each($scope.diffReasonSites, function (diffItem) {
                if (diffItem.name == $stateParams.refundInfo[0].Delivery_Line_Item__r[0].Return_Reason__c) {
                  refundItem.Temp_Return_Reason__index = diffItem.site;
                }
              });

            });
          }
          $scope.selectRefundInfo = $stateParams.refundInfo;
          console.log("$scope.selectRefundInfo:", $scope.selectRefundInfo);

        });

        $scope.goBackgw = function () {
          // window.history.back();
          $ionicHistory.goBack();
        };
        $scope.selectDiffChange = function (item) {
          console.log("selectDiffChange", item)
          item.Return_Reason__c = item.Delivery_Line_Item__r[0].Return_Reason__c
        };

        /**
         *删除数组指定下标或指定对象
         */
        // Array.prototype.remove = function (obj) {
        //     for (var i = 0; i < this.length; i++) {
        //         var temp = this[i];
        //         if (!isNaN(obj)) {
        //             temp = i;
        //         }
        //         if (temp == obj) {
        //             for (var j = i; j < this.length; j++) {
        //                 this[j] = this[j + 1];
        //             }
        //             this.length = this.length - 1;
        //         }
        //     }
        // }

        $scope.toDelOneRefundView = function (obj) {
          // $scope.selectRefundInfo.remove(obj);
          _.pull($scope.selectRefundInfo, obj);

        };
        $scope.toDelTwoRefundView = function (bigObj, obj) {
          // console.log("$scope.index:",index);
          console.log("obj:", obj);
          $scope.deleteIds.push(obj.Id);
          // bigObj.remove(obj);
          _.pull(bigObj, obj);

        };
        $scope.goToSave = function () {
          let DMSReturnQtyWrapperList = [];
          _.each($scope.selectRefundInfo, function (refundItem) {
            _.each(refundItem.Delivery_Line_Item__r, function (refundItemDetail) {
              DMSReturnQtyWrapperList.push({'itemId':refundItemDetail.Id,'returnQty':refundItemDetail.Return_Quantity__c});
            });
          });
          AppUtilService.showLoading();
          var payload = $scope.paramSaveDeliveryOrdersUrl  + JSON.stringify(DMSReturnQtyWrapperList);
          console.log("paramSaveDeliveryOrdersUrl", payload);
          ForceClientService.getForceClient().apexrest(payload, 'PUT', {}, null, function (response) {
            console.log("POST_success:", response);
            $scope.deleteIds = [];
            AppUtilService.hideLoading();
            if (response.status == "fail"){
              var ionPop = $ionicPopup.alert({
                title: response.message
              });
              ionPop.then(function (res) {
              });
            }else {
              var ionPop = $ionicPopup.alert({
                title: "保存成功"
              });
              ionPop.then(function (res) {
                $ionicHistory.goBack();
              });
            }

          }, function (error) {
            console.log("POST_error:", error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: "保存失败"
            });
          });
        };
        $scope.goToSaveAndSubmit = function () {
          _.each($scope.selectRefundInfo, function (refundItem) {
            _.each(refundItem.Delivery_Line_Item__r, function (refundItemDetail) {
              refundItemDetail.CRM_Return_Quantity__c = Number(refundItemDetail.CRM_Return_Quantity__c);
            });
          });
          AppUtilService.showLoading();
          var payload1 = $scope.paramSaveDeliveryOrdersUrl + "?deliveryorders=" + JSON.stringify(
            $scope.selectRefundInfo) + "&recordId=" + $stateParams.orderDetailsId + "&deleteIds=" + $scope.deleteIds;
          console.log("payload1", payload1);
          ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response) {
            console.log("POST_success1:", response);
            var payload2 = $scope.paramUpdateSubmitDeliverOrders + $stateParams.orderDetailsId;
            console.log("payload2", payload2);
            ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response) {
              console.log("POST_success2:", response);
              var payload3 = $scope.paramSaveAndSubminDeliveryOrdersUrl + "?recordId=" + $stateParams.orderDetailsId
                             + "&deliveryorders=" + JSON.stringify($scope.selectRefundInfo);
              console.log("payload3", payload3);
              ForceClientService.getForceClient().apexrest(payload3, 'POST', {}, null, function (response) {
                console.log("POST_success3:", response);
                $scope.deleteIds = [];
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                  title: "提交成功"
                });
                ionPop.then(function (res) {
                  $ionicHistory.goBack();
                });

              }, function (error) {
                console.log("POST_error3:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                  title: "提交失败"
                });
              });

            }, function (error) {
              console.log("POST_error2:", error);
              AppUtilService.hideLoading();
              var ionPop = $ionicPopup.alert({
                title: "提交失败"
              });
            });

          }, function (error) {
            console.log("POST_error1:", error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: "保存失败"
            });
          });
        };
      });
})();
