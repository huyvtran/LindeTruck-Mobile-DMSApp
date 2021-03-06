(function () {

    'use strict';
    angular.module('oinio.controllers')
      .controller('CalendarArrangeController',
        function ($scope, $ionicPopup, $stateParams, HomeService, $state, $rootScope,
                  AppUtilService, ForceClientService, dualModeService) {

            $scope.goBack = function () {
                window.history.go(-1);
            };
            /**
             *删除数组指定下标或指定对象
             */
            // Array.prototype.remove = function (obj) {
            //     for (var i = 0; i < this.length; i++) {
            //         var temp = this[i];
            //         if (!isNaN(obj)) {
            //             temp = i;
            //         }
            //         if (temp == obj) {
            //             for (var j = i; j < this.length; j++) {
            //                 this[j] = this[j + 1];
            //             }
            //             this.length = this.length - 1;
            //         }
            //     }
            // };
            $scope.updateDataStatusUrl = "/WorkDetailService?action=updateStatus";
            $scope.savePlanDateUrl = "/services/apexrest/HomeService?orderId=";
            $scope.submitOrder = function () {
                var mobiDate = $("#currentDate").val();

                if (!mobiDate) {
                    $ionicPopup.alert({
                        title: "请选择日期"
                    });
                    return;
                }
                // var selectUserGroup = $("#selectUserGroup").get(0).selectedIndex;//选择index
                // var selectUserEntryId = $scope.allUser[selectUserGroup].userSoupEntryId;//所有用户数组
                // var selectUserId = $scope.allUser[selectUserGroup].userId;//所有用户ID
                //
                // // 提交请求
                // var userSoupEntryId = new Object();
                // userSoupEntryId.Id = selectUserId;
                // userSoupEntryId._soupEntryId = selectUserEntryId;
                // var orderSoupEntryId = new Object();
                // orderSoupEntryId._soupEntryId = $stateParams.SendSoupEntryId;
                // console.log($stateParams.workOrderId);

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
                //old code
                // ForceClientService.getForceClient().apexrest(
                //     $scope.updateDataStatusUrl+"&sooId="+$stateParams.workOrderId+"&status=Not Started",
                //     "POST",
                //     {},
                //     null,function callBack(res) {
                //         console.log(res);
                //         //AppUtilService.hideLoading();
                //         if (res.status.toLowerCase()=="success"){
                //
                //             ForceClientService.getForceClient().apexrest(
                //                 $scope.savePlanDateUrl+$stateParams.workOrderId+"&userId="+selectUserId+"&day="+mobiDate,
                //                 'POST',
                //                 {},
                //                 null,function callBack(res) {
                //                     AppUtilService.hideLoading();
                //                     if (res.status.toLowerCase()=="success") {
                //                         $state.go('app.home', {}, {reload: false})
                //                             .then(function(){
                //                                 setTimeout(function() {
                //                                     $rootScope.getSomeData();
                //                                 },100);
                //                             });
                //                     }else{
                //                         $ionicPopup.alert({
                //                             title:"工单安排时间保存失败"
                //                         });
                //                         return false;
                //                     }
                //                 },function error(msg) {
                //                     AppUtilService.hideLoading();
                //                     $ionicPopup.alert({
                //                         title:"工单安排时间保存失败"
                //                     });
                //                     console.log(msg);
                //                     return false;
                //                 }
                //             );
                //         }else{
                //             AppUtilService.hideLoading();
                //             $ionicPopup.alert({
                //                 title:"更新工单状态失败"
                //             });
                //             return false;
                //         }
                //
                //         },function error(msg) {
                //             console.log(msg);
                //             AppUtilService.hideLoading();
                //             $ionicPopup.alert({
                //                 title:"更新工单状态失败"
                //             });
                //             return false;
                //         });
                //new code
                dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline),
                  Number(localStorage.onoffline) !== 0 ? $stateParams.workOrderId : $stateParams.SendSoupEntryId,
                  'Not Started').then(function callBack(res) {
                    console.log(res);
                    //AppUtilService.hideLoading();
                    if (res.status.toLowerCase() == "success") {
                        ForceClientService.getForceClient().apexrest(
                          $scope.savePlanDateUrl + $stateParams.workOrderId + "&day="
                          + mobiDate +"&isDMS="+true,
                          'POST',
                          {},
                          null, function callBack(res) {
                              AppUtilService.hideLoading();
                              if (res.status.toLowerCase() == "success") {
                                  $state.go('app.home', {}, {reload: false})
                                    .then(function () {
                                        setTimeout(function () {
                                            $rootScope.getSomeData();
                                        }, 100);
                                    });
                              } else {
                                  $ionicPopup.alert({
                                      title: "工单安排时间保存失败"
                                  });
                                  return false;
                              }
                          }, function error(msg) {
                              AppUtilService.hideLoading();
                              $ionicPopup.alert({
                                  title: "工单安排时间保存失败",
                                  template:msg.responseText
                              });
                              console.log(msg.responseText);
                              return false;
                          }
                        );
                    } else {
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title: "更新工单状态失败"
                        });
                        return false;
                    }
                }, function error(msg) {
                    console.log(msg.responseText);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: "更新工单状态失败",
                        template:msg.responseText
                    });
                    return false;
                });
            };

            $(function () {
                var calendar = new lCalendar();
                calendar.init({
                    'trigger': '#currentDate',
                    'type': 'date'
                });

                $scope.allUser = angular.fromJson($stateParams.SendAllUser);
                _.each($scope.allUser, function (item) {
                    if (item.userName == "全部") {
                        setTimeout(function () {
                            // $scope.allUser.remove(item);
                            _.pull($scope.allUser, item);
                        }, 50);
                    }
                });
            });
        });

})();
