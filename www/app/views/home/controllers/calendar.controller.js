(function () {
  'use strict';
  angular.module('oinio.controllers')
    .controller('CalendarController',
      function ($scope, $rootScope,$q, $filter, $state, $stateParams, ConnectionMonitor, $ionicPopup,
                LocalCacheService, ForceClientService, AppUtilService , $log, FileService, $cordovaAppVersion, Service1Service,dualModeService,$cordovaFile) {

        var vm           = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);
        var myPopup;
        var allUser = [];
        var allOrders = [];
        var selectStatusIndex = 0;
        $rootScope.allUser = [];
        $scope.allLoginUser = [];
          let events = [];
        var currentOrder = [];
        var firstRunFun = false;
        $scope.firstRunWorkPlan = false;
        var workPlanEvents = [];
        $scope.changeTabFlag = '1';
        $scope.workPlanTypes = [];
        $scope.workPlanUsers = [];
        $scope.allWorkPlanData = [];
        $scope.currentWorkPlan = [];
        $scope.workPlanCalendar = null;
        $scope.getWorkPlanCount = null;
        $scope.vmVersion = "";
        vm.isOnline = null;
        $scope.updateDataStatusUrl = '/WorkDetailService?action=updateStatus';
        $scope.departureUrl = '/WorkDetailService?action=departure&sooId=';
        $scope.getInitDataUri = '/WorkDetailService';
        $scope.codeText = '发送验证码';
        var timer_num = 60;
        var getRandomSms;
        var getUserNumber;
        $rootScope.selectUserId = '';

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
          $scope.personName = oCurrentUser.Name;
          $scope.personDate = new Date().format('YYYY-MM-dd');


          if ($cordovaAppVersion) {
            $cordovaAppVersion.getVersionNumber().then(function (version) {
              $scope.vmVersion = version;
            });
          }



          // ///ionic 利用localStorage存储
          var firstLogin = "";
          //循环遍历，取key值firstLogin的value
          for (var i = localStorage.length - 1; i >= 0; i--) {
            if (localStorage.key(i) == "firstLogin") {
              firstLogin = localStorage.getItem(localStorage.key(i));
              console.log("firstLogin1", firstLogin);
            }
            if (localStorage.key(i) == "selectUserId") {
              $rootScope.selectUserId = localStorage.getItem(localStorage.key(i));
            }
          }


            let path = cordova.file.dataDirectory;
            let isNeedLevel2Login = false;
            $cordovaFile.readAsText(path, "isNeedLevel2Login.txt").then(function (result) {
                console.log('readAsText::result::',result);
                if(result == 'isNeedLevel2Login'){
                    isNeedLevel2Login = true;

                }
                console.log('isNeedLevel2Login::',isNeedLevel2Login);
                if (firstLogin == "first" && (isNeedLevel2Login == false )) {
                    console.log("firstLogin2", firstLogin); //初始化后 永远走此分支
                    $rootScope.hideTabs = false;
                    $('div.login_bodyer').hide();
                    $('div.calendar_header').show();
                    setTimeout(function () {
                        $scope.getHomeService();

                    }, 1000);

                }else {
                    $rootScope.hideTabs = true;
                    $('div.calendar_header').hide();
                    $('div.login_bodyer').show();

                }
            }, function (error2) {
                console.log('readAsText::error2::',error2);
                if (firstLogin == "first" ) {
                    console.log("firstLogin2", firstLogin); //初始化后 永远走此分支
                    $rootScope.hideTabs = false;
                    $('div.login_bodyer').hide();
                    $('div.calendar_header').show();
                    setTimeout(function () {
                        $scope.getHomeService();

                    }, 1000);

                }else {
                    $rootScope.hideTabs = true;
                    $('div.calendar_header').hide();
                    $('div.login_bodyer').show();

                }
            });

        });

        $scope.hideLoadingPage = function () {
          var inputSMSId = $('#inputSMSId').val();

          if (!inputSMSId) {
            var ionPop = $ionicPopup.alert({
              title: '请填写验证码'
            });
            ionPop.then(function () {
            });
            return;
          }
          if (getRandomSms!=inputSMSId){
            var ionPop = $ionicPopup.alert({
              title: '验证码错误'
            });
            ionPop.then(function () {
            });
            return;
          }
          var getUserObj = JSON.parse($('#selectLoginUserId option:selected').val());
          if (getUserNumber!=getUserObj.Mobile__c){
            var ionPop = $ionicPopup.alert({
              title: '验证码与手机号不符'
            });
            ionPop.then(function () {
            });
            return;
          }

          setTimeout(function () {
            $rootScope.hideTabs = false;
            $('div.login_bodyer').hide();
            $('div.calendar_header').show();
          }, 100);
          $rootScope.selectUserId = getUserObj.Id;

            let path = cordova.file.dataDirectory;
            $cordovaFile.writeFile(path, "isNeedLevel2Login.txt", "", true).then(function (writesuccess) {
                console.log('writesuccess::success::',writesuccess);
                $cordovaFile.readAsText(path, "isNeedLevel2Login.txt").then(function (result) {
                    console.log('readAsText::result::',result);
                    //return JSON.parse(result);
                }, function (error2) {
                    console.log('readAsText::error2::',error2);
                });
            }, function (writeerror) {
                console.log('writesuccess::writeerror::',writeerror);
            });

          localStorage.setItem("firstLogin", "first"); //初次存储
          localStorage.setItem("selectUserId", getUserObj.Id);

          $scope.getHomeService();

        };

        $scope.sendSMS = function () {
          if (timer_num != 60){
            return;
          } else {
            // AppUtilService.showLoading();
            var getUserObj = JSON.parse($('#selectLoginUserId option:selected').val());
            getUserNumber = getUserObj.Mobile__c;
            getRandomSms = Math.floor(Math.random()*(9999-1000))+1000;
            console.log('发送getUserNumberVar',getUserNumber);
            console.log('发送getRandomSms',getRandomSms);
            ForceClientService.getForceClient().apexrest(
              '/LoginService?action=sendSMS&phone='+getUserNumber+'&code='+getRandomSms,
              'GET',
              {},
              null, function callBack(res) {
                console.log('sendSMS:', res);
                // AppUtilService.hideLoading();
                if(res.status =="Fail"){
                  var ionPop = $ionicPopup.alert({
                    title: res.message
                  });
                  ionPop.then(function () {
                  });
                }
              }, function error(msg) {
                console.log('sendSMS::ERROR:::', msg);
                // AppUtilService.hideLoading();
                return false;
              }
            );
          }
          timer_num--;

          var smsdiv = document.getElementById('smsdiv');
          var timeClock=setInterval(function(){
            timer_num--;
            $scope.codeText = '重新发送（'+timer_num+'）';
            if (timer_num == 0) {
              clearInterval(timeClock);
              timer_num = 60;
              $scope.codeText = '发送验证码';
              smsdiv.style.background = '#aa0020';
            }else {
              smsdiv.style.background = '#979797';
            }
          },1000)
        };

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
          if (type === 'Not Planned') {           //未安排
            returnType = 'table_Right info_Icon';
          } else if (type === 'Not Started') {    //未开始
            returnType = 'table_Right warning_Icon';
          } else if (type === 'Not Completed') {  //进行中
            returnType = 'table_Right workon_Icon ';
          } else if (type === 'Service Completed') {  //已完成
            returnType = 'table_Right checkmark_Icon ';
          }
          return returnType;
        };

        $scope.addNewWork = function () {
          $state.go('app.newWork');
        };
        $scope.addNewOffer = function () {
          $state.go('app.newOffer');
        };

        $scope.checkOrderBelong=function(ownerId,currentUserId){
            if (ownerId === currentUserId) {
                return true;
            } else {
                return false;
            }
        };
          var isBelongCurrentUser=true;
        // Triggered on a button click, or some other target
        $scope.showPopup = function (item) {
          console.log('showPopup!allUser', allUser);
          console.log('showPopup!item', item);
          isBelongCurrentUser =$scope.checkOrderBelong(item.Service_Order_Owner__c,oCurrentUser.Id);
          $scope.data = {};
          var setButtons = [];
          if (item.Status__c == 'Not Planned' || item.Status__c == 'to be assigned' ) { //Not Planned   未安排  只显示详情和安排
            setButtons = [
              {
                text: '<b>编辑</b>',
                type: 'button-positive',
                onTap: function (e) {
                  // $state.go('app.workDetails', {
                  //     SendInfo: item._soupEntryId,
                  //     workDescription: null,
                  //     AccountShipToC: item.Account_Ship_to__c,
                  //     goOffTime:null,
                  //     workOrderId:item.Id,
                  //     isNewWorkList:false
                  // });
                  $scope.goPageWorkDetails(item, true, null,isBelongCurrentUser,false);
                }
              },
              {
                text: '<b>安排</b>',
                type: 'button-assertive',
                onTap: function (e) {
                  {
                    console.log('Tapped！!', allUser);
                    var listDataAll = angular.toJson(allUser);
                    $state.go('app.arrange', {
                      SendAllUser: listDataAll,
                      SendSoupEntryId: item._soupEntryId,
                      workOrderId: item.Id
                    });

                    return 'anpai';
                  }
                }
              }
              , {
                text: '<b>增派</b>',
                type: 'button-calm',
                onTap: function (e) {
                  $state.go(
                    'app.sendMorePeople',
                    {workOrderId: Number(localStorage.onoffline) !== 0 ? item.Id : item._soupEntryId});
                }
              }
              // {
              //   text: '<b>转派</b>',
              //   type: 'button-balanced',
              //   onTap: function (e) {
              //     $state.go('app.transfer', {workOrderId: Number(localStorage.onoffline) !== 0 ? item.Id : item._soupEntryId});
              //   }
              // }
            ];
          } else if (item.Status__c == 'Not Started') {  //Not Started   未开始  只显示出发 详情
            setButtons = [
              {
                  text: '<b>编辑</b>',
                  type: 'button-positive',
                  onTap: function (e) {
                      $scope.goPageWorkDetails(item, true, null,isBelongCurrentUser,false);
                  }
              },
              {
                text: '<b>出发</b>',
                type: 'button-assertive',
                onTap: function (e) {
                  //出发判断逻辑
                  if(canDeparture){
                      canDeparture=false;
                      try{
                          $scope.goNotStartedWorkDetails(item).then(function (ServiceCarInfo) {
                              return $scope.doDepartureOrder(ServiceCarInfo);
                          }).then(function () {
                              var resp=$("#serviceCarSelectFirst").val()!=undefined&&$("#serviceCarSelectFirst").val()!=null?$("#serviceCarSelectFirst").val():"";
                              return $scope.updateDepartureOrderStatus(item,resp);
                          });
                      }catch (ex) {
                          console.log('ex::',ex);
                          deferred.reject(ex);
                      }
                  }
                }
              }
              // , {
              //     text: '<b>转派</b>',
              //     type: 'button-balanced',
              //     onTap: function (e) {
              //         $state.go('app.transfer', {workOrderId: item.Id,userId:$('#selectUserId option:selected').val()});
              //     }
              // }
            ];
          } else if (item.Status__c == 'Not Completed' || item.Status__c == 'Waiting for Parts' || item.Status__c == 'Assigned' || item.Status__c == 'Abnormal feedback' || item.Status__c == 'Quoting'|| item.Status__c == 'Applying Debt Release') {  //Not Completed  进行中  只显示详情
            setButtons = [
              {
                text: '<b>编辑</b>',
                type: 'button-positive',
                onTap: function (e) {
                  $scope.goPageWorkDetails(item, true, null,isBelongCurrentUser,false);
                }
              }
              , {
                text: '<b>增派</b>',
                type: 'button-calm',
                onTap: function (e) {
                  $state.go('app.sendMorePeople', {workOrderId: item.Id});
                }
              }
              // {
              //     text: '<b>转派</b>',
              //     type: 'button-balanced',
              //     onTap: function (e) {
              //         $state.go('app.transfer', {workOrderId: item.Id,userId:$('#selectUserId option:selected').val()});
              //     }
              // }
            ];
          } else if (item.Status__c == 'Service Completed'||item.Status__c == 'Field Work Done') {  //Service Completed  已完成  只能查详情
            setButtons = [
              {
                text: '<b>打印</b>',
                type: 'button-assertive',
                onTap: function (e) {
                  $scope.goPageWorkDetails(item, false, null,false,true);
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
        var canDeparture =true;
        var departTurePop =null;
        var defaultServiceCar = "";
        //出发逻辑判断
        $scope.goNotStartedWorkDetails = function (item) {
            let deferred = $q.defer();
          AppUtilService.showLoading();
          for (let index = 0; index < $scope.currentOrder.length; index++) {
            const element = $scope.currentOrder[index].On_Order__c;
            if (element) {
              setTimeout(function () {
                myPopup = $ionicPopup.show({
                  title: '已经有进行中的工单',
                  scope: $scope,
                  buttons: null
                });
                  AppUtilService.hideLoading();
              }, 100);
              return;
            }
          }
          console.log('oCurrentUserL:',oCurrentUser);
          console.log('dmsUserId::',$rootScope.selectUserId);
          ForceClientService.getForceClient().apexrest(
            '/ServiceCarService?action=initDMS&currentUser='+$rootScope.selectUserId,
            'GET',
            {},
            null,
            function callBack(res) {
                canDeparture=true;
                AppUtilService.hideLoading();
                console.log(res);
                $scope.serviceCars = [];
                //$scope.serviceCars.push("");
                if (res!=null&&res.length>0){
                    for (var i=0;i<res.length;i++){
                        defaultServiceCar=res[0];
                        $scope.serviceCars.push(res[i]);
                    }
                }else{
                    defaultServiceCar="";
                    $scope.serviceCars.push("");
                }

                if (res.all!=null&&res.all.length>0){
                    for (var i=0;i<res.all.length;i++){
                        $scope.serviceCars.push(res.all[i]);
                    }
                }
                deferred.resolve(defaultServiceCar);
            },function error(msg) {
                canDeparture=true;
                deferred.reject(msg);
                AppUtilService.hideLoading();
                console.log(msg.responseText);
            });
            return deferred.promise;
        };


        $scope.doDepartureOrder=function(ServiceCarInfo){
            let deferred = $q.defer();
            setTimeout(function () {
                $('#serviceCarSelectFirst').find('option[value ='+ServiceCarInfo.CarNo__c+']').attr('selected', true);
            },500);
            departTurePop = $ionicPopup.show({
                title:"请选择服务车",
                template: "    <select id=\"serviceCarSelectFirst\" class=\"small_Type_Select\" >\n" +
                "                                            <option ng-repeat=\" singleServiceCar  in serviceCars\" value=\"{{singleServiceCar.CarNo__c}}\">{{singleServiceCar.CarNo__c}}</option>\n" +
                "                                        </select>",
                scope: $scope,
                buttons:[{
                    text: '<b>OK</b>',
                    type: 'button-positive',
                    onTap: function () {
                        // if (!canDeparture) {
                        //     departTurePop.close();
                        //     return;
                        // }
                        // canDeparture=false;
                        if (canDeparture){
                            canDeparture=false;
                        }
                        deferred.resolve('');
                    }
                }]

            });
            return deferred.promise;
        };

        $scope.updateDepartureOrderStatus=function(item,carNo){
            let deferred = $q.defer();
            AppUtilService.showLoading();
            dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline),Number(localStorage.onoffline)!==0?item.Id:item._soupEntryId,'Not Completed').then(function callBack(res) {
                console.log(res);
                if (res.status.toLowerCase() == 'success') {
                    var goTime = new Date();
                    //goTime.format('yyyy-MM-dd hh:mm:ss')
                  var selectUserId = localStorage.getItem('selectUserId');
                  dualModeService.departureActionUtil(Number(localStorage.onoffline), Number(localStorage.onoffline) !== 0 ? item.Id:item._soupEntryId, Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id:oCurrentUser._soupEntryId,carNo,selectUserId).then(function callBack(res) {
                        console.log(res);
                        $scope.getHomeService();//刷新日历列表数据 更改出发状态

                        if (res.status.toLowerCase() == 'success') {
                            AppUtilService.hideLoading();
                            canDeparture=true;
                            $scope.goPageWorkDetails(item, true, goTime,isBelongCurrentUser,false);
                            deferred.resolve('');
                        } else {
                            canDeparture=true;
                            $scope.updateOrderType(item, 'Not Started',res.message);
                        }
                    },function error(msg) {
                        canDeparture=true;
                        console.log(JSON.stringify(msg));
                        $scope.updateOrderType(item, 'Not Started',JSON.stringify(msg));
                    });
                } else {
                    AppUtilService.hideLoading();
                    canDeparture=true;
                    $ionicPopup.alert({
                        title: '更新工单状态失败',
                        template: res.message
                    });
                    return false;
                }
            },function error(msg) {
                console.log(msg);
                AppUtilService.hideLoading();
                canDeparture=true;
                deferred.reject(msg);
                $ionicPopup.alert({
                    title: '更新工单状态失败',
                    template: msg.responseText
                });
                return false;
            });
            return deferred.promise;
        };

        /**
         * 上传出发时间失败重新更改状态为未开始
         * @param obj
         * @param status
         */
        $scope.updateOrderType = function (obj, status,msgStr) {
            dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline), Number(localStorage.onoffline) !== 0 ? obj.Id : obj._soupEntryId, status).then(function callBack(res) {
                console.log(res);
                AppUtilService.hideLoading();
                if (res.status.toLowerCase() == 'success') {
                    $ionicPopup.alert({
                        title: msgStr
                    });
                    $scope.getSomeData();
                } else {
                    $ionicPopup.alert({
                        title: '更新工单状态失败',
                        template: res.message
                    });
                    return false;
                }
            }, function error(msg) {
                console.log(msg);
                AppUtilService.hideLoading();
                $ionicPopup.alert({
                    title: '更新工单状态失败',
                    template: msg.responseText
                });
                return false;
            });
        };

        /**
         * 日期格式化方法
         * @param format
         * @returns {*}
         */
        Date.prototype.format = function (format) {
          var date = {
            'M+': this.getMonth() + 1,
            'd+': this.getDate(),
            'h+': this.getHours(),
            'm+': this.getMinutes(),
            's+': this.getSeconds(),
            'q+': Math.floor((this.getMonth() + 3) / 3),
            'S+': this.getMilliseconds()
          };
          if (/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
          }
          for (var k in date) {
            if (new RegExp('(' + k + ')').test(format)) {
              format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length));
            }
          }
          return format;
        };

        $scope.goPageWorkDetails = function (obj, isNewWork, goTime,belong,openPrint) {
          $state.go('app.workDetails', {
                SendInfo: obj._soupEntryId,
                workDescription: null,
                AccountShipToC: obj.Account_Ship_to__c,
                workOrderId: obj.Id,
                enableArrivalBtn: true,
                goOffTime: goTime,
                isNewWorkList: isNewWork,
                accountId: obj.Account_Ship_to__r.Id,
                orderBelong:belong,
                openPrintPage:openPrint
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
        $scope.serviceCars = [];
        $scope.$on('$ionicView.enter', function () {
          // check if device is online/offline
          vm.isOnline = ConnectionMonitor.isOnline();
          if (oCurrentUser) {
            vm.username = oCurrentUser.Name;
          }

          console.log('$ionicView.enter');

        });
        $rootScope.getSomeData = function () {
          if ($scope.changeTabFlag == '2'){
            //预留刷新工作计划逻辑
          }
          $scope.getHomeService();
          setTimeout(function () {
              //$scope.hideLoadingPage();
              document.getElementById('selectStatusId')[0].selected = true;
          },200);
        };
        $scope.toRepair1 = function () {
          $state.go('app.search_1');

        };

        $scope.changeBackgroundColor = function (currentClickDate) {
          let currEle = $('#homeCalendar_1 td.fc-day[data-date="' + currentClickDate + '"]');
          if (currEle != null && currEle.length > 0) {
            console.log('currEle::', currEle);
            if (currEle[0].style.backgroundColor === '#aaa' || currEle[0].style.backgroundColor
                === 'rgb(170, 170, 170)') {
              currEle[0].style.backgroundColor = 'transparent';
              $scope.resetAllDateBackground();
            } else {
              $scope.resetAllDateBackground();
              currEle[0].style.backgroundColor = '#aaa';
            }
          }
        };

        $scope.resetAllDateBackground = function () {
          $('#homeCalendar_1 td.fc-day').each(function (index, element) {
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


        var getOrderByStatesForDayClick = function (status) {
          var forNowlist = [];
          for (let index = 0; index < $scope.currentOrder.length; index++) {
            var userStatus = $scope.currentOrder[index].Status__c;

            if (userStatus == status) {
              forNowlist.push($scope.currentOrder[index]);
            }

          }
          return forNowlist;
        };

        var getServiceOrderType = function (array) {
          for (let index = 0; index < array.length; index++) {
            const element = array[index].Service_Order_Type__c;
            if (element == 'Work_Order') {
              array[index].Service_Order_Type__c = '工单';
            } else if (element == 'Customer Consult') {
              array[index].Service_Order_Type__c = '客户咨询';
            } else if (element == 'Customer Complaint') {
              array[index].Service_Order_Type__c = '客户投诉';
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

           var compare = function (propertyName, flag) {
              return function (object1, object2) {
                var value1 = object1[propertyName];
                var value2 = object2[propertyName];
                if (value2 < value1) {
                  if (!flag) {
                    return -1;
                  } else {
                    return 1;
                  }
                } else if (value2 > value1) {
                  if (!flag) {
                    return 1;
                  } else {
                    return -1;
                  }
                } else {
                  return 0;
                }
              }
            };

          var distinctArray = function(arr){
            var result = [];
                var obj = {};
                for(var i =0; i<arr.length; i++){
                     if(!obj[arr[i].Name]){
                          result.push(arr[i]);
                          obj[arr[i].Name] = true;
                       }
                  }
                return result;
          };

          //使用对象记录重复的元素，以及出现的次数
          var getCount = function (arr) {
            if (firstRunFun) {
              calendarAll.fullCalendar('removeEvents');
            } else {
              firstRunFun = true;
            }
            var plan_Date_List = [];
            for (let index = 0; index < arr.length; index++) {
              var plan_Date__c = arr[index].Plan_Date__c;
              plan_Date_List.push(plan_Date__c);
            }
            events = [];//清空数组
            var obj     = {},
                k, arr1 = [];
            for (var i = 0, len = plan_Date_List.length; i < len; i++) {
              k = plan_Date_List[i];
              if (obj[k]) {
                obj[k]++;
              } else {
                obj[k] = 1;
              }
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
            $rootScope.allUser = [];
            allUser = [];
            AppUtilService.showLoading();
            Service1Service.getOrdersWithGroup(Number(localStorage.onoffline),$rootScope.selectUserId).then(function (res) {
              setTimeout(function () {
                AppUtilService.hideLoading();
              }, 300);
              console.log('res  ', res);

              if (!res) {
                return;
              }

              var allOrdersForAddArmy = {};
              allOrdersForAddArmy['userId'] = "";
              allOrdersForAddArmy['userName'] = "全部";
              allOrdersForAddArmy['orders'] = [];
              allOrdersForAddArmy['manageUserIds'] = [];
              _.each(res,function (userItems) {
                _.each(userItems.orders,function (userItem) {
                  userItem.CreatedDate = new Date(userItem.CreatedDate).format('yyyy-MM-dd hh:mm:ss');
                  allOrdersForAddArmy.orders.push(userItem);

                });
              });

              allOrdersForAddArmy.orders.sort(compare('CreatedDate',false));//根据时间排序

              allOrdersForAddArmy.orders = distinctArray(allOrdersForAddArmy.orders);//去重复

              res.push(allOrdersForAddArmy);

              $rootScope.allUser = res;
              allUser = res;

              if (typeof (getOrderById(oCurrentUser.Id)) === 'undefined') {
                currentOrder = allUser[0].orders;
              } else {
                currentOrder = getOrderById(oCurrentUser.Id).orders;
              }

              //日历下方列表
              allOrders = currentOrder;
              $scope.currentOrder = getServiceOrderType(allOrders);
              calendarAll.fullCalendar('addEventSource', getCount(currentOrder));
              console.log('getEachOrder  ', currentOrder);

              setTimeout(setDefaultUser, 500);
            }, function (error) {
              setTimeout(function () {
                AppUtilService.hideLoading();
              }, 300);
              console.log('getEachOrder Error ', error);
              $log.error('getEachOrder Error: ' + error);

            });
          };
          var calendarAll = $('#calendarAll').fullCalendar({
            displayEventTime: false,
            titleFormat: 'MM',
            // allDaySlot : false,
            // allDayText:'今天的任务',
            buttonText: {
              today: '今天',
              month: '月视图',
              week: '周视图',
            },
            monthNames: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
            header: {
              left: 'prev,next today',
              center: 'title',
              right: 'month,basicWeek'
            },
            dayClick: function (date, jsEvent, view) {

              console.log('↓↓↓dayClick↓↓↓');
              console.log('date: ' + date);

              // console.log('jsEvent: ' + jsEvent);
              // console.log('view: ' + view);
              // $("tr:even").css("background-color", "#000");
              var currentClickDate = date.format('YYYY-MM-DD');
              $scope.toDisplayOrderListByData(currentClickDate);
            },
            events: function (start, end, timezone, callback) {

              console.log('events: function!:', currentOrder);
              // 数据处理，将返回的数据添加到events中

              callback(getCount(currentOrder));

            },
            eventClick: function (event, jsEvent, view) {
              console.log('eventClick: event.start._i!:', event.start._i);
              // 此处可添加修改日程的代码
              // var red = Math.round(255 * Math.random());
              // var green = Math.round(255 * Math.random());
              // var blue = Math.round(255 * Math.random());
              // $(this).css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
              var currentClickDate = event.start._i;
              $scope.toDisplayOrderListByData(currentClickDate);

            }

          });

          $('.fc-month-button').on('click', function () {
            var div = document.getElementById('orderListClassType');
            div.className = 'big_Type_Group';

          });
          $('.fc-basicWeek-button').on('click', function () {
            var div = document.getElementById('orderListClassType');
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
            document.getElementById('selectStatusId')[index].selected = true;
            selectStatusUserIndex(index);
          };

          //////选择组员
          var province = document.getElementById('selectUserId');
          let setDefaultUser = function () {

            try {

              console.log('匹配当前用户:ing');
              for (let i = 0; i < allUser.length; i++) {
                if (allUser[i].userId === oCurrentUser.Id) {
                  console.log('匹配当前用户工单成功。');
                  $('#selectUserId option')[i].selected = 'selected';
                  var index = i;
                  currentOrder = allUser[index].orders;//当前选择组员的订单
                  document.getElementById('selectStatusId')[0].selected = true;
                  $scope.currentOrder = getServiceOrderType(allUser[index].orders);
                  calendarAll.fullCalendar('addEventSource', getCount(allUser[index].orders));
                }
              }
            } catch (e) {
              console.log('匹配当前用户:出错啦::', e);
            }

          };
          setDefaultUser();
          province.onchange = function () {
            console.log('onchange::组员选择');
            $scope.resetAllDateBackground();
            selectStatusIndex = 0;
            var index = province.options.selectedIndex;
            currentOrder = allUser[index].orders;//当前选择组员的订单
            document.getElementById('selectStatusId')[0].selected = true;
            $scope.currentOrder = getServiceOrderType(allUser[index].orders);
            calendarAll.fullCalendar('addEventSource', getCount(allUser[index].orders));
          };

          //////选择状态
          var selectStatus = document.getElementById('selectStatusId');
          selectStatus.onchange = function () {
            var index = selectStatus.options.selectedIndex;
            selectStatusUserIndex(index);
          };

          var selectStatusUserIndex = function (index) {
            $scope.resetAllDateBackground();
            selectStatusIndex = index;
            var selectStatusUser = [];
            switch (index) {
              case 0://全部
                selectStatusUser = currentOrder;
                break;
              case 1://未安排 Not Planned
                selectStatusUser = getOrderByStates('Not Planned');
                break;
              case 2://未开始 "Not Started"
                selectStatusUser = getOrderByStates('Not Started');
                break;
              case 3://进行中 "Not Completed"
                selectStatusUser = getOrderByStates('Not Completed');
                break;
              case 4://已完成 "Service Completed"
                selectStatusUser = getOrderByStates('Service Completed');
                break;
              default:
                break;
            }
            $scope.currentOrder = getServiceOrderType(selectStatusUser);
            calendarAll.fullCalendar('addEventSource', getCount(selectStatusUser));
          };

          var selectStatusUserIndexForDayClick = function (index) {
            selectStatusIndex = index;
            var selectStatusUser = [];
            switch (index) {
              case 0://全部
                selectStatusUser = $scope.currentOrder;
                break;
              case 1://未安排 Not Planned
                selectStatusUser = getOrderByStatesForDayClick('Not Planned');
                break;
              case 2://未开始 "Not Started"
                selectStatusUser = getOrderByStatesForDayClick('Not Started');
                break;
              case 3://进行中 "Not Completed"
                selectStatusUser = getOrderByStatesForDayClick('Not Completed');
                break;
              case 4://已完成 "Service Completed"
                selectStatusUser = getOrderByStatesForDayClick('Service Completed');
                break;
              default:
                break;
            }
            $scope.currentOrder = getServiceOrderType(selectStatusUser);
          };

          $scope.toDisplayOrderListByData = function (currentClickDate) {
            var selectDateOrders = [];
            for (let index = 0; index < currentOrder.length; index++) {//显示点击日期的工单

              var indexDate = currentOrder[index].Plan_Date__c;
              console.log('currentClickDate：', currentClickDate + '  indexDate:' + indexDate);

              if (currentClickDate == indexDate) {
                selectDateOrders.push(currentOrder[index]);
              }
            }
            // console.log('selectDateOrders.count', selectDateOrders.length );
            // console.log(' selectDateOrders:' ,selectDateOrders);

            // if (selectDateOrders.length > 0) {//点击空白处的屏蔽处理
              $scope.currentOrder = getServiceOrderType(selectDateOrders);
              selectStatusUserIndexForDayClick(selectStatusIndex);
            // }
            $scope.changeBackgroundColor(currentClickDate);

          };

          $scope.changeCalendarTab = function (index) {
            //console.log('cssss:::',$('#selectCustomer'));
            $scope.changeTabFlag = index;
            if (index === '1') {
              $('#homeCalendar_Tab_1').addClass('homeCalendar_Tab_Active');
              $('#homeCalendar_Tab_2').removeClass('homeCalendar_Tab_Active');

              $('#homeCalendar_1').show();
              $('#homeCalendar_2').hide();
            } else if (index === '2') {
              $('#homeCalendar_Tab_1').removeClass('homeCalendar_Tab_Active');
              $('#homeCalendar_Tab_2').addClass('homeCalendar_Tab_Active');
              $scope.setDefaultUserForWorkplan();
              $('#homeCalendar_1').hide();
              $('#homeCalendar_2').show();
            }
          };

          $scope.loadWorkPlanData = function () {
              var date = new Date();
              var year = date.getFullYear();
              var month = date.getMonth() + 1;
            ForceClientService.getForceClient().apexrest(
              '/MobileNewCalendarService?type=getWorkPlansForCalendar&year='+year+'&month='+month,
              'GET',
              {},
              null, function callBack(res) {
                console.log('loadWorkPlanData::callBack:::', res);
                //AppUtilService.hideLoading();
                if (res.status.toLowerCase() == 'success') {
                  let jsonObject = JSON.parse(res.message);
                  $scope.workPlanTypes = jsonObject.list_typeSelect;
                  $scope.workPlanUsers = jsonObject.list_userSelect;
                  $scope.allWorkPlanData = jsonObject.list_datas;
                  console.log('allWorkPlanData::', $scope.allWorkPlanData);
                  if (jsonObject.list_userSelect.length > 0) {
                    $scope.currentWorkPlan =
                      $scope.getCurrentWorkPlanData('全部', jsonObject.list_userSelect[0].value, $scope.allWorkPlanData);
                  } else {
                    $scope.currentWorkPlan = $scope.getCurrentWorkPlanData('全部', '', $scope.allWorkPlanData);
                  }
                  //setTimeout($scope.setDefaultUserForWorkplan(), 2000);
                } else {

                }
              }, function error(msg) {
                console.log('loadWorkPlanData::ERROR:::', msg.responseText);

                return false;
              }
            );
          };

          $scope.getLoginList = function () {
            ForceClientService.getForceClient().apexrest(
              '/LoginService?action=getLoginList',
              'GET',
              {},
              null, function callBack(res) {
                $scope.allLoginUser = res;
                console.log('getLoginList:', res);
                //AppUtilService.hideLoading();
              }, function error(msg) {
                console.log('getLoginList::ERROR:::', msg);

                return false;
              }
            );
          };

          $scope.initWorkPlanPicklistAction = function () {
            var selectWorkPlanType = document.getElementById('selectWorkPlanType');
            var selectWorkPlanUser = document.getElementById('selectWorkPlanUser');
            selectWorkPlanType.onchange = function (el) {
              $scope.changeWorkPlanFilter();
            };
            selectWorkPlanUser.onchange = function (el) {
              $scope.changeWorkPlanFilter();
            };
          };

          $scope.getCurrentWorkPlanData = function (str_type, str_userId, allData) {
            var tempArray = [];
            for (var i = 0; i < allData.length; i++) {
              if (str_type === '全部') {
                if (str_userId === allData[i].str_userId) {
                  tempArray.push(allData[i]);
                }
              } else {
                if (str_type === allData[i].str_type && str_userId === allData[i].str_userId) {
                  tempArray.push(allData[i]);
                }
              }
            }
            console.log('getCurrentWorkPlanData::', tempArray);
            return tempArray;
          };

          $scope.workplan_listIcon = function (type) {
            var returnType = 'table_Right checkmark_Icon';
            if (type === 'Not Planned') {           //未安排
              returnType = 'table_Right info_Icon';
            } else if (type === 'Not Started') {    //未开始
              returnType = 'table_Right warning_Icon';
            } else if (type === 'Not Completed') {  //进行中
              returnType = 'table_Right workon_Icon ';
            } else if (type === 'Service Completed') {  //已完成
              returnType = 'table_Right checkmark_Icon ';
            }else {
              returnType = 'table_Right workon_Icon ';//其他
            }
            return returnType;
          };

          $scope.toDisplayWorkPlanListByData = function (isDayClick, currentClickDate) {
            var selectDateWorkPlans = [];
            var type_select = $('#selectWorkPlanType').val();
            var user_select = $('#selectWorkPlanUser').val();

            console.log('toDisplayWorkPlanListByData::', type_select + user_select);
            var allDatas_workplan = $scope.getCurrentWorkPlanData(type_select, user_select, $scope.allWorkPlanData);
            for (let index = 0; index < allDatas_workplan.length; index++) {

              var indexDate = allDatas_workplan[index].workPlan == null ? null
                : allDatas_workplan[index].workPlan.Plan_Date__c;
              console.log('currentClickDate：', currentClickDate + '  indexDate:' + indexDate);

              if (currentClickDate == indexDate) {
                selectDateWorkPlans.push(allDatas_workplan[index]);
              }
            }
            console.log('selectDateWorkPlans.count',
              selectDateWorkPlans.length + '   selectDateWorkPlans:' + selectDateWorkPlans);

            $scope.currentWorkPlan = selectDateWorkPlans;
            if (!isDayClick) {
              $scope.workPlanCalendar.fullCalendar('addEventSource', $scope.getWorkPlanCount($scope.currentWorkPlan));
            }
          };

          $scope.loadWorkPlanData();
          $scope.initWorkPlanPicklistAction();
          $scope.getLoginList();
          $scope.getWorkPlanCount = function (arr) {
            console.log('$scope.firstRunWorkPlan::', $scope.firstRunWorkPlan);
            if ($scope.firstRunWorkPlan) {
              $scope.workPlanCalendar.fullCalendar('removeEvents');
            } else {
              $scope.firstRunWorkPlan = true;
            }
            var plan_Date_List = [];
            for (let index = 0; index < arr.length; index++) {
              var plan_Date__c = arr[index].workPlan.Plan_Date__c;
              plan_Date_List.push(plan_Date__c);
            }
            workPlanEvents = [];
            var obj     = {},
                k, arr1 = [];
            for (var i = 0, len = plan_Date_List.length; i < len; i++) {
              k = plan_Date_List[i];
              if (obj[k]) {
                obj[k]++;
              } else {
                obj[k] = 1;
              }
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
              workPlanEvents.push({
                // 标题，即你想展示的内容
                title: item['count'],
                start: item['el']
              });
              //它可以将刚刚获取到的events数据渲染到日历中
            }
            return workPlanEvents;
          };

          $scope.workPlanCalendar = $('#calendarWorkPlan').fullCalendar({
            displayEventTime: false,
            titleFormat: 'MM',
            // allDaySlot : false,
            // allDayText:'今天的任务',
            buttonText: {
              today: '今天',
              month: '月视图',
              week: '周视图',
            },
            monthNames: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
            header: {
              left: 'prev,next today',
              center: 'title',
              right: 'month,basicWeek'
            },
            dayClick: function (date, jsEvent, view) {
              var currentClickDate = date.format('YYYY-MM-DD');
              $scope.toDisplayWorkPlanListByData(true, currentClickDate);
              $scope.changeWorkPlanBackgroundColor(currentClickDate);
            },
            events: function (start, end, timezone, callback) {

              console.log('workPlanCalendar::events::', $scope.currentWorkPlan);
              var wp_results = $scope.getWorkPlanCount($scope.currentWorkPlan);
              console.log('workPlanCalendar::events22::', wp_results);
              callback(wp_results);

            },
            eventClick: function (event, jsEvent, view) {
              console.log('eventClick: event.start._i!:', event.start._i);
              var currentClickDate = event.start._i;
              $scope.toDisplayWorkPlanListByData(true, currentClickDate);
              $scope.changeWorkPlanBackgroundColor(currentClickDate);

            }

          });

          $scope.fixPrevAndNextButtonTap();
        });

        $scope.changeWorkPlanFilter = function () {
          var type_select = $('#selectWorkPlanType').val();
          var user_select = $('#selectWorkPlanUser').val();

          console.log('changeWorkPlanFilter::', type_select + user_select);
          $scope.currentWorkPlan = $scope.getCurrentWorkPlanData(type_select, user_select, $scope.allWorkPlanData);
          $scope.workPlanCalendar.fullCalendar('addEventSource', $scope.getWorkPlanCount($scope.currentWorkPlan));
          console.log('currentWorkPlan::', $scope.currentWorkPlan);
        };

        $scope.changeWorkPlanBackgroundColor = function (currentClickDate) {
          var currEle = $('#homeCalendar_2 td.fc-day[data-date="' + currentClickDate + '"]');
          if (currEle != null && currEle.length > 0) {
            console.log('currEle::', currEle);
            if (currEle[0].style.backgroundColor === '#aaa' || currEle[0].style.backgroundColor
                === 'rgb(170, 170, 170)') {
              currEle[0].style.backgroundColor = 'transparent';
              $scope.resetAllWorkPlanBackground();
              $scope.changeWorkPlanFilter();
            } else {
              $scope.resetAllWorkPlanBackground();
              currEle[0].style.backgroundColor = '#aaa';
            }
          }
        };

        $scope.resetAllWorkPlanBackground = function () {
          $('#homeCalendar_2 td.fc-day').each(function (index, element) {
            element.style.backgroundColor = 'transparent';
          });
        };

        $scope.fixPrevAndNextButtonTap = function () {
          $('#homeCalendar_2 button.fc-prev-button').click(function () {
            $scope.changeWorkPlanFilter();
          });
          $('#homeCalendar_2 button.fc-next-button').click(function () {
            $scope.changeWorkPlanFilter();
          });
          $('#homeCalendar_2 button.fc-today-button').click(function () {
            $scope.changeWorkPlanFilter();
          });
        };

        $scope.setDefaultUserForWorkplan = function () {

          try {
            console.log('匹配当前用户workplan:ing');
            var matchResult = false;
            for (let i = 0; i < $scope.workPlanUsers.length; i++) {
              if ($scope.workPlanUsers[i].value === oCurrentUser.Id) {
                console.log('匹配当前用户workplan成功。');
                matchResult = true;
                console.log('sssing::', $('#selectWorkPlanUser option').length);
                $('#selectWorkPlanUser option')[i].selected = 'selected';
                $scope.changeWorkPlanFilter();
              }
            }
            console.log('匹配当前用户workplan::Result::', matchResult);
          } catch (e) {
            console.log('匹配当前用户:出错啦::', e);
          }
        };

      });

})();
