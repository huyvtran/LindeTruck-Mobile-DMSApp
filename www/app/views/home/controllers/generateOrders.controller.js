angular.module('oinio.generateOrdersController', [])
    .controller('generateOrdersController', function ($scope, $ionicHistory, $ionicPopup, ForceClientService, LocalCacheService, $stateParams, AppUtilService) {
        var vm = this,
        oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);
        $scope.workTypes = [];
        $scope.upsertSapOrder = "/ServicePartsOrder?action=upsertSapOrder&serviceOrderOverviewId=";
        $scope.saveServicePartOrder = "/ServicePartsOrder?action=saveServicePartOrder&serviceOrderOverviewId=";
        $scope.preparePart = "/ServicePartsOrder?action=preparePart&servicePartOrderId=";
        /**
         * 本地初始化作业类型数据
         */
        $scope.workTypes.push({label: 'ZS01_Z10', value: 'Z10 Ad-hoc chargeable service'});
        $scope.workTypes.push({label: 'ZS01_Z11', value: 'Z11 Bill to customer for other Reg'});
        $scope.workTypes.push({label: 'ZS02_Z20', value: 'Z20 Service contract job\t'});
        $scope.workTypes.push({label: 'ZS02_Z21', value: 'Z21 LTR service with Contract'});
        $scope.workTypes.push({label: 'ZS02_Z22', value: 'Z22 LTR service with contract(RE)'});
        $scope.workTypes.push({label: 'ZS03_Z30', value: 'Z30 Asset (STR) service'});
        $scope.workTypes.push({label: 'ZS03_Z31', value: 'Z31 In-Stock Truck(cost only)'});
        $scope.workTypes.push({label: 'ZS03_Z33', value: 'Z33 Support job for Service'});
        $scope.workTypes.push({label: 'ZS03_Z35', value: 'Z35 Service Engineer Training'});
        $scope.workTypes.push({label: 'ZS03_Z36', value: 'Z36 Service Marketing Campaign\t'});
        $scope.workTypes.push({
            label: 'ZS03_Z37',
            value: 'Z37 Internal maintenance for in-Stock Truck(value change)'
        });
        $scope.workTypes.push({label: 'ZS03_Z38', value: 'Z38 Internal Cross-region billing'});
        $scope.workTypes.push({label: 'ZS03_Z39', value: 'Z39 Asset (STR) service(RE)'});
        $scope.workTypes.push({label: 'ZS03_Z3A', value: 'Z3A FOC Service from Truck Sales'});
        $scope.workTypes.push({label: 'ZS03_ZH1', value: 'ZH1 HQ Truck maintenance'});
        $scope.workTypes.push({label: 'ZS03_ZH2', value: 'ZH2 Testing truck event'});
        $scope.workTypes.push({label: 'ZS03_ZH3', value: 'ZH3 QM analyses'});
        $scope.workTypes.push({label: 'ZS03_ZH4', value: 'ZH4 anti-explosion truck reproduct'});
        $scope.workTypes.push({label: 'ZS03_ZOC', value: 'ZOC aftersales order changed\t'});
        $scope.workTypes.push({
            label: 'ZS03_ZR1',
            value: 'ZR1 Internal maintenance for rental truck refurbishment'
        });
        $scope.workTypes.push({label: 'ZS03_ZR2', value: 'ZR2 LRental truck refurbishment'});
        $scope.workTypes.push({label: 'ZS03_ZR3', value: 'ZR3 SRental truck refurbishment\t'});
        $scope.workTypes.push({label: 'ZS03_ZSS', value: 'ZSS sales support service'});
        $scope.workTypes.push({label: 'ZS03_ZTD', value: 'ZTD shipping damage'});
        $scope.workTypes.push({label: 'ZS04_Z40', value: 'Z40 Spare Parts Only Service\t'});
        $scope.workTypes.push({label: 'ZS05_Z37', value: 'Z37 In-Stock Truck(value change)'});
        $scope.workTypes.push({label: 'ZS06_ZR1', value: 'ZR1 Rental truck refurbishment'});
        $scope.workTypes.push({label: 'ZS08_Z80', value: 'Z80 Warranty'});
        $scope.workTypes.push({label: 'ZS08_Z81', value: 'Z81 Warranty job1'});
        $scope.workTypes.push({label: 'ZS08_Z82', value: 'Z82 Warranty job2'});
        $scope.workTypes.push({label: 'ZS08_Z83', value: 'Z83 Warranty job3'});
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
            console.log("payload1", payload1);

            var servicePartOrder = {};
            servicePartOrder["Consignee__c"] = oCurrentUser.Id;//收货联系人: Consignee__c (User Id)
            servicePartOrder["Tel__c"] = $scope.Tel__c;// 联系电话
            servicePartOrder["Delivery_Address__c"] = $scope.Delivery_Address__c;//收货地址: Delivery_Address__c (Text 255)
            servicePartOrder["Part_Order_Type__c"] = "ZCS1";// 订单类型
            servicePartOrder["Account__c"] = $stateParams.accountId;// 客户ID
            servicePartOrder["Service_Order_Overview__c"] = $stateParams.workOrderId;//工单ID
            servicePartOrder["Priority__c"] = document.getElementById("Priority__c").value;//订单等级
            servicePartOrder["Work_Order_Type__c"] = $('#select_work_type option:selected').val();//作业类型
            var seleCurrentDate = document.getElementById("currentDate").value;
            servicePartOrder["Delivery_Date__c"] = new Date(Date.parse(seleCurrentDate.replace(/-/g, "/"))).format('yyyy-MM-dd');// 订单日期
            servicePartOrder["Entire__c"] = document.getElementById("Entire__c").checked;// 是否整单交货
            var payload2 = $scope.saveServicePartOrder + $stateParams.workOrderId + "&servicePartOrder="+JSON.stringify(servicePartOrder);
            console.log("payload2", payload2);

            ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response1) { //生成备件接口一
                console.log("POST_success1:", response1);
                if (response1.status =="fail"){
                    AppUtilService.hideLoading();
                    var ionPop = $ionicPopup.alert({
                        title: response1.message
                    });
                    return;
                }
                ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response2) { //生成备件接口二
                    console.log("POST_success2:", response2);
                    AppUtilService.hideLoading();
                        if (response2.status == "success"){
                            var ionPop = $ionicPopup.alert({
                                title: "生成备件成功"
                            });
                            ionPop.then(function (res) {
                                $ionicHistory.goBack();
                            });
                        }else {
                            var ionPop = $ionicPopup.alert({
                                title: response2.message
                            });
                            ionPop.then(function (res) {
                                $ionicHistory.goBack();
                            });
                        }
                    // var payload3 = $scope.preparePart + response2.servicePartOrderId;
                    // console.log("payload3", payload3);
                    // ForceClientService.getForceClient().apexrest(payload3, 'POST', {}, null, function (response3) { //生成备件接口二
                    //     console.log("POST_success3:", response3);
                    //     AppUtilService.hideLoading();
                    //     if (response3.status == "success"){
                    //         var ionPop = $ionicPopup.alert({
                    //             title: "生成备件成功"
                    //         });
                    //         ionPop.then(function (res) {
                    //             $ionicHistory.goBack();
                    //         });
                    //     }else {
                    //         var ionPop = $ionicPopup.alert({
                    //             title: response3.message
                    //         });
                    //         ionPop.then(function (res) {
                    //             $ionicHistory.goBack();
                    //         });
                    //     }
                    // }, function (error) {
                    //     console.log("response2POST_error:", error);
                    //     AppUtilService.hideLoading();
                    //     var ionPop = $ionicPopup.alert({
                    //         title: "生成备件失败"
                    //     });
                    // });

                }, function (error) {
                    console.log("response1POST_error:", error);
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

