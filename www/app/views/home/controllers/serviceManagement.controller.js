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
            $scope.getInitServiceCarUrl = "/ServiceCarService?action=init&currentUser=";
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

                $scope.initServiceCarInfo();
            });

            $scope.initServiceCarInfo=function () {
                let deferred = $q.defer();
                AppUtilService.showLoading();
                //获取服务车体
                ForceClientService.getForceClient().apexrest(
                    $scope.getInitServiceCarUrl + oCurrentUser.Id,
                    'GET',
                    {},
                    null, function callBack(res) {
                        AppUtilService.hideLoading();

                        console.log(res);
                        $scope.initServiceCars = [];
                        if (res.default != null && res.default.length > 0) {
                            for (var i = 0; i < res.default.length; i++) {
                                $scope.initServiceCars.push(res.default[i]);
                            }
                        }
                        if (res.all != null && res.all.length > 0) {
                            for (var i = 0; i < res.all.length; i++) {
                                $scope.initServiceCars.push(res.all[i]);
                            }
                        }

                        if ($scope.initServiceCars.length == 0) {
                            $ionicPopup.alert({
                                title: "当前用户无服务车"
                            });
                            return;
                        }
                        deferred.resolve("");
                    }, function error(msg) {
                        console.log(JSON.stringify(msg));
                        AppUtilService.hideLoading();

                    });
                return deferred.promise;
            };


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

                // $ionicPopup.show({
                //     title: '选择图片',
                //     buttons: [
                //         {
                //             text: '拍照',
                //             onTap: function (e) {
                //                 try {
                //                     navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                //                             for (var i = 0; i < $scope.imgUris1.length; i++) {
                //                                 if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                //                                     $scope.imgUris1.splice(i, 1);
                //                                     i--;
                //                                 }
                //                             }
                //                             $scope.imgUris1.push("data:image/jpeg;base64,"+ imgUri);
                //                             //$scope.imgUris1.push(imgUri);
                //                             $scope.imgUris1.push("././img/images/will_add_Img.png");
                //                             console.log(imgUri);
                //                         },
                //                         function onError(error) {
                //                             return;
                //                         }
                //                         , {
                //                             quality: 50,
                //                             saveToPhotoAlbum: false,
                //                             destinationType: navigator.camera.DestinationType.DATA_URL,
                //                             mediaType: Camera.MediaType.PICTURE,
                //                             encodingType: Camera.EncodingType.JPEG
                //                         }
                //                     );
                //                 } catch (e) {
                //                     return;
                //                 }
                //             }
                //         },
                //         {
                //             text: '相册',
                //             onTap: function (e) {
                //                 try {
                //                     navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                //                             for (var i = 0; i < $scope.imgUris1.length; i++) {
                //                                 if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                //                                     $scope.imgUris1.splice(i, 1);
                //                                     i--;
                //                                 }
                //                             }
                //                             $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                //                             //$scope.imgUris1.push(imgUri);
                //                             $scope.imgUris1.push("././img/images/will_add_Img.png");
                //                             //console.log(imgUri);
                //                         },
                //                         function onFail(error) {
                //                             return;
                //                         },
                //                         {
                //                             quality: 50,
                //                             saveToPhotoAlbum: false,
                //                             destinationType: navigator.camera.DestinationType.DATA_URL,
                //                             sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                //                             mediaType: Camera.MediaType.PICTURE,
                //                             encodingType: Camera.EncodingType.JPEG
                //                         });
                //                 } catch (e) {
                //                     return;
                //                 }
                //
                //             }
                //         },
                //     ]
                // });
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

                // $ionicPopup.show({
                //     title: '选择图片',
                //     buttons: [
                //         {
                //             text: '拍照',
                //             onTap: function (e) {
                //                 try {
                //                     navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                //                             for (var i = 0; i < $scope.imgUris2.length; i++) {
                //                                 if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                //                                     $scope.imgUris2.splice(i, 1);
                //                                     i--;
                //                                 }
                //                             }
                //                             $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                //                             //$scope.imgUris2.push(imgUri);
                //                             $scope.imgUris2.push("././img/images/will_add_Img.png");
                //                             //console.log(imgUri);
                //                         },
                //                         function onError(error) {
                //                             return;
                //                         }
                //                         , {
                //                             quality: 50,
                //                             saveToPhotoAlbum: false,
                //                             destinationType: navigator.camera.DestinationType.DATA_URL,
                //                             mediaType: Camera.MediaType.PICTURE,
                //                             encodingType: Camera.EncodingType.JPEG
                //                         }
                //                     );
                //                 } catch (e) {
                //                     return;
                //                 }
                //             }
                //         },
                //         {
                //             text: '相册',
                //             onTap: function (e) {
                //                 try {
                //                     navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                //                             for (var i = 0; i < $scope.imgUris2.length; i++) {
                //                                 if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                //                                     $scope.imgUris2.splice(i, 1);
                //                                     i--;
                //                                 }
                //                             }
                //                             $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                //                             //$scope.imgUris2.push(imgUri);
                //                             $scope.imgUris2.push("././img/images/will_add_Img.png");
                //                             //console.log(imgUri);
                //                         },
                //                         function onFail(error) {
                //                             return;
                //                         },
                //                         {
                //                             quality: 50,
                //                             saveToPhotoAlbum: false,
                //                             destinationType: navigator.camera.DestinationType.DATA_URL,
                //                             sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                //                             mediaType: Camera.MediaType.PICTURE,
                //                             encodingType: Camera.EncodingType.JPEG
                //                         });
                //                 } catch (e) {
                //                     return;
                //                 }
                //
                //             }
                //         },
                //     ]
                // });
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
                licensePlateNumber = $("#licensePlateNumber").val();
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

                var soapData = '<?xml version="1.0" encoding="utf-8"?>';
                soapData +=
                  '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">';
                soapData += '<soap:Body>';
                soapData += '<SendServiceCar xmlns="http://tempuri.org/">';
                soapData += '<jsonServiceCar>' + JSON.stringify(allInfo) + '</jsonServiceCar>';
                soapData += '<key>2D04972DEFE24F9F946C658146EDD50A</key>';
                soapData += '</SendServiceCar>';
                soapData += '</soap:Body>';
                soapData += '</soap:Envelope>';
                AppUtilService.showLoading();

                if (canClick){
                    canClick=false;
                    $.ajax({
                        type: 'POST',
                        url: $scope.devLindeCRMURL,
                        data: soapData,
                        beforeSend: function (request) {
                            request.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
                            request.setRequestHeader("SOAPAction", "http://tempuri.org/SendServiceCar");
                        },
                        success: function (result) {
                            setTimeout(function () {
                                AppUtilService.hideLoading();
                                console.log(result);
                                if (result.documentElement.getElementsByTagName('SendServiceCarResult') != null
                                    && result.documentElement.getElementsByTagName('SendServiceCarResult').length > 0){
                                    if (result.documentElement.getElementsByTagName(
                                        'SendServiceCarResult')[0].innerHTML.toLowerCase() == "success"){
                                        $ionicPopup.alert({
                                            title: '保存成功!'
                                        });
                                        $state.go("app.home");
                                    }else{
                                        var errArr = result.documentElement.getElementsByTagName(
                                            'SendServiceCarResult')[0].innerHTML.split("|");
                                        if (errArr!=null&&errArr.length>0){
                                            $ionicPopup.alert({
                                                title: errArr[1]
                                            });
                                        }
                                    }
                                }else {
                                    $ionicPopup.alert({
                                        title: '保存失败,请检查是否外网连接!'
                                    });
                                }
                                canClick = true;
                            }, 3000);
                        },
                        error: function (msg) {
                            setTimeout(function () {
                                AppUtilService.hideLoading();
                                canClick = true;
                            }, 1000);
                            if (msg.readyState==0){
                                $ionicPopup.alert({
                                    title:"网络不稳定,请稍后再试!"
                                });
                            }else{
                                $ionicPopup.alert({
                                    title:JSON.stringify(msg)
                                });
                            }
                        }
                    });
                }
            };
        });
})();
