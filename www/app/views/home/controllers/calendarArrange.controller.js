angular.module('oinio.CalendarArrangeController', [])
    .controller('CalendarArrangeController', function ($scope,$ionicPopup,$stateParams,HomeService, $state,$rootScope,
                                                       AppUtilService,ForceClientService) {

        $scope.goBack = function () {
            window.history.go(-1);
        };

        $scope.updateDataStatusUrl="/WorkDetailService?action=updateStatus";
        $scope.submitOrder = function () {
            var mobiDate = $("#currentDate").val();

            if (!mobiDate) {
                $ionicPopup.alert({
                    title: "请选择日期"
                });
                return;
            }
            var selectUserGroup = $("#selectUserGroup").get(0).selectedIndex;//选择index           
            var selectUserEntryId = $scope.allUser[selectUserGroup].userSoupEntryId;//所有用户数组
            var selectUserId = $scope.allUser[selectUserGroup].userId;//所有用户ID

            // 提交请求
            var userSoupEntryId = new Object(); 
            userSoupEntryId.Id = selectUserId;
            userSoupEntryId._soupEntryId = selectUserEntryId;
            var orderSoupEntryId = new Object(); 
            orderSoupEntryId._soupEntryId = $stateParams.SendSoupEntryId;
            console.log($stateParams.workOrderId);

            // HomeService.modifyWorkOrder(orderSoupEntryId,userSoupEntryId,mobiDate).then(function (sobject) {
            //     $state.go('app.home', {}, {reload: false})
            //     .then(function(){
            //         setTimeout(function() {
            //             $rootScope.getSomeData();
            //      },100);
            //  })
            // }, function (error) {
            //     console.log('modifyWorkOrder Error ' + error);
            //     $ionicPopup.alert({
            //         title: "数据错误"
            //     });
            // });

            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.updateDataStatusUrl+"&sooId="+$stateParams.workOrderId+"&status=Not Started",
                "POST",
                {},
                null,function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if (res.status=="Success"){
                        $state.go('app.home', {}, {reload: false})
                            .then(function(){
                                setTimeout(function() {
                                    $rootScope.getSomeData();
                                },100);
                            });
                    }},function error(msg) {
                        AppUtilService.hideLoading();
                        console.log(msg);
                    });
            
        };
        
        $(function () {
            var calendar = new lCalendar();
			calendar.init({
				'trigger': '#currentDate',
				'type': 'date'
            });
            
             $scope.allUser = angular.fromJson($stateParams.SendAllUser);
        
        });
    });

