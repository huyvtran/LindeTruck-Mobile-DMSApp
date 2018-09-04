(function () {
    'use strict';
angular.module('oinio.CalendarController', [])
    .controller('CalendarController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor, HomeService, $ionicPopup,
        LocalCacheService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);

        var allUser = [];
        var allOrders = [];
        var allUserName = [];
        let events = [];
        var currentOrder = [];
        vm.isOnline = null;

        $scope.toDisplayBox = function () {
            if (document.getElementById("add_bgbox").style.display == "none") {
                document.getElementById("add_bgbox").style.display = "";//显示
                document.getElementById("add_contactsImg").style.display = "";

            } else {
                document.getElementById("add_bgbox").style.display = "none";//隐藏
                document.getElementById("add_contactsImg").style.display = "none";//隐藏


            }
        };


        $scope.addNewWork = function () {
            $state.go('app.newWork');
        };
        
        // Triggered on a button click, or some other target
        $scope.showPopup = function (item) {
            $scope.data = {}

            // 自定义弹窗
            var myPopup = $ionicPopup.show({
                title: item.Account_Name_Ship_to__r.Name,
                // subTitle: 'Please use normal things',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>安排</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            {
                                console.log('Tapped！!', allUser);
                                var listDataAll = angular.toJson(allUser);

                                $state.go('app.arrange', {SendAllUser: listDataAll});
                                return "anpai";
                            }
                        }
                    },
                    {
                        text: '<b>详情</b>',
                        type: 'button-positive'
                    }
                ]
            });
            myPopup.then(function (res) {
                console.log('Tapped!', res);
                
            });
        };

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            console.log('$ionicView.beforeEnter');

        });

        $scope.$on('$i', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log('onicView.enter');

        });

        $scope.toRepair1 = function () {
            $state.go('app.search_1');

        }
        var getOrderById = function (sendId) {
            for (let index = 0; index < allUser.length; index++) {
                var userId = allUser[index].userId;
                if (userId == sendId) {
                    return allUser[index];
                }
            }
        };
        var getOrderByStates = function (status) {
            var forNowlist = [];
            for (let index = 0; index < currentOrder.length; index++) {
                var userStatus = currentOrder[index].Status__c;

                if (userStatus == status) {
                    forNowlist.push(currentOrder[index]);
                }

            }
            return forNowlist;
        };
        var getServiceOrderType = function (array) {
            for (let index = 0; index < array.length; index++) {
                const element = array[index].Service_Order_Type__c;
                if (element == "Work Order") {
                    array[index].Service_Order_Type__c = "工单";
                }else if (element == "Customer Consult") {
                    array[index].Service_Order_Type__c = "客户咨询";
                }else if (element == "Customer Complaint") {
                    array[index].Service_Order_Type__c = "客户投诉";
                }
            }
            return array;
        };
        //使用对象记录重复的元素，以及出现的次数
        var getCount = function (arr) {
            var plan_Date_List =[];
            for (let index = 0; index < arr.length; index++) {
                var plan_Date__c = arr[index].Plan_Date__c;
                plan_Date_List.push(plan_Date__c);
            }
            events = [];//清空数组
            var obj = {},
                k, arr1 = [];
            for (var i = 0, len = plan_Date_List.length; i < len; i++) {
                k = plan_Date_List[i];
                if (obj[k])
                    obj[k]++;
                else
                    obj[k] = 1;
            }
            //保存结果{el-'元素'，count-出现次数}
            for (var o in obj) {
                arr1.push({
                    el: o,
                    count: obj[o]
                });
            }
            for (let index = 0; index < arr1.length; index++) {
                var item = arr1[index];
                events.push({
                    // 标题，即你想展示的内容
                    title: item['count'],
                    start: item['el']
                });
                //它可以将刚刚获取到的events数据渲染到日历中
            }
            return events;
        };

        $(document).ready(function () {

            // 这里是ajax请求，替换为你正在使用的ajax方式就可以
            HomeService.getEachOrder().then(function (res) {
                for (let index = 0; index < res.length; index++) {
                    // allUser.push(res[index]);
                }
                allUser = res;
                $scope.allUser = res;
                console.log('getEachOrder Error ' + "1");
                var newArray = [];
                if (getOrderById(oCurrentUser.Id).orders == undefined) {
                    newArray = [];
                }else{
                    newArray = getOrderById(oCurrentUser.Id).orders;
                }
                currentOrder = newArray;//当前选择组员的订单

                //日历下方列表
                allOrders = newArray;
                // for (let index = 0; index < allOrders.length; index++) {
                    // currentOrder.push(allOrders[index]);
                    // console.log('Name: ' + allOrders[index].Name);
                    // console.log('Service_Order_Type__c: ' + allOrders[index].Service_Order_Type__c);

                // }
                
                $scope.currentOrder = getServiceOrderType(allOrders);
                calendarAll.fullCalendar("removeEvents");
                calendarAll.fullCalendar("addEventSource", getCount(currentOrder));
            }, function (error) {
                console.log('getEachOrder Error ' + error);
            });

            var calendarAll = $('#calendarAll').fullCalendar({
                displayEventTime: false,
                titleFormat : "MM", 
                // allDaySlot : false,
                // allDayText:'今天的任务',
                buttonText: {
                    today: '今天',
                    month: '月视图',
                    week: '周视图',
                },
                monthNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
                monthNamesShort:["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
                dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,basicWeek'
                },
                dayClick: function (date, jsEvent, view) {

                    console.log("↓↓↓dayClick↓↓↓");
                    console.log('date: ' + date);
                    console.log('jsEvent: ' + jsEvent);
                    console.log('view: ' + view);
                    // $("tr:even").css("background-color", "#000");
                    var currentClickDate = date.format('YYYY-MM-DD');
                    var selectDateOrders = [];
                    for (let index = 0; index < currentOrder.length; index++) {//显示点击日期的工单
                      var indexDate = currentOrder[index].Plan_Date__c;
                      if (currentClickDate == indexDate) {
                        selectDateOrders.push(currentOrder[index]);
                      }
                    }
                    if (selectDateOrders.count>0) {
                        $scope.currentOrder = getServiceOrderType(selectDateOrders);
                    }
                },
                events: function (start, end, timezone, callback) {

                    console.log('events: function!:'+currentOrder);
                    // 数据处理，将返回的数据添加到events中
                    $('#calendarAll').fullCalendar("removeEvents");
                   
                    callback(getCount(currentOrder));

                },
                eventClick : function(event, jsEvent, view) {
                    // 此处可添加修改日程的代码
                    // var red = Math.round(255 * Math.random());
                    // var green = Math.round(255 * Math.random());
                    // var blue = Math.round(255 * Math.random());
                    // $(this).css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
                   }

            });

            //////选择组员
            var province = document.getElementById("selectUserId");
            province.onchange = function () {
                var index = province.options.selectedIndex;
                currentOrder = allUser[index].orders;//当前选择组员的订单

                document.getElementById("selectStatusId")[0].selected = true;


                // var item = $("#calendar").fullCalendar( 'clientEvents', 999 );
                // console.log(item[0].title);
                // item[0].start = '2018-08-29';
                // $('#calendar').fullCalendar('updateEvent',item[0]);
                $scope.currentOrder = getServiceOrderType(allUser[index].orders);
                calendarAll.fullCalendar("removeEvents");
                calendarAll.fullCalendar("addEventSource", getCount(allUser[index].orders));
            }

            

            //////选择状态
            var selectStatus = document.getElementById("selectStatusId");
            selectStatus.onchange = function () {
                var index = selectStatus.options.selectedIndex;

                var selectStatusUser = [];
                switch (index) {
                    case 0://全部
                        selectStatusUser = currentOrder;
                        break;
                    case 1://未安排 Not Planned
                        selectStatusUser = getOrderByStates("Not Planned");
                        break;
                    case 2://未开始 "Not Started"
                        selectStatusUser = getOrderByStates("Not Started");
                        break;
                    case 3://进行中 "Not Completed"
                        selectStatusUser = getOrderByStates("Not Completed");
                        break;
                    case 4://已完成 "Service Completed"
                        selectStatusUser = getOrderByStates("Service Completed");
                        break;
                    default:
                        break;
                }
                $scope.currentOrder = getServiceOrderType(selectStatusUser);
                calendarAll.fullCalendar("removeEvents");
                calendarAll.fullCalendar("addEventSource", getCount(selectStatusUser));
            }
        });
    });

})();