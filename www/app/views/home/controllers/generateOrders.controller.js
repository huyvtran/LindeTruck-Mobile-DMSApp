angular.module('oinio.generateOrdersController', [])
    .controller('generateOrdersController', function ($scope, $ionicHistory, ForceClientService, $stateParams, AppUtilService) {

        $scope.upsertSapOrder = "/ServicePartsOrder?action=upsertSapOrder&serviceOrderOverviewId=";
        $scope.saveServicePartOrder = "/ServicePartsOrder?action=saveServicePartOrder&serviceOrderOverviewId=";

        $scope.goBack = function () {
            $ionicHistory.goBack();
        };
        $(function () {
            var calendar = new lCalendar();
			calendar.init({
				'trigger': '#currentDate',
				'type': 'date'
            });
                    
        });
        //         生成备件订单
        // 收货联系人: Consignee__c (User Id)
        // 联系电话: Tel__c (Text 20)
        // 收货地址: Delivery_Address__c (Text 255)
        // 订单类型: Part_Order_Type__c (ZCS1)
        // 订单等级: Priority__c(50,60,99)
        // 订单日期: Delivery_Date__c
        // 整单交货日期: (only display)
        // 是否整单交货:Entire__c
        $scope.goToGenerate = function () {
            AppUtilService.showLoading();
            var payload1 = $scope.upsertSapOrder + $stateParams.workOrderId;
            var payload2 = $scope.saveServicePartOrder + $stateParams.workOrderId + "&lineItems=[]&servicePartOrder=";

            console.log("payload", payload);
            ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response) { //生成备件接口一
                console.log("POST_success:", response);
                ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response) { //生成备件接口二
                    console.log("POST_success:", response);
                    AppUtilService.hideLoading();
                    // var ionPop = $ionicPopup.alert({
                    //     title: "保存成功"
                    // });
                    // ionPop.then(function (res) {
                    //     $ionicHistory.goBack();
                    // });

                }, function (error) {
                    console.log("POST_error:", error);
                    AppUtilService.hideLoading();
                    var ionPop = $ionicPopup.alert({
                        title: "生成备件失败"
                    });
                });

            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "生成备件失败"
                });
            });
        };
    });

