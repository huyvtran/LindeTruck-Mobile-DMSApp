(function () {
    'use strict';
    angular.module('oinio.CalendarController', [])
        .controller('CalendarController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor, HomeService, $ionicPopup,
            LocalCacheService,ForceClientService,AppUtilService) {

            var vm = this,
                oCurrentUser = LocalCacheService.get('currentUser') || {};
            console.log('oCurrentUser!', oCurrentUser);
            var myPopup;
            var allUser = [];
            var allOrders = [];
            var allUserName = [];
            let events = [];
            var currentOrder = [];
            var firstRunFun = false;
            vm.isOnline = null;
            $scope.updateDataStatusUrl="/WorkDetailService?action=updateStatus";
            $scope.departureUrl="/WorkDetailService?action=departure&sooId=";

            $(document).ready(function () {
                document.addEventListener('click', newHandle);//初始化弹框

                // ///ionic 利用localStorage存储
                // var firstLogin = "";
                // //循环遍历，取key值firstLogin的value
                // for (var i = localStorage.length - 1; i >= 0; i--) {
                //     if (localStorage.key(i) == "firstLogin") {
                //         firstLogin = localStorage.getItem(localStorage.key(i));
                //         console.log("firstLogin1", firstLogin);
                //     }
                // }

                // if (firstLogin == "first") {
                //     console.log("firstLogin2", firstLogin); //初始化后 永远走此分支

                // } else {
                //     console.log("firstLogin3", firstLogin);
                //     localStorage.setItem("firstLogin", "first"); //初次存储
                // }

            });

          $scope.$on('$ionicView.beforeLeave', function () {
            console.log('移除点击事件');
            document.removeEventListener('click', newHandle);
          });

          //新加弹框点击事件
          var newHandle = function (e) {
            if (e.target === document.getElementById('add_bgbox_Btn')) {
              $scope.toDisplayModifyDiv();
            } else {
              if (document.getElementById('add_bgbox') && document.getElementById('add_bgbox').style) {
                document.getElementById('add_bgbox').style.display = 'none';//隐藏
              }
            }
          };

          $scope.toDisplayModifyDiv = function () {
            if (document.getElementById('add_bgbox').style.display == 'none') {
              document.getElementById('add_bgbox').style.display = '';//显示
            } else {
              document.getElementById('add_bgbox').style.display = 'none';//隐藏
            }
          };

            //未安排 未开始 进行中 已完成
            $scope.isOlder_Table = function (type) {
                var returnType = 'table_Right info_Icon';
                if (type === "Not Planned") {           //未安排
                    returnType = "table_Right info_Icon"
                } else if (type === "Not Started") {    //未开始
                    returnType = "table_Right warning_Icon"
                } else if (type === "Not Completed") {  //进行中
                    returnType = "table_Right workon_Icon "
                }else if (type === "Service Completed") {  //已完成
                    returnType = "table_Right checkmark_Icon "
                }
                return returnType;
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
                if (item.Status__c == "Not Planned") { //Not Planned   未安排  只显示详情和安排
                    setButtons = [
                        {
                            text: '<b>详情</b>',
                            type: 'button-assertive',
                            onTap: function (e) {
                                // $state.go('app.workDetails', {
                                //     SendInfo: item._soupEntryId,
                                //     workDescription: null,
                                //     AccountShipToC: item.Account_Ship_to__c,
                                //     goOffTime:null,
                                //     workOrderId:item.Id,
                                //     isNewWorkList:false
                                // });
                                $scope.goPageWorkDetails(item,false,null);
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
                                        SendSoupEntryId: item._soupEntryId,
                                        workOrderId:item.Id
                                    });

                                    return "anpai";
                                }
                            }
                        },
                        {
                            text: '<b>增派</b>',
                            type: 'button-calm',
                            onTap: function (e) {
                                
                            }
                        },
                        {
                            text: '<b>转派</b>',
                            type: 'button-balanced',
                            onTap: function (e) {

                            }
                        }
                    ];
                }

                else if(item.Status__c =="Not Started"){  //Not Started   未开始  只显示出发 详情
                    setButtons = [
                        { text: '出发',
                            onTap:function (e) {
                                //出发判断逻辑
                                $scope.goNotStartedWorkDetails(item);
                            }
                        },
                        {
                            text: '<b>详情</b>',
                            type: 'button-assertive',
                            onTap: function (e) {
                                // $state.go('app.workDetails', {
                                //     SendInfo: item._soupEntryId,
                                //     workDescription: null,
                                //     AccountShipToC: item.Account_Ship_to__c,
                                //     workOrderId:item.Id,
                                //     isNewWorkList:false
                                // });
                                $scope.goPageWorkDetails(item,false,null);
                            }
                        }
                    ];
                }
                else if (item.Status__c =="Not Completed"){  //Not Completed  进行中  只显示详情
                    setButtons=[
                        {
                            text: '编辑',
                            type: 'button-positive',
                            onTap:function (e) {
                                $scope.goPageWorkDetails(item,true,null);
                            }
                        },
                        {
                            text: '增派',
                            type: 'button-calm',
                            onTap:function (e) {

                            }
                        }
                    ];
                }
                else{  //Service Completed  已完成  只能查详情
                    setButtons=[
                        {
                            text: '<b>详情</b>',
                            type: 'button-assertive',
                            onTap: function (e) {
                                // $state.go('app.workDetails', {
                                //     SendInfo: item._soupEntryId,
                                //     workDescription: null,
                                //     AccountShipToC: item.Account_Ship_to__c,
                                //     workOrderId:item.Id,
                                //     isNewWorkList:false
                                // });
                                $scope.goPageWorkDetails(item,false,null);
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
            //出发逻辑判断
            $scope.goNotStartedWorkDetails = function (item) {
                for (let index = 0; index < currentOrder.length; index++) {
                    const element = currentOrder[index].On_Order__c;
                    if (element) {
                        setTimeout(function() {
                            myPopup = $ionicPopup.show({
                                title: "已经有进行中的工单",
                                scope: $scope,
                                buttons: null
                            });
                        },100);
                        return;
                    }
                }

                AppUtilService.showLoading();
                ForceClientService.getForceClient().apexrest(
                    $scope.updateDataStatusUrl + "&sooId=" + item.Id + "&status=Not Completed",
                    "POST",
                    {},
                    null, function callBack(res) {
                        console.log(res);
                        AppUtilService.hideLoading();
                        if (res.status.toLowerCase() == "success") {
                            $scope.getHomeService();//刷新日历列表数据 更改出发状态

                            var goTime = new Date();
                            // $state.go("app.workDetails",{
                            //     SendInfo: item._soupEntryId,
                            //     workDescription: null,
                            //     AccountShipToC: item.Account_Ship_to__c,
                            //     goOffTime:goTime,
                            //     workOrderId:item.Id,
                            //     isNewWorkList:true
                            // });
                            ForceClientService.getForceClient().apexrest(
                                $scope.departureUrl+item.Id+"&departureTime="+goTime.format("yyyy-MM-dd hh:mm:ss"),
                                'POST',
                                {},
                                null,
                                function callBack(res) {
                                    console.log(res);
                                    if (res.status.toLowerCase()=="success"){
                                        $scope.goPageWorkDetails(item, true, goTime);
                                    }else{
                                        $scope.updateOrderType(item,"Not Started");
                                    }
                                },
                                function error(msg) {
                                    console.log(msg);
                                    $scope.updateOrderType(item,"Not Started");
                                }
                            );
                        }else{
                            $ionicPopup.alert({
                                title:"更新工单状态失败"
                            });
                            return false;
                        }
                    }, function error(msg) {
                        console.log(msg);
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title:"更新工单状态失败"
                        });
                        return false;
                    }
                );
            };
            /**
             * 上传出发时间失败重新更改状态为未开始
             * @param obj
             * @param status
             */
            $scope.updateOrderType=function(obj,status){

                ForceClientService.getForceClient().apexrest(
                    $scope.updateDataStatusUrl + "&sooId=" + obj.Id + "&status=" + status,
                    "POST",
                    {},
                    null, function callBack(res) {
                        console.log(res);
                        //AppUtilService.hideLoading();
                        if (res.status.toLowerCase() == "success") {
                            $ionicPopup.alert({
                                title:"记录出发时间失败，重置为未开始状态"
                            });
                        }else{
                            $ionicPopup.alert({
                                title:"更新工单状态失败"
                            });
                            return false;
                        }
                    }, function error(msg) {
                        console.log(msg);
                        //AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title:"更新工单状态失败"
                        });
                        return false;
                    }
                );
            };

            /**
             * 日期格式化方法
             * @param format
             * @returns {*}
             */
            Date.prototype.format = function(format) {
                var date = {
                    "M+": this.getMonth() + 1,
                    "d+": this.getDate(),
                    "h+": this.getHours(),
                    "m+": this.getMinutes(),
                    "s+": this.getSeconds(),
                    "q+": Math.floor((this.getMonth() + 3) / 3),
                    "S+": this.getMilliseconds()
                };
                if (/(y+)/i.test(format)) {
                    format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
                }
                for (var k in date) {
                    if (new RegExp("(" + k + ")").test(format)) {
                        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
                    }
                }
                return format;
            };

            $scope.goPageWorkDetails = function (obj, isNewWork, goTime) {
                $state.go('app.workDetails', {
                    SendInfo: obj._soupEntryId,
                    workDescription: null,
                    AccountShipToC: obj.Account_Ship_to__c,
                    workOrderId: obj.Id,
                    enableArrivalBtn:true,
                    goOffTime: goTime,
                    isNewWorkList: isNewWork
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
            };
            $scope.toRepair1 = function () {
                $state.go('app.search_1');

            };
            $scope.toDisplayOrderListByData = function (currentClickDate) {
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

            };

            $scope.changeBackgroundColor = function(currentClickDate){
                let currEle = $('td.fc-day[data-date="' + currentClickDate + '"]');
                if(currEle != null && currEle.length > 0) {
                    console.log('currEle::',currEle);
                    if(currEle[0].style.backgroundColor === '#aaa' || currEle[0].style.backgroundColor === 'rgb(170, 170, 170)'){
                        currEle[0].style.backgroundColor = 'transparent';
                        $scope.resetAllDateBackground();
                    } else {
                        $scope.resetAllDateBackground();
                        currEle[0].style.backgroundColor = '#aaa';
                    }
                }
            };

            $scope.resetAllDateBackground = function(){
                $('td.fc-day').each(function (index, element) {
                    element.style.backgroundColor = 'transparent';
                });
            };

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
                        console.log('res  ' , res);
                        allUser = res;
                        $rootScope.allUser = res;

                        if (typeof (getOrderById(oCurrentUser.Id)) === 'undefined') {
                            currentOrder = allUser[0].orders;
                        } else {
                            currentOrder = getOrderById(oCurrentUser.Id).orders;
                        }
                        //日历下方列表
                        allOrders = currentOrder;
                        $scope.currentOrder = getServiceOrderType(allOrders);
                        calendarAll.fullCalendar("addEventSource", getCount(currentOrder));
                        console.log('getEachOrder  ' , currentOrder);
                        setTimeout(setDefaultUser, 500);
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
                        $scope.toDisplayOrderListByData(currentClickDate);
                        $scope.changeBackgroundColor(currentClickDate);
                    },
                    events: function (start, end, timezone, callback) {

                        console.log('events: function!:' + currentOrder);
                        // 数据处理，将返回的数据添加到events中

                        callback(getCount(currentOrder));

                    },
                    eventClick: function (event, jsEvent, view) {
                        console.log('eventClick: event.start._i!:' , event.start._i);
                        // 此处可添加修改日程的代码
                        // var red = Math.round(255 * Math.random());
                        // var green = Math.round(255 * Math.random());
                        // var blue = Math.round(255 * Math.random());
                        // $(this).css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
                        var currentClickDate = event.start._i
                        $scope.toDisplayOrderListByData(currentClickDate);
                        $scope.changeBackgroundColor(currentClickDate);

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

                //////接收home按钮选择跳转
                $rootScope.switchelectStatus = function (index) {
                    document.getElementById("selectStatusId")[index].selected = true;
                    selectStatusUserIndex(index);
                };

                //////选择组员
                var province = document.getElementById("selectUserId");
                let setDefaultUser = function() {
                    try {

                        console.log('匹配当前用户:ing');
                        for(let i=0;i<allUser.length;i++){
                            if(allUser[i].userId === oCurrentUser.Id){
                                console.log('匹配当前用户工单成功。');
                                $('#selectUserId option')[i].selected = 'selected';
                                var index = i;
                                currentOrder = allUser[index].orders;//当前选择组员的订单
                                document.getElementById("selectStatusId")[0].selected = true;
                                $scope.currentOrder = getServiceOrderType(allUser[index].orders);
                                calendarAll.fullCalendar("addEventSource", getCount(allUser[index].orders));
                            }
                        }
                    } catch (e) {
                        console.log('匹配当前用户:出错啦::',e);
                    }
                };
                setDefaultUser();
                province.onchange = function () {
                    console.log('onchange::');
                    var index = province.options.selectedIndex;
                    currentOrder = allUser[index].orders;//当前选择组员的订单
                    document.getElementById("selectStatusId")[0].selected = true;
                    $scope.currentOrder = getServiceOrderType(allUser[index].orders);
                    calendarAll.fullCalendar("addEventSource", getCount(allUser[index].orders));
                };




                //////选择状态
                var selectStatus = document.getElementById("selectStatusId");
                selectStatus.onchange = function () {
                    var index = selectStatus.options.selectedIndex;
                    selectStatusUserIndex(index);
                };

                var selectStatusUserIndex = function (index) {

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
