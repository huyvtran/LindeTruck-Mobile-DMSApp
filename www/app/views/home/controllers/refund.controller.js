angular.module('oinio.RefundController', [])
    .controller('RefundController', function ($scope, $rootScope, $filter, $state, $ionicPopup, $ionicHistory, $stateParams, AppUtilService, ForceClientService, ConnectionMonitor,
        LocalCacheService) {

        $scope.selectRefundInfo = [];
        $scope.paramSaveDeliveryOrdersUrl = "/UpdateDeliveryOrders/";
        $scope.paramSaveAndSubminDeliveryOrdersUrl = "/submitDeliverOrders/";
      $scope.diffReasonSites = [
        {site : "1", name : "多订"},
        {site : "2", name : "订错件"},
        {site : "3", name : "故障判断有误"},
        {site : "4", name : "客户原因取消"}
      ];
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
          if ($stateParams.refundInfo.length!=0) {
            _.each($stateParams.refundInfo, function (refundItem) {
              refundItem.Temp_Return_Reason__c = $stateParams.refundInfo[0].Delivery_Line_Item__r[0].Return_Reason__c;
            });
          }
          $scope.selectRefundInfo = $stateParams.refundInfo;
          console.log("$scope.selectRefundInfo:", $scope.selectRefundInfo);


        });

        $scope.goBackgw = function () {
            // window.history.back();
            $ionicHistory.goBack();
        };

        /**
*删除数组指定下标或指定对象
*/
        Array.prototype.remove = function (obj) {
            for (var i = 0; i < this.length; i++) {
                var temp = this[i];
                if (!isNaN(obj)) {
                    temp = i;
                }
                if (temp == obj) {
                    for (var j = i; j < this.length; j++) {
                        this[j] = this[j + 1];
                    }
                    this.length = this.length - 1;
                }
            }
        }

        $scope.toDelOneRefundView = function (obj) {
            $scope.selectRefundInfo.remove(obj);

        };
        $scope.toDelTwoRefundView = function (bigObj, obj) {
            // console.log("$scope.index:",index);
            // console.log("$scope.obj:",obj);

            bigObj.remove(obj);

        };
        $scope.goToSave = function () {
            AppUtilService.showLoading();
            var payload = $scope.paramSaveDeliveryOrdersUrl + "?deliveryorders="+JSON.stringify($scope.selectRefundInfo);
            console.log("payload", payload);
            ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
                console.log("POST_success:", response);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                title: "保存成功"
            });
            ionPop.then(function (res) {
                $ionicHistory.goBack();
            });

            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "保存失败"
                });
            });
        };
        $scope.goToSaveAndSubmit = function () {
            AppUtilService.showLoading();
            var payload1 = $scope.paramSaveDeliveryOrdersUrl + "?deliveryorders="+JSON.stringify($scope.selectRefundInfo)+"&recordId="+$stateParams.orderDetailsId;
            // console.log("payload", payload);
            ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response) {
                console.log("POST_success1:", response);
                var payload2 = $scope.paramSaveAndSubminDeliveryOrdersUrl +"?recordId="+$stateParams.orderDetailsId + "&deliveryorders="+JSON.stringify($scope.selectRefundInfo);
                // console.log("payload", payload);
                ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response) {
                    console.log("POST_success2:", response);
                    AppUtilService.hideLoading();
                    var ionPop = $ionicPopup.alert({
                    title: "提交成功"
                });
                ionPop.then(function (res) {
                    $ionicHistory.goBack();
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

