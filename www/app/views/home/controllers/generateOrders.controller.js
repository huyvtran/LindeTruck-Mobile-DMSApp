angular.module('oinio.generateOrdersController', [])
    .controller('generateOrdersController', function ($scope, $ionicHistory, $ionicPopup, ForceClientService, LocalCacheService, $stateParams, AppUtilService) {
        var vm = this,
        oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);

        $scope.upsertSapOrder = "/ServicePartsOrder?action=upsertSapOrder&serviceOrderOverviewId=";
        $scope.saveServicePartOrder = "/ServicePartsOrder?action=saveServicePartOrder&serviceOrderOverviewId=";
        $scope.preparePart = "/ServicePartsOrder?action=preparePart&servicePartOrderId=";
        $scope.goBack = function () {
            $ionicHistory.goBack();
        };
        $(function () {
            var calendar = new lCalendar();
			calendar.init({
				'trigger': '#currentDate',
				'type': 'date'
            });
            var calendar1 = new lCalendar();
			calendar1.init({
				'trigger': '#currentDate1',
				'type': 'date'
            });   
            $scope.Consignee__c = oCurrentUser.Name;
            $scope.Delivery_Address__c = oCurrentUser.Address;

        });
        //         生成备件订单
        $scope.goToGenerate = function () {
            AppUtilService.showLoading();
            var payload1 = $scope.upsertSapOrder + $stateParams.workOrderId;
            var servicePartOrder = {};
            servicePartOrder["Consignee__c"] = oCurrentUser.Id;//收货联系人: Consignee__c (User Id)
            servicePartOrder["Tel__c"] = $scope.Tel__c;// 联系电话
            servicePartOrder["Delivery_Address__c"] = $scope.Delivery_Address__c;//收货地址: Delivery_Address__c (Text 255)
            servicePartOrder["Part_Order_Type__c"] = "ZCS1";// 订单类型
            servicePartOrder["Priority__c"] = document.getElementById("Priority__c").value;//订单等级
            var seleCurrentDate = document.getElementById("currentDate").value;
            servicePartOrder["Delivery_Date__c"] = new Date(Date.parse(seleCurrentDate.replace(/-/g, "/"))).format('yyyy-MM-dd');// 订单日期
            servicePartOrder["Entire__c"] = document.getElementById("Entire__c").checked;// 是否整单交货
            var payload2 = $scope.saveServicePartOrder + $stateParams.workOrderId + "&servicePartOrder="+JSON.stringify(servicePartOrder);
            console.log("payload2", payload2);

            ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response1) { //生成备件接口一
                console.log("POST_success:", response1);
                ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response2) { //生成备件接口二
                    console.log("POST_success:", response2);
                    var payload3 = $scope.preparePart + response2.servicePartOrderId;
                    ForceClientService.getForceClient().apexrest(payload3, 'POST', {}, null, function (response3) { //生成备件接口二
                        console.log("POST_success:", response3);
                        AppUtilService.hideLoading();
                        var ionPop = $ionicPopup.alert({
                            title: "生成备件成功"
                        });
                        ionPop.then(function (res) {
                            $ionicHistory.goBack();
                        });
    
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

            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "生成备件失败"
                });
            });
        };
    });

