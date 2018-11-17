(function () {
    'use strict';
    angular.module('oinio.CalendarController', [])
        .controller('CalendarController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor, HomeService, $ionicPopup,
            LocalCacheService) {

            var vm = this,
                oCurrentUser = LocalCacheService.get('currentUser') || {};
            console.log('oCurrentUser!', oCurrentUser);
            var myPopup;
            var localLatitude=null,
                localLongitude=null;
            var allUser = [];
            var allOrders = [];
            var allUserName = [];
            let events = [];
            var currentOrder = [];
            var firstRunFun = false;
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
            $scope.addNewOffer = function () {
                $state.go('app.newOffer');
            };
            // Triggered on a button click, or some other target
            $scope.showPopup = function (item) {
                console.log('showPopup!allUser', allUser);
                console.log('showPopup!item', item);
                $scope.data = {}
                var setButtons = [];
                if (item.Status__c == "Not Planned") {
                    setButtons = [
                        {
                            text: '出发',
                            onTap:function (e) {
                                var goTime = new Date();
                                navigator.geolocation.getCurrentPosition(function success(position) {
                                    localLatitude=position.coords.latitude;
                                    localLongitude=position.coords.longitude;
                                },function error(msg) {
                                    console.log(msg);
                                });
                                $state.go("app.workDetails",{
                                    SendInfo: item._soupEntryId,
                                    workDescription: null,
                                    AccountShipToC: item.Account_Ship_to__c,
                                    goOffTime:goTime,
                                    isNewWorkList:true
                                });
                            }
                        },

                        {
                            text: '<b>详情</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                $state.go('app.workDetails', {
                                    SendInfo: item._soupEntryId,
                                    workDescription: null,
                                    AccountShipToC: item.Account_Ship_to__c,
                                    goOffTime:"",
                                    isNewWorkList:false
                                });
                            }
                        },
                        {
                            text: '<b>安排</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                {
                                    console.log('Tapped！!', allUser);
                                    var listDataAll = angular.toJson(allUser);

                                    $state.go('app.arrange', {
                                        SendAllUser: listDataAll,
                                        SendSoupEntryId: item._soupEntryId
                                    });
                                    return "anpai";
                                }
                            }
                        }
                    ];
                } else {
                    setButtons = [
                        { text: '出发',
                            onTap:function (e) {
                                var goTime =new Date();
                                $state.go("app.workDetails",{
                                    SendInfo: item._soupEntryId,
                                    workDescription: null,
                                    AccountShipToC: item.Account_Ship_to__c,
                                    goOffTime:goTime,
                                    isNewWorkList:true
                                });
                            }
                        },
                        {
                            text: '<b>详情</b>',
                            type: 'button-positive',
                            onTap: function (e) {
                                $state.go('app.workDetails', {
                                    SendInfo: item._soupEntryId,
                                    workDescription: null,
                                    AccountShipToC: item.Account_Ship_to__c,
                                    isNewWorkList:false
                                });
                            }
                        }
                    ];
                }

                // 自定义弹窗
                myPopup = $ionicPopup.show({
                    title: item.Account_Ship_to__r.Name,
                    // subTitle: 'Please use normal things',
                    scope: $scope,
                    buttons: setButtons
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
            $rootScope.getSomeData = function () {
                $scope.getHomeService();
                document.getElementById("selectStatusId")[0].selected = true;
            }
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
                    if (element == "Work_Order") {
                        array[index].Service_Order_Type__c = "工单";
                    } else if (element == "Customer Consult") {
                        array[index].Service_Order_Type__c = "客户咨询";
                    } else if (element == "Customer Complaint") {
                        array[index].Service_Order_Type__c = "客户投诉";
                    }
                }
                return array;
            };


            $(document).ready(function () {
                var htmlEl = angular.element(document.querySelector('html'));
                htmlEl.on('click', function (event) {
                    // console.log('htmlEl.onclick',event);

                    if (event.target.nodeName === 'HTML') {
                        // console.log('event.target.nodeName',event.target.nodeName);
                        if (myPopup) {//myPopup即为popup
                            myPopup.close();
                        }
                    }
                });

                //使用对象记录重复的元素，以及出现的次数
                var getCount = function (arr) {
                    if (firstRunFun) {
                        calendarAll.fullCalendar("removeEvents");
                    } else {
                        firstRunFun = true;
                    }
                    var plan_Date_List = [];
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

                // 这里是ajax请求，替换为你正在使用的ajax方式就可以
                $scope.getHomeService = function () {
                    HomeService.getEachOrder().then(function (res) {

                        allUser = res;
                        $scope.allUser = res;

                        if (typeof (getOrderById(oCurrentUser.Id)) === 'undefined') {
                            currentOrder = allUser[0].orders
                        } else {
                            currentOrder = getOrderById(oCurrentUser.Id).orders;
                        }
                        //日历下方列表
                        allOrders = currentOrder;
                        $scope.currentOrder = getServiceOrderType(allOrders);
                        calendarAll.fullCalendar("addEventSource", getCount(currentOrder));
                        console.log('getEachOrder  ' , currentOrder);

                    }, function (error) {
                        console.log('getEachOrder Error ' ,error);
                    });
                };
                $scope.getHomeService();
                var calendarAll = $('#calendarAll').fullCalendar({
                    displayEventTime: false,
                    titleFormat: "MM",
                    // allDaySlot : false,
                    // allDayText:'今天的任务',
                    buttonText: {
                        today: '今天',
                        month: '月视图',
                        week: '周视图',
                    },
                    monthNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
                    monthNamesShort: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
                    dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
                    header: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'month,basicWeek'
                    },
                    dayClick: function (date, jsEvent, view) {

                        console.log("↓↓↓dayClick↓↓↓");
                        console.log('date: ' + date);
                        // console.log('jsEvent: ' + jsEvent);
                        // console.log('view: ' + view);
                        // $("tr:even").css("background-color", "#000");
                        var currentClickDate = date.format('YYYY-MM-DD');
                        var selectDateOrders = [];
                        for (let index = 0; index < currentOrder.length; index++) {//显示点击日期的工单

                            var indexDate = currentOrder[index].Plan_Date__c;
                            console.log("currentClickDate：", currentClickDate + "  indexDate:" + indexDate);

                            if (currentClickDate == indexDate) {
                                selectDateOrders.push(currentOrder[index]);
                            }
                        }
                        console.log("selectDateOrders.count", selectDateOrders.length + "   selectDateOrders:" + selectDateOrders);

                        if (selectDateOrders.length > 0) {
                            $scope.currentOrder = getServiceOrderType(selectDateOrders);
                        }
                    },
                    events: function (start, end, timezone, callback) {

                        console.log('events: function!:' + currentOrder);
                        // 数据处理，将返回的数据添加到events中

                        callback(getCount(currentOrder));

                    },
                    eventClick: function (event, jsEvent, view) {

                        // 此处可添加修改日程的代码
                        // var red = Math.round(255 * Math.random());
                        // var green = Math.round(255 * Math.random());
                        // var blue = Math.round(255 * Math.random());
                        // $(this).css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
                    }

                });

                $('.fc-month-button').on('click', function () {
                    var div = document.getElementById("orderListClassType");
                    div.className = 'big_Type_Group';

                });
                $('.fc-basicWeek-button').on('click', function () {
                    var div = document.getElementById("orderListClassType");
                    div.className = 'big_Type_Group changeHeight';
                });
                $scope.onSwipeRight = function () {
                    calendarAll.fullCalendar('prev');
                };
                $scope.onSwipeLeft = function () {
                    calendarAll.fullCalendar('next');

                };

                //////选择组员
                var province = document.getElementById("selectUserId");
                province.onchange = function () {
                    var index = province.options.selectedIndex;
                    currentOrder = allUser[index].orders;//当前选择组员的订单
                    document.getElementById("selectStatusId")[0].selected = true;
                    $scope.currentOrder = getServiceOrderType(allUser[index].orders);
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
                    calendarAll.fullCalendar("addEventSource", getCount(selectStatusUser));
                }
            });
        });

})();