(function () {

    'use strict';
    angular.module('oinio.controllers')
      .controller('newWorkListController',
        function ($scope, $rootScope, $q,$filter, $state, $log, $stateParams, AppUtilService, ConnectionMonitor,
                  LocalCacheService, HomeService, $ionicPopup, ForceClientService, dualModeService, Service1Service) {

            var vm            = this,
                doOnline      = true,
                localTruckIds = [],
                oCurrentUser  = LocalCacheService.get('currentUser') || {};
            $scope.newDetailPostDataUrl = "/services/apexrest/NewWorkDetailService?";
            vm.isOnline = null;
            vm.adrs = [];
            vm.priorities = [];

            /**
             * @func    $scope.$on('$ionicView.beforeEnter')
             * @desc
             */
            $scope.$on('$ionicView.enter', function () {

                LocalCacheService.set('previousStateForSCReady', $state.current.name);
                LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

                vm.adrs.push({label: 'ZS01_Z10', value: 'Z10 按次收费服务'});
                vm.adrs.push({label: 'ZS01_Z11', value: 'Z11 代开票按次收费服务'});
                vm.adrs.push({label: 'ZS02_Z20', value: 'Z20 服务合同要求的服务'});
                vm.adrs.push({label: 'ZS02_Z21', value: 'Z21 合同期间长租车的服务（跨区域资产）'});
                vm.adrs.push({label: 'ZS02_Z22', value: 'Z22 合同期间长租车的服务（非跨区域资产-仅RE使用）'});
                vm.adrs.push({label: 'ZS03_Z30', value: 'Z30 资产（短租）车的服务'});
                vm.adrs.push({label: 'ZS03_Z31', value: 'Z31 库存（二手/新车）车的非销售要求的服务'});
                vm.adrs.push({label: 'ZS03_Z33', value: 'Z33 服务支持要求的服务'});
                vm.adrs.push({label: 'ZS03_Z35', value: 'Z35 工程师培训'});
                vm.adrs.push({label: 'ZS03_Z36', value: 'Z36 服务市场活动要求支持的服务'});
                vm.adrs.push({label: 'ZS03_Z38', value: 'Z38 跨区域要求的服务'});
                vm.adrs.push({label: 'ZS03_Z39', value: 'Z39 资产（短租）车的服务(上海)'});
                vm.adrs.push({label: 'ZS04_Z40', value: 'Z40 纯配件销售'});
                vm.adrs.push({label: 'ZS03_Z3A', value: 'Z3A 销售合同赠送的服务'});
                vm.adrs.push({label: 'ZS03_ZH1', value: 'ZH1 RC为HQ自用叉车提供维保'});
                vm.adrs.push({label: 'ZS03_ZH2', value: 'ZH2 测试车事务'});
                vm.adrs.push({label: 'ZS03_ZH3', value: 'ZH3 质量部质量分析'});
                vm.adrs.push({label: 'ZS03_ZH4', value: 'ZH4 防爆车交车前改装事务'});
                vm.adrs.push({label: 'ZS03_ZOC', value: 'ZOC 发车后订单修改'});
                vm.adrs.push({label: 'ZS03_ZR2', value: 'ZR2 长租资产化后加装、改装服务'});
                vm.adrs.push({label: 'ZS03_ZR3', value: 'ZR3 短租资产化后加装、改装服务'});
                vm.adrs.push({label: 'ZS03_ZSS', value: 'ZSS 一般销售支持'});
                vm.adrs.push({label: 'ZS03_ZTD', value: 'ZTD 运输损坏'});
                vm.adrs.push({label: 'ZS08_Z80', value: 'Z80 保修服务'});
                vm.adrs.push({label: 'ZS08_Z81', value: 'Z81 保修服务1'});
                vm.adrs.push({label: 'ZS08_Z82', value: 'Z82 保修服务2'});
                vm.adrs.push({label: 'ZS08_Z83', value: 'Z83 保修服务3'});

                vm.priorities.push({label: '紧急', value: 'Urgent'});
                vm.priorities.push({label: '高', value: 'High'});
                vm.priorities.push({label: '中', value: 'Medium'});
                vm.priorities.push({label: '低', value: 'Low'});

            });
            $scope.$on('$ionicView.afterEnter', function () {
                console.log('oCurrentUser:::', LocalCacheService.get('currentUser'));
                // check if device is online/offline
                vm.isOnline = ConnectionMonitor.isOnline();
                if (oCurrentUser) {
                    vm.username = oCurrentUser.Name;
                }

                $scope.contentItems = [];
                $scope.searchAcctText = '';

                $scope.contentTruckItems = [];
                $scope.searchTruckText = '';

                $scope.contentOwnerItems = [];
                $scope.searchOwnerText = '';

                $scope.searchResultAcctName = '';
                //$scope.searchResultCustomerNum ='';
                $scope.searchResultAcctId = '';
                $scope.searchResultAcctSoupId = '';

                $scope.searchResultTruckName = '';
                $scope.searchResultTruckNum = '';
                $scope.searchResultTruckId = '';
                $scope.searchResultTruckSoupId = '';

                $scope.searchResultOwnerName = '';
                $scope.searchResultOwnerNum = '';
                $scope.searchResultOwnerId = '';
                $scope.searchResultOwnerSoupId = '';
                $scope.searchTruckText = '';

                $scope.selectedTruckItems = [];

                $scope.initLatest3Orders = [];

                $scope.displayStandardInfo = true;
                $scope.displayHistory = true;
                $scope.defaultStandardInfoHeight = 0;
                $scope.defaultHistoryWorkHeight = 0;

                $scope.displayDatepicker = true;

                /*
                HomeService.getLatest3ServiceOrders().then(function (response) {
                    console.log("getLatest3ServiceOrders",response);

                    if (response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            if(response[index].Status__c == 'Not Started'){
                                response[index].Status__c = '未开始';
                            }
                            if(response[index].Status__c == 'Not Completed'){
                                response[index].Status__c = '未完成';
                            }
                            if(response[index].Status__c == 'Service Completed'){
                                response[index].Status__c = '已完成';
                            }
                            if(response[index].Status__c == 'End'){
                                response[index].Status__c = '已结束';
                            }
                            if(response[index].Status__c == 'Not Planned'){
                                response[index].Status__c = '未安排';
                            }
                        }
                        $scope.initLatest3Orders = response;
                        //console.log("getLatest3ServiceOrders",accountsName);
                    }
                }, function (error) {
                    $log.error('HomeService.getLatest3ServiceOrders Error ' + error);
                }).finally(function () {
                    //AppUtilService.hideLoading();
                });
                */

                let user = LocalCacheService.get('currentUser');
                if (user != null) {
                    Service1Service.getUserObjectById(
                      Number(localStorage.onoffline) !== 0 ? user.Id : user._soupEntryId,
                      Number(localStorage.onoffline)).then(function callBack(response) {
                        console.log("getUserObjectById::", response);
                        if (response != null) {
                            $scope.searchResultOwnerName = response.Name;
                            $scope.searchResultOwnerNum = response.Name;
                            $scope.searchResultOwnerId =
                              Number(localStorage.onoffline) !== 0 ? user.Id : user._soupEntryId;
                            $scope.searchResultOwnerSoupId = response._soupEntryId;
                        }
                    }, function error(msg) {
                        $log.error('Service1Service.getUserObjectById Error ' + error);
                    });
                }

                console.log('Begin::init animate node::');
                $scope.defaultStandardInfoHeight = document.querySelector("#newwork_standardInfo").scrollHeight + 'px';
                document.querySelector("#newwork_standardInfo").style.height = $scope.defaultStandardInfoHeight;
                $scope.defaultHistoryWorkHeight = document.querySelector("#newwork_historyWork").scrollHeight + 'px';
                document.querySelector("#newwork_historyWork").style.height = $scope.defaultHistoryWorkHeight;

                let currentDate = $scope.getCurrentDateString();
                $('#input_plandate').val(currentDate);
                let initDatePickerParamm = new Object();
                //initDatePickerParamm['startDate'] = currentDate;
                initDatePickerParamm['data-date-format'] = 'yyyy-mm-dd';

                var Instance_datepicker = $('#input_plandate').datepicker(initDatePickerParamm);

                Instance_datepicker.on('show', function (e) {
                    console.log('datepicker::show');
                    $scope.displayDatepicker = true;
                });
                Instance_datepicker.on('hide', function (e) {
                    console.log('datepicker::hide');
                    $scope.displayDatepicker = false;
                });

            });

            $scope.clickDatepickerIcon = function () {
                if ($scope.displayDatepicker) {
                    console.log('show>>>hide');
                    $('#input_plandate').datepicker('hide');
                } else {
                    console.log('hide>>show');
                    $('#input_plandate').datepicker('show');
                }
            };

            $scope.openSelectPage = function (ele) {
                console.log('cssss:::', $('#selectCustomer'));

                $('div.newWorkList_main').animate({
                    opacity: '0.6'
                }, 'slow', 'swing', function () {
                    $('div.newWorkList_main').hide();
                    $('div.newWorkList_truckSelect').animate({
                        opacity: '1'
                    }, 'normal').show();

                    if (ele === 'customer') {
                        $('#selectCustomer').css('display', 'block');
                        $('#selectTruck').css('display', 'none');
                        $('#selectOwner').css('display', 'none');
                    } else if (ele === 'truck') {
                        $('#selectTruck').css('display', 'block');
                        $('#selectCustomer').css('display', 'none');
                        $('#selectOwner').css('display', 'none');
                    } else if (ele === 'owner') {
                        $('#selectTruck').css('display', 'none');
                        $('#selectCustomer').css('display', 'none');
                        $('#selectOwner').css('display', 'block');
                    }
                });

            };

            $scope.closeSelectPage = function () {
                console.log('aaaaa');
                $('div.newWorkList_truckSelect').animate({
                    opacity: '0.6'
                }, 'slow', function () {
                    $('div.newWorkList_truckSelect').hide();
                    $('div.newWorkList_main').animate({
                        opacity: '1'
                    }, 'normal').show();
                });
            };

            $scope.cancleButton = function () {
                window.history.back();
            };

            /**
             * HomeService.searchAccounts to  dualModeService.queryAccountInfo
             * @param keyWord
             */
            $scope.getAccts = function (keyWord) {
                AppUtilService.showLoading();
                Service1Service.searchAccounts(keyWord, Number(localStorage.onoffline)).then(
                  function callBack(response) {
                      console.log("Service1Service", keyWord);
                      AppUtilService.hideLoading();
                      let accountsName = [];
                      let accountsId = [];
                      if (response != null && response.length > 0) {
                          for (let index = 0; index < response.length; index++) {
                              accountsName.push(response[index]);
                              accountsId.push(response[index].Id);
                          }
                          $scope.contentItems = accountsName;
                          $scope.getIds = accountsId;
                          console.log("Service1Service", accountsName);
                      } else {
                          var ionPop = $ionicPopup.alert({
                              title: "结果",
                              template: "没有客户数据"
                          });
                          ionPop.then(function () {
                              //$ionicHistory.goBack();
                              //$state.go("app.home");
                          });
                      }
                  }, function error(msg) {
                      AppUtilService.hideLoading();
                      $log.error('Service1Service.searchAccounts Error ' + msg.msg.responseText);
                  }).finally(function () {
                    AppUtilService.hideLoading();
                });
            };

            $scope.selectAccount = function (acct) {
                console.log('select:acct:', acct);
                if (acct.Name !== $scope.searchResultAcctName) {
                    $scope.selectedTruckItems = [];
                    $scope.updateTruckString();
                }
                $scope.searchResultAcctName = acct.Name;
                //$scope.searchResultCustomerNum = acct.Customer_Number__c;
                $scope.searchResultAcctId = acct.Id;
                $scope.searchResultAcctSoupId = acct._soupEntryId;

                //$scope.closeSelectPage();
                $scope.init20Trucks(acct.Id);

            };

            $scope.init20Trucks = function (keyWord) {
                $scope.contentTruckItems = [];
                console.log("init20Trucks1::", keyWord);
                HomeService.searchTruckFleets("", keyWord, "150", doOnline).then(function success(response) {
                    console.log(response);
                    let trucks = [];
                    if (response != null && response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            trucks.push(response[index]);
                        }
                        $scope.contentTruckItems = trucks;
                        console.log("init20Trucks", trucks);
                    }
                    //offline
                    //return HomeService.getLatest3ServiceOrders($scope.searchResultAcctSoupId);
                    //online
                    return Service1Service.getLatest3ServiceOrders($scope.searchResultAcctId,
                      Number(localStorage.onoffline));
                }, function error(msg) {
                    console.log(msg.responseText);
                }).then(function (response) {
                    console.log("getLatest3ServiceOrders", response);

                    if (response != null && response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            if (response[index].Status__c == 'Not Started') {
                                response[index].Status__c = '未开始';
                            }
                            if (response[index].Status__c == 'Not Completed'||response[index].Status__c == 'Waiting for Parts'||response[index].Status__c == 'Assigned'||response[index].Status__c == 'Abnormal feedback'||response[index].Status__c == 'Quoting'||response[index].Status__c == 'Applying Debt Release') {
                                response[index].Status__c = '未完成';
                            }
                            if (response[index].Status__c == 'Service Completed'|| response[index].Status__c == 'Field Work Done') {
                                response[index].Status__c = '已完成';
                            }
                            if (response[index].Status__c == 'End') {
                                response[index].Status__c = '已结束';
                            }
                            if (response[index].Status__c == 'Not Planned'||response[index].Status__c == 'to be assigned') {
                                response[index].Status__c = '未安排';
                            }
                        }
                        $scope.initLatest3Orders = response;
                        //console.log("getLatest3ServiceOrders",accountsName);
                    }
                }, function (error) {
                    $log.error('Service1Service.getLatest3ServiceOrders Error ', error);
                }).finally(function () {
                    //AppUtilService.hideLoading();
                    $scope.closeSelectPage();
                });
            };

            $scope.getUsers = function (keyWord) {
                //online
                Service1Service.getUsersObjectByName(keyWord, Number(localStorage.onoffline)).then(
                  function callBack(response) {
                      console.log("getUsersObjectByName", keyWord);
                      let users = [];
                      if (response != null && response.length > 0) {
                          for (let index = 0; index < response.length; index++) {
                              users.push(response[index]);
                          }
                          $scope.contentOwnerItems = users;
                          console.log("getUsersObjectByName22::", users);
                      } else {
                          var ionPop = $ionicPopup.alert({
                              title: "结果",
                              template: "没有用户数据"
                          });
                          ionPop.then(function () {
                              //$ionicHistory.goBack();
                              //$state.go("app.home");
                          });
                      }
                  }, function error(msg) {
                      $log.error('HomeService.getUsersObjectByName Error ' + error);
                  }).finally(function () {

                });
            };

            $scope.selectUser = function (user) {
                console.log('select:user:', user);

                $scope.searchResultOwnerName = user.Name;
                $scope.searchResultOwnerNum = user.Name;
                $scope.searchResultOwnerId = user.Id;
                $scope.searchResultOwnerSoupId = user._soupEntryId;

                $scope.closeSelectPage();
            };

            $scope.getTrucks = function (keyWord) {
                AppUtilService.showLoading();
                $scope.getTrucksStep1(keyWord).then(function () {
                    AppUtilService.hideLoading();
                    return $scope.getTrucksStep2();
                });
            };

            $scope.getTrucksStep1=function(keyWord){
                let deferred =$q.defer();
                $scope.contentTruckItems = [];
                HomeService.searchTruckFleets(keyWord, $scope.searchResultAcctId, "150", doOnline).then(
                    function success(response) {
                        AppUtilService.hideLoading();
                        console.log(response);
                        let trucks = [];
                        if (typeof (response) == "string") {
                            $ionicPopup.alert({
                                title: response
                            });
                            return false;
                        }
                        if (response != null && response.length > 0) {
                            for (let index = 0; index < response.length; index++) {
                                trucks.push(response[index]);
                            }
                            $scope.contentTruckItems = trucks;
                            deferred.resolve('');
                            console.log("getTrucks", trucks);
                        } else {
                            $ionicPopup.alert({
                                title: "结果",
                                template: "没有数据"
                            });
                            return false;
                        }
                    }, function error(msg) {
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title: msg.responseText
                        });
                        console.log(msg.responseText);
                        return false;
                    });
                return deferred.promise;
            };

            $scope.getTrucksStep2=function(){
                for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                    $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                        if ($(element).attr("data-recordid") == $scope.selectedTruckItems[i].Id) {
                            $(this).prop("checked", true);
                        }
                    });
                }
            };


            $scope.scanCode = function () {
                    cordova.plugins.barcodeScanner.scan(
                      function (result) {
                          //扫码成功后执行的回调函数
                          console.log('result', result);
                          $scope.searchTruckText = result.text;
                          $scope.getTrucksWithKey(result.text);
                      },
                      function (error) {
                          //扫码失败执行的回调函数
                          alert('Scanning failed: ' + error);
                      }, {
                          preferFrontCamera: false, // iOS and Android 设置前置摄像头
                          showFlipCameraButton: false, // iOS and Android 显示旋转摄像头按钮
                          showTorchButton: true, // iOS and Android 显示打开闪光灯按钮
                          torchOn: false, // Android, launch with the torch switched on (if available)打开手电筒
                          prompt: "在扫描区域内放置二维码", // Android提示语
                          resultDisplayDuration: 500, // Android, display scanned text for X ms.
                          //0 suppresses it entirely, default 1500 设置扫码时间的参数
                          formats: "QR_CODE", // 二维码格式可设置多种类型
                          orientation: "portrait", // Android only (portrait|landscape),
                                                   //default unset so it rotates with the device在安卓上 landscape 是横屏状态
                          disableAnimations: true, // iOS     是否禁止动画
                          disableSuccessBeep: false // iOS      禁止成功后提示声音 “滴”
                      }
                    );

                };


            $scope.searchChange = function () {

            };

            $scope.saveServiceOrder = function () {
                if ($scope.searchResultAcctName == '') {
                    $ionicPopup.alert({
                        title: "请选择客户名称 !"
                    });
                    return;
                }
                AppUtilService.showLoading();

                let order2Save = new Object();
                let userId = $scope.searchResultOwnerId;

                order2Save.Account_Ship_to__c = $scope.searchResultAcctId;
                order2Save.Subject__c = $("#textarea_desc").val();
                let orderType = $("#select_serviceorder_type").val();
                if (orderType != null && orderType != '') {order2Save.Service_Order_Type__c = orderType;}

                let orderPriority = $("#select_serviceorder_priority").val();
                if (orderPriority != null && orderPriority != '') {order2Save.Priority__c = orderPriority;}

                order2Save.Plan_Date__c = $('#input_plandate').val();

                for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                    localTruckIds.push({"Id": $scope.selectedTruckItems[i].Id});
                }

                if (userId != null && userId != '') {
                    //online
                    Service1Service.getUserObjectById(userId, Number(localStorage.onoffline)).then(
                      function callBack(response) {
                          console.log("getUserObjectById::", response);
                          if (response != null) {
                              order2Save.Service_Order_Owner__c = userId;
                              //order2Save.Service_Order_Owner__r = response;

                              if (Number(localStorage.onoffline) !== 0) {
                                  ForceClientService.getForceClient().apexrest(
                                    $scope.newDetailPostDataUrl + "adrs=" + JSON.stringify([order2Save]) + "&trucks="
                                    + JSON.stringify(localTruckIds),
                                    "POST",
                                    {},
                                    null,
                                    function callBack(res) {
                                        console.log(res);
                                        AppUtilService.hideLoading();
                                        if (res.status.toLowerCase() == "success") {
                                            var currentWorkOrderId = res.message.split(":")[1];
                                            // if ($('#input_plandate').val()!=""){
                                            //     $scope.updateWorkOrderStatus(currentWorkOrderId,'Not Completed');
                                            // }else{
                                            //     $scope.updateWorkOrderStatus(currentWorkOrderId,'Not Planned');
                                            // }
                                            $state.go('app.workDetails',
                                              {   //SendInfo: addResult[0]._soupEntryId,
                                                  workDescription: $("#textarea_desc").val(),
                                                  AccountShipToC: $scope.searchResultAcctId,
                                                  goOffTime: "",
                                                  isNewWorkList: true,
                                                  enableArrivalBtn: false,
                                                  selectWorkTypeIndex: $('option:selected',
                                                    '#select_serviceorder_type').index(),
                                                  workOrderId: currentWorkOrderId,
                                                  accountId: $scope.searchResultAcctId,
                                                  orderBelong: true
                                              });
                                            $rootScope.getSomeData();//刷新日历下方工单列表

                                        } else {
                                            $ionicPopup.alert({
                                                title: "保存失败",
                                                template:res.message
                                            });
                                            return false;
                                        }
                                    },
                                    function error(msg) {
                                        console.log(msg);
                                        AppUtilService.hideLoading();
                                        $ionicPopup.alert({
                                            title: "保存失败",
                                            template:msg.responseText
                                        });
                                        return false;
                                    }
                                  );
                              } else {
                                  var nowDate = new Date();
                                  var nowMonth = "";
                                  var nowDay = "";
                                  if (nowDate.getMonth().toString().length == 1) {
                                      nowMonth = '0' + (nowDate.getMonth() + 1);
                                  } else {
                                      nowMonth = (nowDate.getMonth() + 1).toString();
                                  }

                                  if (nowDate.getDate().toString().length == 1) {
                                      nowDay = '0' + nowDate.getDate();
                                  } else {
                                      nowDay = nowDate.getDate().toString();
                                  }

                                  Service1Service.getNameForNewServiceOrder(nowDate.getFullYear().toString(), nowMonth,
                                    nowDay).then(function callBack(resp) {
                                      console.log(resp);
                                      order2Save.Name = resp;
                                      Service1Service.newWorkDetailSaveAction([order2Save], null).then(
                                        function callBack(res) {
                                            console.log(res);
                                            AppUtilService.hideLoading();
                                            if (res[0].success) {
                                                if ($('#input_plandate').val() != "") {
                                                    $scope.updateWorkOrderStatus(res[0]._soupEntryId, 'Not Completed');
                                                } else {
                                                    $scope.updateWorkOrderStatus(res[0]._soupEntryId, 'Not Planned');
                                                }
                                                $state.go('app.workDetails',
                                                  {
                                                      SendInfo: res[0]._soupEntryId,
                                                      workDescription: $("#textarea_desc").val(),
                                                      AccountShipToC: $scope.searchResultAcctId,
                                                      goOffTime: "",
                                                      isNewWorkList: true,
                                                      enableArrivalBtn: false,
                                                      selectWorkTypeIndex: $('option:selected',
                                                        '#select_serviceorder_type').index(),
                                                      workOrderId: null,
                                                      accountId: $scope.searchResultAcctId,
                                                      orderBelong: true
                                                  });
                                                $rootScope.getSomeData();//刷新日历下方工单列表

                                            } else {
                                                $ionicPopup.alert({
                                                    title: "保存失败"
                                                });
                                                return false;
                                            }
                                        }, function error(msg) {
                                            console.log(msg.responseText);
                                            AppUtilService.hideLoading();
                                            $ionicPopup.alert({
                                                title: "保存失败",
                                                template:msg.responseText
                                            });
                                            return false;
                                        });
                                  }, function error(msg) {
                                      console.log(msg.responseText);
                                      AppUtilService.hideLoading();
                                      $ionicPopup.alert({
                                          title: msg.responseText
                                      });
                                      return false;
                                  });
                              }
                          }
                      }, function error(msg) {
                          console.log(msg.responseText);
                          AppUtilService.hideLoading();
                          $log.error('Service1Service.getUserObjectById Error ' + error);
                            $ionicPopup.alert({
                                title: msg.responseText
                            });
                            return false;
                      });
                }
            };

            $scope.changeTruckTab = function (index) {
                console.log('cssss:::', $('#selectCustomer'));
                if (index === '1') {
                    $("#selectTruck_Tab_1").addClass("selectTruck_Tab_Active");
                    $("#selectTruck_Tab_2").removeClass("selectTruck_Tab_Active");

                    $('#selectTruck_result').css('display', 'block');
                    $('#selectTruck_checked').css('display', 'none');
                } else if (index === '2') {
                    $("#selectTruck_Tab_1").removeClass("selectTruck_Tab_Active");
                    $("#selectTruck_Tab_2").addClass("selectTruck_Tab_Active");

                    $('#selectTruck_result').css('display', 'none');
                    $('#selectTruck_checked').css('display', 'block');
                }
            };

            $scope.checkAllSearchResults = function () {
                let ele = $("#ckbox_truck_searchresult_all");

                console.log('checkAllSearchResults:::', ele.prop("checked"));
                if (ele.prop("checked")) {
                    $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                        $(this).prop("checked", true);
                    });

                    angular.forEach($scope.contentTruckItems, function (searchResult) {
                        let existFlag = false;
                        angular.forEach($scope.selectedTruckItems, function (selected) {
                            if (searchResult.Id == selected.Id) {
                                existFlag = true;
                            }
                        });
                        if (!existFlag) {
                            $scope.selectedTruckItems.push(searchResult);
                            $scope.updateTruckString();
                        }
                    });
                    let mk = '';
                    if ($scope.selectedTruckItems.length > 0) {
                        mk = $scope.selectedTruckItems[0].Maintenance_Key__c;
                        for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                            if (mk != $scope.selectedTruckItems[i].Maintenance_Key__c) {
                                $scope.selectedTruckItems.splice(i, 1);
                                ele.prop("checked", false);
                                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                                    if (i == index) {
                                        $(this).prop("checked", false);
                                    }
                                });
                                $scope.updateTruckString();
                                $ionicPopup.alert({
                                    title: '保养只能选择同保养策略的车'
                                });
                                return;
                            }
                        }
                    }
                } else {

                    $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                        console.log('666:::', element.checked);
                        element.checked = false;
                    });

                    let arr_temp = [];
                    angular.forEach($scope.selectedTruckItems, function (selected) {
                        let existFlag = false;
                        angular.forEach($scope.contentTruckItems, function (searchResult) {
                            if (searchResult.Id == selected.Id) {
                                existFlag = true;
                            }
                        });
                        if (!existFlag) {
                            arr_temp.push(selected);
                        }
                    });
                    $scope.selectedTruckItems = arr_temp;
                    $scope.updateTruckString();

                }
            };

            $scope.checkSearchResults = function (ele) {
                let element = $("input.ckbox_truck_searchresult_item[data-recordid*='" + ele.Id + "']");
                console.log('checkSearchResults::', element);

                if (element != null && element.length > 0) {
                    if (element[0].checked) {
                        let existFlag = false;
                        for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                            if (ele.Id == $scope.selectedTruckItems[i].Id) {
                                existFlag = true;
                            }
                        }
                        if (!existFlag) {
                            if ($scope.selectedTruckItems.length > 0) {
                                if ($scope.selectedTruckItems[0].Maintenance_Key__c == ele.Maintenance_Key__c) {
                                    $scope.selectedTruckItems.push(ele);
                                    $scope.updateTruckString();
                                } else {
                                    element[0].checked = false;
                                    $ionicPopup.alert({
                                        title: '保养只能选择同保养策略的车'
                                    });
                                    return;
                                }
                            } else {
                                $scope.selectedTruckItems.push(ele);
                                $scope.updateTruckString();
                            }
                        }
                    } else {
                        let temp = [];
                        for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                            if (ele.Id != $scope.selectedTruckItems[i].Id) {
                                temp.push($scope.selectedTruckItems[i]);
                            }
                        }
                        $scope.selectedTruckItems = temp;
                        $scope.updateTruckString();
                    }
                } else {
                    console.log('checkSearchResults::error');
                }
            };

            $scope.checkboxTrucks = function (truck) {
                //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));

                $scope.searchResultTruckName = truck.Name;
                $scope.searchResultTruckNum = truck.Model__c;
                $scope.searchResultTruckId = truck.Id;
                $scope.searchResultTruckSoupId = truck._soupEntryId;

                $scope.closeSelectPage();
            };

            $scope.delSelectedItem = function (ele) {
                //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
                let new_temp = [];

                for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                    if (ele.Id != $scope.selectedTruckItems[i].Id) {
                        new_temp.push($scope.selectedTruckItems[i]);
                    }
                }

                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    if ($(element).attr("data-recordid") == ele.Id && element.checked) {
                        element.checked = false;
                    }
                });
                document.getElementById("ckbox_truck_searchresult_all").checked = false;

                $scope.selectedTruckItems = new_temp;
                $scope.updateTruckString();

            };

            $scope.delAllSelectedItem = function () {
                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    element.checked = false;
                });
                document.getElementById("ckbox_truck_searchresult_all").checked = false;

                $scope.selectedTruckItems = [];
                $scope.updateTruckString();
            };

            $scope.updateTruckString = function () {
                let new_temp = '';

                for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                    new_temp = new_temp + $scope.selectedTruckItems[i].Name + ';';
                }

                $scope.searchResultTruckName = new_temp;

            };

            $scope.getCurrentDateString = function () {
                let d = new Date().getDate();
                let m = new Date().getMonth() + 1;
                let y = new Date().getFullYear();

                if (d < 10) {
                    d = '0' + d;
                }
                if (m < 10) {
                    m = '0' + m;
                }
                return y + '-' + m + '-' + d;
            };

            $scope.showStandardInfo = function () {
                $scope.displayStandardInfo = !$scope.displayStandardInfo;
                if ($scope.displayStandardInfo) {
                    document.querySelector("#newwork_standardInfo").style.height = $scope.defaultStandardInfoHeight;
                } else {
                    document.querySelector("#newwork_standardInfo").style.height = '0px';
                }
            }

            $scope.showHistoryWork = function () {
                $scope.displayHistory = !$scope.displayHistory;
                if ($scope.displayHistory) {
                    document.querySelector("#newwork_historyWork").style.height = $scope.defaultHistoryWorkHeight;
                } else {
                    document.querySelector("#newwork_historyWork").style.height = '0px';
                }
            }

            $scope.updateWorkOrderStatus = function (currentOrderId, orderStatus) {
                dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline), currentOrderId,
                  orderStatus).then(function callBack(res) {
                    console.log(res);
                }, function error(msg) {
                    console.log(msg.responseText);
                });
            };

        }).directive('repeatFinish', function () {
        return {
            controller: function ($scope, $element, $attrs) {

            },
            link: function (scope, element, attr, controller) {
                console.log('scope::', scope);
                if (scope.$last == true) {
                    console.log('ng-repeat element render finished.');
                    scope.$parent.defaultHistoryWorkHeight =
                      document.querySelector("#newwork_historyWork").scrollHeight + 'px';
                    document.querySelector("#newwork_historyWork").style.height =
                      scope.$parent.defaultHistoryWorkHeight;
                }
            }
        }
    });

})();
