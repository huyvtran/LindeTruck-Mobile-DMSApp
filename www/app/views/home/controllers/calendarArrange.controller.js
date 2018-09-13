angular.module('oinio.CalendarArrangeController', [])
    .controller('CalendarArrangeController', function ($scope,$ionicPopup,$stateParams,HomeService, $state,$rootScope) {

        $scope.goBack = function () {
            window.history.go(-1);
        };


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
            // 提交请求
            var userSoupEntryId = new Object(); 
            userSoupEntryId._soupEntryId = selectUserEntryId;
            var orderSoupEntryId = new Object(); 
            orderSoupEntryId._soupEntryId = $stateParams.SendSoupEntryId;

            HomeService.modifyWorkOrder(orderSoupEntryId,userSoupEntryId,mobiDate).then(function (sobject) {                
                $state.go('app.home', {}, {reload: false})
                .then(function(){
                    setTimeout(function() {
                        $rootScope.getSomeData();
                 },100);
             })
            }, function (error) {
                console.log('modifyWorkOrder Error ' + error);
                $ionicPopup.alert({
                    title: "数据错误"
                });
            });
            
        };
        
        $(function () {
            var calendar = new lCalendar();
			calendar.init({
				'trigger': '#currentDate',
				'type': 'date'
            });
            
             $scope.allUser = angular.fromJson($stateParams.SendAllUser);
            
            // $('#calendarA').fullCalendar({
            //     titleFormat : "MM", 
            //     buttonText: {
            //         today: '今天',
            //         month: '月视图'
            //     },
            //     monthNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
            //     dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
            //     header: {
            //         left: 'prev,next today',
            //         center: 'title',
            //         right: 'month'
            //     },
            //     dayClick: function (date, jsEvent, view) {
      
            //         console.log("↓↓↓dayClick↓↓↓");
            //         console.log('date: ' + date.format('YYYY-MM-DD'));
            //         $scope.currentDate = date.format('YYYY-MM-DD');
            //         console.log('jsEvent: ' + jsEvent);
            //         console.log('view: ' + view);
            //     }
                
            // });
        });
    });

