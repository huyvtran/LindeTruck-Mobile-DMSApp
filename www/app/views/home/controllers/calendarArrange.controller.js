angular.module('oinio.CalendarArrangeController', [])
    .controller('CalendarArrangeController', function ($scope,$ionicPopup,$stateParams) {

        $scope.goBack = function () {
            window.history.back();
        };


        $scope.submitOrder = function () {
            var mobi = $("#currentDate").val();

            if (!mobi) {
                $ionicPopup.alert({
                    title: "请选择日期"
                });
                return;
            }
            // window.history.back();
            var selectUserGroup = $("#selectUserGroup").get(0).selectedIndex
            console.log("selectUserGroup:",selectUserGroup);
            
        };
        
        $(function () {
            var calendar = new lCalendar();
			calendar.init({
				'trigger': '#currentDate',
				'type': 'date'
            });
            
           
            // console.log("$stateParams.SendAllUser:",$stateParams.SendAllUser);
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

