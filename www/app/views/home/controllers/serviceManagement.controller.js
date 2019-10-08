(function () {

    'use strict';
    angular.module('oinio.controllers')
      .controller('serviceManagementController',
        function ($scope, $rootScope, $filter,$q, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                  LocalCacheService, SCarService, AppUtilService, ForceClientService) {
            var vm                       = this,
                licensePlateNumber       = "",
                refuelingCost            = 0,
                odometerSelfUse          = 0,
                odometerOfficialBusiness = 0,
                odometerComeOn           = 0,
                otherExpenses            = 0,
                causeRemark              = "",
                serviceCarCheck          = false,
                localImgUris1            = [],
                localImgUris2            = [],
                canClick                 = true,
                oCurrentUser             = LocalCacheService.get('currentUser') || {};
            vm.isOnline = null;
            $scope.initServiceCars = [""];
            $scope.forceClientProd = false;
            $scope.checkNoUseServiceCar = false;
            $scope.saveTruckURL = "/ServiceCarService?action=saveTruck";

            $scope.$on('$ionicView.beforeEnter', function () {
                $scope.imgUris1 = ["././img/images/will_add_Img.png"];
                $scope.imgUris2 = ["././img/images/will_add_Img.png"];

                var forceClient = ForceClientService.getForceClient().instanceUrl;
                if (forceClient.charAt(16) == '.') {
                    $scope.forceClientProd = true;
                } else {
                    $scope.forceClientProd = false;
                }

                if ($scope.forceClientProd) {
                    $scope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCMidWareForCRM4Proc/ForCRMWS.asmx"; //生产环境
                } else {
                    $scope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCMidWareForCRM/ForCRMWS.asmx"; //测试环境
                }
            });

            $scope.$on('$ionicView.enter', function () {
                vm.isOnline = ConnectionMonitor.isOnline();
                if (oCurrentUser) {
                    vm.username = oCurrentUser.Name;
                }

            });


            $scope.getPhoto1 = function ($event) {
                if ($event.target.getAttribute("id") != "././img/images/will_add_Img.png") {
                    return false;
                }

                try {
                    navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                          for (var i = 0; i < $scope.imgUris1.length; i++) {
                              if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i]
                                  == imgUri) {
                                  $scope.imgUris1.splice(i, 1);
                                  i--;
                              }
                          }
                          $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                          //$scope.imgUris1.push(imgUri);
                          $scope.imgUris1.push("././img/images/will_add_Img.png");
                          console.log(imgUri);
                      },
                      function onError(error) {
                          return;
                      }
                      , {
                          saveToPhotoAlbum: true,
                          destinationType: navigator.camera.DestinationType.DATA_URL,
                          mediaType: Camera.MediaType.PICTURE,
                          encodingType: Camera.EncodingType.JPEG
                      }
                    );
                } catch (e) {
                    return;
                }
            };

            $scope.getPhoto2 = function ($event) {
                if ($event.target.getAttribute("id") != "././img/images/will_add_Img.png") {
                    return false;
                }

                try {
                    navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                          for (var i = 0; i < $scope.imgUris2.length; i++) {
                              if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i]
                                  == imgUri) {
                                  $scope.imgUris2.splice(i, 1);
                                  i--;
                              }
                          }
                          $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                          //$scope.imgUris2.push(imgUri);
                          $scope.imgUris2.push("././img/images/will_add_Img.png");
                          //console.log(imgUri);
                      },
                      function onError(error) {
                          return;
                      }
                      , {
                          saveToPhotoAlbum: true,
                          destinationType: navigator.camera.DestinationType.DATA_URL,
                          mediaType: Camera.MediaType.PICTURE,
                          encodingType: Camera.EncodingType.JPEG
                      }
                    );
                } catch (e) {
                    return;
                }
            };

            $scope.deleteCurrentImg1 = function (imgUri) {
                $ionicPopup.show({
                    title: "确认删除图片？",
                    buttons: [
                        {
                            text: "否",
                            onTap: function () {
                                return true;
                            }
                        },
                        {
                            text: "是",
                            onTap: function () {
                                for (var i = 0; i < $scope.imgUris1.length; i++) {
                                    if ($scope.imgUris1[i] == imgUri) {
                                        $scope.imgUris1.splice(i, 1);
                                        i--;
                                    }
                                }
                                return true;
                            }
                        }
                    ]
                });

            };

            $scope.deleteCurrentImg2 = function (imgUri) {
                $ionicPopup.show({
                    title: "确认删除图片？",
                    buttons: [
                        {
                            text: "否",
                            onTap: function () {
                                return true;
                            }
                        },
                        {
                            text: "是",
                            onTap: function () {
                                for (var i = 0; i < $scope.imgUris2.length; i++) {
                                    if ($scope.imgUris2[i] == imgUri) {
                                        $scope.imgUris2.splice(i, 1);
                                        i--;
                                    }
                                }
                                return true;
                            }
                        }
                    ]
                });

            };

            $scope.serviceManagementCancel = function () {
                window.history.back();
            };


            $scope.serviceManagementSubmit = function () {
                var picList = [];
                //车牌号
                licensePlateNumber = $("#licensePlateNumber").val().trim();
                if ($("#checkServiceCar").prop("checked")){
                    licensePlateNumber ="";
                    //原因备注
                    causeRemark = $("#causeRemark").val().trim();
                    serviceCarCheck = $("#checkServiceCar").prop("checked");
                    if (causeRemark==""){
                        $ionicPopup.alert({
                            title: '请输入原因备注(必填)!'
                        });
                        return;
                    }
                }else{
                    //加油费用
                    refuelingCost = $("#refuelingCost").val().trim();
                    //自用里程
                    odometerSelfUse = $("#odometerSelfUse").val().trim();
                    //公务里程
                    odometerOfficialBusiness = $("#odometerOfficialBusiness").val().trim();
                    //加油里程
                    odometerComeOn = $("#odometerComeOn").val().trim();
                    //其他费用
                    otherExpenses = $("#otherExpenses").val().trim();

                    if (odometerComeOn!=""||odometerOfficialBusiness!=""||odometerSelfUse!=""){
                        if (odometerOfficialBusiness!=""&&odometerSelfUse!=""){
                            $ionicPopup.alert({
                                title: '公务里程和自用里程最多只能填一项'
                            });
                            return;
                        }
                        if ((odometerOfficialBusiness!=""&&$scope.imgUris1[0] == '././img/images/will_add_Img.png')||(odometerOfficialBusiness==""&&$scope.imgUris1[0] != '././img/images/will_add_Img.png')){
                            $ionicPopup.alert({
                                title: '公务里程和公务拍照，遵循一致性：同时有值或者同时没值'
                            });
                            return;
                        }
                        if ((odometerComeOn!=""&&refuelingCost=="")||(odometerComeOn==""&&refuelingCost!="")){
                            $ionicPopup.alert({
                                title: '加油里程和加油费用，遵循一致性：同时有值或者同时没值'
                            });
                            return;
                        }

                        if ((odometerSelfUse!=""&&$scope.imgUris2[0] == '././img/images/will_add_Img.png')||(odometerSelfUse==""&&$scope.imgUris2[0] != '././img/images/will_add_Img.png')){
                            $ionicPopup.alert({
                                title: '自用里程和自用拍照，遵循一致性：同时有值或者同时没值'
                            });
                            return;
                        }

                    }else{
                        $ionicPopup.alert({
                            title: '加油里程/公务里程/自用里程至少要填写一项'
                        });
                        return;
                    }

                    // if ((otherExpenses!=""&&causeRemark=="")||(otherExpenses==""&&causeRemark!="")){
                    //     $ionicPopup.alert({
                    //         title: '其他费用和原因备注，遵循一致性：同时有值或者同时没值'
                    //     });
                    //     return;
                    // }

                    //公务拍照
                    for (var i = 0; i < $scope.imgUris1.length; i++) {
                        if ($scope.imgUris1[i] != '././img/images/will_add_Img.png') {
                            localImgUris1.push(($scope.imgUris1[i]).slice(23));
                            picList.push({
                                Type: 0,
                                AttachName: new Date().getTime() + "",
                                AttachContent: $scope.imgUris1[i].slice(23),
                                CreateTime: new Date(),
                                CreateBy: employeeNum
                            });
                        }
                    }
                    //自用拍照
                    for (var i = 0; i < $scope.imgUris2.length; i++) {
                        if ($scope.imgUris2[i] != '././img/images/will_add_Img.png') {
                            localImgUris2.push(($scope.imgUris2[i]).slice(23));
                            picList.push({
                                Type: 1,
                                AttachName: new Date().getTime() + "",
                                AttachContent: $scope.imgUris2[i].slice(23),
                                CreateTime: new Date(),
                                CreateBy: employeeNum
                            });
                        }
                    }
                }

                var employeeNum = Number(oCurrentUser.EmployeeNumber);
                if (oCurrentUser.EmployeeNumber != null && oCurrentUser.EmployeeNumber.length < 8) {
                    for (var i = 0; i < 8 - oCurrentUser.EmployeeNumber.length; i++) {
                        employeeNum = '0' + employeeNum;
                    }
                }

                var baseInfo = {
                    CarNo: licensePlateNumber,
                    DriveMileage: Number(odometerOfficialBusiness),
                    GasMileage: Number(odometerComeOn),
                    GasCost: Number(refuelingCost),
                    OtherCost: Number(otherExpenses),
                    NoUseServiceCar:serviceCarCheck,
                    Remark: causeRemark,
                    SelfMileage: Number(odometerSelfUse),
                    CreateTime: new Date(),
                    CreateBy: employeeNum
                };
                var allInfo = {
                    modelServiceCar: baseInfo,
                    listServiceCarAttach: picList
                };
                console.log('allInfo');
                console.log(JSON.stringify(allInfo));

                AppUtilService.showLoading();

                if (canClick){
                    canClick=false;
                    ForceClientService.getForceClient().apexrest($scope.saveTruckURL, 'POST', JSON.stringify(allInfo), null, function (response2) { //生成备件接口二
                        console.log('POST_success2:', response2);
                        AppUtilService.hideLoading();
                        canClick=true;
                        if (response2.status == 'Success') {
                            var ionPop = $ionicPopup.alert({
                                title: '保存成功'
                            });
                            ionPop.then(function (res) {
                                $state.go("app.home");
                            });

                        } else {
                            var ionPop = $ionicPopup.alert({
                                title: response2.message
                            });
                        }

                    }, function (error) {
                        console.log('response1POST_error:', error);
                        AppUtilService.hideLoading();
                        canClick=true;
                        var ionPop = $ionicPopup.alert({
                            title: '保存失败'
                        });
                    });
                }
            };
        });
})();
