angular.module('oinio.CalendarArrangeController', [])
    .controller('CalendarArrangeController', function ($scope,$state,$stateParams) {

        $scope.goBack = function () {
            window.history.back();
        };
        $(function () {
            console.log("$stateParams.SendAllUser:",$stateParams.SendAllUser);
             $scope.allUser = angular.fromJson($stateParams.SendAllUser);

            $('#calendarA').fullCalendar({
                titleFormat : "MM", 
                buttonText: {
                    today: '今天',
                    month: '月视图'
                },
                monthNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
                dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month'
                },
                dayClick: function (date, jsEvent, view) {
                    // var events = $('#calendar').fullCalendar('clientEvents', function(event) {
                    //     var eventStart = event.start.format('YYYY-MM-DD');
                    //     var eventEnd = event.end ? event.end.format('YYYY-MM-DD') : null;
                    //     var theDate = date.format('YYYY-MM-DD');
                    //     // Make sure the event starts on or before date and ends afterward
                    //     // Events that have no end date specified (null) end that day, so check if start = date
                    //     return (eventStart <= theDate && (eventEnd >= theDate) && !(eventStart < theDate && (eventEnd == theDate))) || (eventStart == theDate && (eventEnd === null));
                    // });
                    console.log("↓↓↓dayClick↓↓↓");
                    console.log('date: ' + date.format('YYYY-MM-DD'));
                    $scope.currentDate = date.format('YYYY-MM-DD');
                    console.log('jsEvent: ' + jsEvent);
                    console.log('view: ' + view);
                }
                
            });
        });
    });

