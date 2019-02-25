angular.module('oinio.RefundDetailController', [])
    .controller('RefundDetailController', function ($scope, $rootScope, $filter, $state, $ionicPopup, $ionicHistory, $stateParams, AppUtilService, ForceClientService, ConnectionMonitor,
        LocalCacheService) {

        $scope.selectRefundInfo = [];
        $scope.paramSaveDeliveryOrdersUrl = "/UpdateDeliveryOrders/";
        $scope.paramSaveAndSubminDeliveryOrdersUrl = "/submitDeliverOrders/";

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {



        });
        $scope.$on('$ionicView.enter', function () {
            $scope.selectRefundInfo = $stateParams.refundInfo;
            console.log("$scope.selectRefundInfo:", $scope.selectRefundInfo);
          document.addEventListener('click', newHandle);//初始化弹框

        });

        $scope.goBack = function () {
            // window.history.back();
            $ionicHistory.goBack();
        };
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

      $scope.popupRefundContextItem = function (item) {
        var setButtons = [];
        // 自定义弹窗
        myPopup = $ionicPopup.show({
          title: '<div><span>退件原因:' + item.Return_Reason__c + '</span></div>' +
                 '<div><span>备注:' + item.Diff_Reason__c + '</span></div>',
          scope: $scope,
          buttons: setButtons
        });
        myPopup.then(function (res) {
          console.log('Tapped!', res);
        });
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

