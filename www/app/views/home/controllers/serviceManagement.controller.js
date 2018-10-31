angular.module('oinio.serviceManagementController', [])
    .controller('serviceManagementController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                                                   LocalCacheService,SCarService) {
        var vm = this,
            licensePlateNumber ="",
            refuelingCost=0,
            odometerSelfUse=0,
            odometerOfficialBusiness=0,
            odometerComeOn=0,
            otherExpenses=0,
            causeRemark="",
            localImgUris1=[],
            localImgUris2=[],
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        vm.isOnline = null;
        $scope.$on('$ionicView.beforeEnter', function () {
            $scope.imgUris1 = ["././img/images/will_add_Img.png"];
            $scope.imgUris2 = ["././img/images/will_add_Img.png"];
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
            $ionicPopup.show({
                title: '选择图片',
                buttons: [
                    {
                        text: '拍照',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris1.length; i++) {
                                            if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                                                $scope.imgUris1.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris1.push("././img/images/will_add_Img.png");
                                        //console.log(imgUri);
                                    },
                                    function onError(error) {
                                        return;
                                    }
                                    , {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    }
                                );
                            } catch (e) {
                                return;
                            }
                        }
                    },
                    {
                        text: '相册',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris1.length; i++) {
                                            if ($scope.imgUris1[i] == '././img/images/will_add_Img.png' || $scope.imgUris1[i] == imgUri) {
                                                $scope.imgUris1.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris1.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris1.push("././img/images/will_add_Img.png");
                                        //console.log(imgUri);
                                    },
                                    function onFail(error) {
                                        return;
                                    },
                                    {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    });
                            } catch (e) {
                                return;
                            }

                        }
                    },
                ]
            });
        };

        $scope.getPhoto2 = function ($event) {
            if ($event.target.getAttribute("id") != "././img/images/will_add_Img.png") {
                return false;
            }
            $ionicPopup.show({
                title: '选择图片',
                buttons: [
                    {
                        text: '拍照',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoDataSuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris2.length; i++) {
                                            if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                                                $scope.imgUris2.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris2.push("././img/images/will_add_Img.png");
                                        //console.log(imgUri);
                                    },
                                    function onError(error) {
                                        return;
                                    }
                                    , {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    }
                                );
                            } catch (e) {
                                return;
                            }
                        }
                    },
                    {
                        text: '相册',
                        onTap: function (e) {
                            try {
                                navigator.camera.getPicture(function onPhotoURISuccess(imgUri) {
                                        for (var i = 0; i < $scope.imgUris2.length; i++) {
                                            if ($scope.imgUris2[i] == '././img/images/will_add_Img.png' || $scope.imgUris2[i] == imgUri) {
                                                $scope.imgUris2.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris2.push("data:image/jpeg;base64," + imgUri);
                                        $scope.imgUris2.push("././img/images/will_add_Img.png");
                                        //console.log(imgUri);
                                    },
                                    function onFail(error) {
                                        return;
                                    },
                                    {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.DATA_URL,
                                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                                        mediaType: Camera.MediaType.PICTURE,
                                        encodingType: Camera.EncodingType.JPEG
                                    });
                            } catch (e) {
                                return;
                            }

                        }
                    },
                ]
            });
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



        $scope.serviceManagementCancel =function () {
            window.history.back();
        };

        $scope.serviceManagementSubmit =function () {
            licensePlateNumber = $("#licensePlateNumber").val().trim();
            refuelingCost= $("#refuelingCost").val().trim();
            odometerSelfUse = $("#odometerSelfUse").val().trim();
            odometerOfficialBusiness = $("#odometerOfficialBusiness").val().trim();
            odometerComeOn = $("#odometerComeOn").val().trim();
            otherExpenses = $("#otherExpenses").val().trim();
            causeRemark = $("#causeRemark").val();

            var express = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/;
            var express1 = /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/;
            if (licensePlateNumber.length !=7 && !express.test(licensePlateNumber)){
                $ionicPopup.alert({
                    title: "请输入正确的车牌号！"
                });
                return;
            }

            if (!express1.test(odometerOfficialBusiness)||odometerOfficialBusiness==0){
                $ionicPopup.alert({
                    title: "里程表 - 公务 请输入正数！"
                });
                return;
            }
            if (!express1.test(odometerComeOn)||odometerComeOn==0){
                $ionicPopup.alert({
                    title: "里程表 - 加油 请输入正数！"
                });
                return;
            }
            if (!express1.test(refuelingCost)||refuelingCost==0){
                $ionicPopup.alert({
                    title: "加油费用 请输入正数！"
                });
                return;
            }
            if (!express1.test(otherExpenses)||otherExpenses==0){
                $ionicPopup.alert({
                    title: "其他费用 请输入正数！"
                });
                return;
            }
            if (!express1.test(odometerSelfUse)||odometerSelfUse==0){
                $ionicPopup.alert({
                    title: "里程表 - 自用 请输入正数！"
                });
                return;
            }
            var obj = {
                CarNo__c:licensePlateNumber,//车牌号
                GasCost__c:refuelingCost,//加油费用
                SelfMileage__c:odometerSelfUse,//里程表 - 自用
                DriveMileage__c:odometerOfficialBusiness,//里程表 - 公务
                GasMileage__c:odometerComeOn, //里程表 - 加油
                OtherCost__c:otherExpenses, //其他费用
                Remark__c:causeRemark //原因备注
            };

            for (var i = 0; i < $scope.imgUris1.length; i++) {
                if ($scope.imgUris1[i] != '././img/images/will_add_Img.png') {
                    localImgUris1.push($scope.imgUris1[i]);
                }
            }

            for (var i = 0; i < $scope.imgUris2.length; i++) {
                if ($scope.imgUris2[i] != '././img/images/will_add_Img.png') {
                    localImgUris2.push($scope.imgUris2[i]);
                }
            }
            //commit data to remote
            SCarService.serviceCarSaveButton(obj,localImgUris1,localImgUris2).then(function success(result) {
                console.log(result);
                $log.info(result);
                $state.go("app.home");
            },function error(msg) {
                console.log(msg);
                $log.error(msg);
            });
        };

    });
