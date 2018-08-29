angular.module('oinio.CalendarController', [])
    .controller('CalendarController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor, HomeService, $ionicPopup,
        LocalCacheService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);

        var allUser = [];
        var allOrders = [];
        var allOrdersDate = [];
        var allUserName = [];
        let events = [];
        var currentOrder = [];
        vm.isOnline = null;
        // Triggered on a button click, or some other target
        $scope.showPopup = function (item) {
            $scope.data = {}

            // 自定义弹窗
            var myPopup = $ionicPopup.show({
                title: item.Name,
                // subTitle: item.Plan_Date__c,
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>安排</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            {
                                $state.go('app.arrange');
                            }
                        }
                    },
                    {
                        text: '<b>详情</b>',
                        type: 'button-positive',
                    }
                ]
            });
            myPopup.then(function (res) {
                console.log('Tapped!', res);
                
            });
        };

        // $scope.selectUser = function () {
        //     var objS = document.getElementById("selectUserId");
        //     var grade = objS.options[objS.selectedIndex].grade;
        //     console.log('selectUser!:'+ grade +objS.selectedIndex);

        // };

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        });

        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
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
        }
        var getOrderByStates = function (status) {
            var forNowlist = [];
            for (let index = 0; index < currentOrder.length; index++) {
                var userStatus = currentOrder[index].Status__c;

                if (userStatus == status) {
                    forNowlist.push(currentOrder[index]);
                }

            }
            return forNowlist;
        }
        //使用对象记录重复的元素，以及出现的次数
        var getCount = function (arr) {
            events = [];//清空数组
            var obj = {},
                k, arr1 = [];
            for (var i = 0, len = arr.length; i < len; i++) {
                k = arr[i];
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
                    start: item
                });
                //它可以将刚刚获取到的events数据渲染到日历中
            }
            return events;
        }

        $(function () {

            // 这里是ajax请求，替换为你正在使用的ajax方式就可以
            HomeService.getEachOrder().then(function (res) {
                for (let index = 0; index < res.length; index++) {
                    // allUser.push(res[index]);
                }
                allUser = res;
                $scope.allUser = res;

                currentOrder = getOrderById(oCurrentUser.Id).orders;//当前选择组员的订单

                //日历下方列表
                allOrders = getOrderById(oCurrentUser.Id).orders;
                for (let index = 0; index < allOrders.length; index++) {
                    // currentOrder.push(allOrders[index]);
                    // console.log('Name: ' + allOrders[index].Name);
                    // console.log('Service_Order_Type__c: ' + allOrders[index].Service_Order_Type__c);

                }
                $scope.currentOrder = allOrders;
                $("#calendar").fullCalendar("removeEvents");
                $("#calendar").fullCalendar("addEventSource", getCount(currentOrder));

            }, function (error) {
                console.log('getEachOrder Error ' + error);
            });

            $('#calendar').fullCalendar({
                displayEventTime: false,
                titleFormat : "MM", 
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
                    right: 'month,agendaWeek'
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
                    console.log('date: ' + date);
                    console.log('jsEvent: ' + jsEvent);
                    console.log('view: ' + view);
                },
                events: function (start, end, timezone, callback) {

                    console.log('events: function!:');
                    // 数据处理，将返回的数据添加到events中
                    $("#calendar").fullCalendar("removeEvents");
                    callback(getCount(currentOrder));

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
                $scope.currentOrder =allUser[index].orders;
                $("#calendar").fullCalendar("removeEvents");
                $("#calendar").fullCalendar("addEventSource", getCount(allUser[index].orders));

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
                $scope.currentOrder = selectStatusUser;
                $("#calendar").fullCalendar("removeEvents");
                $("#calendar").fullCalendar("addEventSource", getCount(selectStatusUser));
            }
        });
    });

