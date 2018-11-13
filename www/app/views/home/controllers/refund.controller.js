angular.module('oinio.RefundController', [])
    .controller('RefundController', function ($scope, $rootScope, $filter, $state, $ionicPopup, $ionicHistory, $stateParams, AppUtilService, ForceClientService, ConnectionMonitor,
        LocalCacheService) {

        $scope.selectRefundInfo = [];
        $scope.paramSaveDeliveryOrdersUrl = "/UpdateDeliveryOrders/";
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {



        });
        $scope.$on('$ionicView.enter', function () {
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
            // console.log("$scope.selectRefundInfo:", $scope.selectRefundInfo);
            // AppUtilService.showLoading();
            // var payload = $scope.paramSaveDeliveryOrdersUrl + JSON.stringify($scope.selectRefundInfo);
            // console.log("payload", payload);
            // ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
            //     console.log("POST_success:", response);

            // }, function (error) {
            //     console.log("POST_error:", error);
            //     AppUtilService.hideLoading();
            //     var ionPop = $ionicPopup.alert({
            //         title: "保存失败"
            //     });
            // });
            var ionPop = $ionicPopup.alert({
                title: "保存成功"
            });
            ionPop.then(function (res) {
                $ionicHistory.goBack();
            });
        };
        $scope.goToSaveAndSubmit = function () {
            // console.log("$scope.selectRefundInfo:", $scope.selectRefundInfo);
            // AppUtilService.showLoading();
            // var payload = $scope.paramSaveDeliveryOrdersUrl +JSON.stringify($scope.selectRefundInfo);
            // console.log("payload", payload);
            // ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
            //     console.log("POST_success:", response);

            // }, function (error) {
            //     console.log("POST_error:", error);
            //     AppUtilService.hideLoading();
            //     var ionPop = $ionicPopup.alert({
            //         title: "保存失败"
            //     });
            // });
            var ionPop = $ionicPopup.alert({
                title: "提交成功"
            });
            ionPop.then(function (res) {
                $ionicHistory.goBack();
            });
        };
    });

