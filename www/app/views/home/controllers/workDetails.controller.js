angular.module('oinio.workDetailsControllers', [])
    .controller('workDetailsController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                                                   LocalCacheService, HomeService) {

        var vm = this,
            destinationType,
            localUris = [],
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            $scope.TruckId = "";
            $scope.HasTruckNum = 0;
            $scope.workTypes = [];
            $scope.carServices = [];
            $scope.imgUris = ["././img/images/will_add_img.png"];
        });
        $scope.$on('$ionicView.enter', function () {
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            $scope.carServices.push({lable: '1', value: '保养'});
            $scope.carServices.push({lable: '2', value: '维修'});
            $scope.carServices.push({lable: '3', value: '服务'});

            $scope.workTypes.push({lable: 'ZS01_Z10', value: 'Z10 Ad-hoc chargeable service'});
            $scope.workTypes.push({lable: 'ZS01_Z11', value: 'Z11 Bill to customer for other Reg'});
            $scope.workTypes.push({lable: 'ZS02_Z20', value: 'Z20 Service contract job\t'});
            $scope.workTypes.push({lable: 'ZS02_Z21', value: 'Z21 LTR service with Contract'});
            $scope.workTypes.push({lable: 'ZS02_Z22', value: 'Z22 LTR service with contract(RE)'});
            $scope.workTypes.push({lable: 'ZS03_Z30', value: 'Z30 Asset (STR) service'});
            $scope.workTypes.push({lable: 'ZS03_Z31', value: 'Z31 In-Stock Truck(cost only)'});
            $scope.workTypes.push({lable: 'ZS03_Z33', value: 'Z33 Support job for Service'});
            $scope.workTypes.push({lable: 'ZS03_Z35', value: 'Z35 Service Engineer Training'});
            $scope.workTypes.push({lable: 'ZS03_Z36', value: 'Z36 Service Marketing Campaign\t'});
            $scope.workTypes.push({
                lable: 'ZS03_Z37',
                value: 'Z37 Internal maintenance for in-Stock Truck(value change)'
            });
            $scope.workTypes.push({lable: 'ZS03_Z38', value: 'Z38 Internal Cross-region billing'});
            $scope.workTypes.push({lable: 'ZS03_Z39', value: 'Z39 Asset (STR) service(RE)'});
            $scope.workTypes.push({lable: 'ZS03_Z3A', value: 'Z3A FOC Service from Truck Sales'});
            $scope.workTypes.push({lable: 'ZS03_ZH1', value: 'ZH1 HQ Truck maintenance'});
            $scope.workTypes.push({lable: 'ZS03_ZH2', value: 'ZH2 Testing truck event'});
            $scope.workTypes.push({lable: 'ZS03_ZH3', value: 'ZH3 QM analyses'});
            $scope.workTypes.push({lable: 'ZS03_ZH4', value: 'ZH4 anti-explosion truck reproduct'});
            $scope.workTypes.push({lable: 'ZS03_ZOC', value: 'ZOC aftersales order changed\t'});
            $scope.workTypes.push({
                lable: 'ZS03_ZR1',
                value: 'ZR1 Internal maintenance for rental truck refurbishment'
            });
            $scope.workTypes.push({lable: 'ZS03_ZR2', value: 'ZR2 LRental truck refurbishment'});
            $scope.workTypes.push({lable: 'ZS03_ZR3', value: 'ZR3 SRental truck refurbishment\t'});
            $scope.workTypes.push({lable: 'ZS03_ZSS', value: 'ZSS sales support service'});
            $scope.workTypes.push({lable: 'ZS03_ZTD', value: 'ZTD shipping damage'});
            $scope.workTypes.push({lable: 'ZS04_Z40', value: 'Z40 Spare Parts Only Service\t'});
            $scope.workTypes.push({lable: 'ZS05_Z37', value: 'Z37 In-Stock Truck(value change)'});
            $scope.workTypes.push({lable: 'ZS06_ZR1', value: 'ZR1 Rental truck refurbishment'});
            $scope.workTypes.push({lable: 'ZS08_Z80', value: 'Z80 Warranty'});
            $scope.workTypes.push({lable: 'ZS08_Z81', value: 'Z81 Warranty job1'});
            $scope.workTypes.push({lable: 'ZS08_Z82', value: 'Z82 Warranty job2'});
            $scope.workTypes.push({lable: 'ZS08_Z83', value: 'Z83 Warranty job3'});
            console.log("$stateParams.SendInfo", $stateParams.SendInfo);
            var userInfoId = $stateParams.SendInfo;
            HomeService.getOrder(userInfoId).then(function (response) {
                if (response.length > 0) {
                    $scope.busyerName = response[0].Account_Ship_to__r.Name != null ? response[0].Account_Ship_to__r.Name : "";
                    $scope.OwnerId = response[0].Account_Ship_to__r.Customer_Number__c != null ? response[0].Account_Ship_to__r.Customer_Number__c : "";
                    $scope.workAccountId = response[0]._soupEntryId;
                    var busyType = response[0].Service_Order_Type__c;
                    if (busyType != null) {
                        if (busyType == "Work Order") {
                            $scope.busyerType = '工单';
                        } else if (busyType == "Customer Consult") {
                            $scope.busyerType = '客户咨询';
                        } else if (busyType == "Customer Complaint") {
                            $scope.busyerType = '客户投诉';
                        }
                    } else {
                        $scope.busyerType = '';
                    }
                    console.log('resp::', response);
                    // HomeService.getTrucksForParentOrderSid(userInfoId).then(function (res) {
                    //     var str= "";
                    //     angular.forEach(res,function (item) {
                    //         str += item.Name+";\n";
                    //     });
                    //     $scope.HasTruckNum = res !=null ? res.length: 0;
                    //     $scope.TruckId = str;
                    // },function (error) {
                    //     $log.error('Error ' + error);
                    //     $scope.TruckId ="";
                    // });
                } else {
                    $scope.busyerName = "";
                    $scope.busyerType = "";
                    $scope.OwnerId = "";
                    $scope.TruckId - "";
                }
                //console.log("response.Service_Order_Owner__r:",response[0].Service_Order_Owner__r);

            }, function (error) {
                $log.error('Error ' + error);
            });
        });

        /**
         * 获取图片
         * 1.拍照
         * 2.从相册取
         */
        $scope.getPhoto = function ($event) {
            if($event.target.getAttribute("id") != "././img/images/will_add_img.png"){
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
                                        for (var i = 0; i < $scope.imgUris.length; i++) {
                                            if ($scope.imgUris[i] == '././img/images/will_add_img.png' || $scope.imgUris[i] == imgUri) {
                                                $scope.imgUris.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        localUris.push(imgUri);
                                        localUris.push("././img/images/will_add_img.png")
                                        $scope.imgUris.push(imgUri);
                                    },
                                    function onError(error) {
                                        return;
                                    }
                                    , {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.FILE_URI,
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
                                        for (var i = 0; i < $scope.imgUris.length; i++) {
                                            if ($scope.imgUris[i] == '././img/images/will_add_img.png' || $scope.imgUris[i] == imgUri) {
                                                $scope.imgUris.splice(i, 1);
                                                i--;
                                            }
                                        }
                                        $scope.imgUris.push(imgUri);
                                        $scope.imgUris.push("././img/images/will_add_img.png");
                                        console.log(imgUri);
                                    },
                                    function onFail(error) {
                                        return;
                                    },
                                    {
                                        quality: 50,
                                        saveToPhotoAlbum: false,
                                        destinationType: navigator.camera.DestinationType.FILE_URI,
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
        /**
         * 删除当前图片
         */
        $scope.deleteCurrentImg = function (imgUri) {
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
                            for (var i = 0; i < $scope.imgUris.length; i++) {
                                if ($scope.imgUris[i] == imgUri) {
                                    $scope.imgUris.splice(i, 1);
                                    i--;
                                }
                            }
                            return true;
                        }
                    }
                ]
            });

        };
        $scope.toDetailInfo = function () {
            if (document.getElementById("detailContent").style.display == "none") {
                document.getElementById("detailContent").style.display = "";//显示
                document.getElementById("detailImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("detailContent").style.display = "none";//隐藏
                document.getElementById("detailImg").className = "OpenClose_Btn arrow_Left_White";

            }
        };
        $scope.toWorkInfo = function () {
            if (document.getElementById("workContent").style.display == "none") {
                document.getElementById("workContent").style.display = "";//显示
                document.getElementById("workImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("workContent").style.display = "none";//隐藏
                document.getElementById("workImg").className = "OpenClose_Btn arrow_Left_White";

            }
        };
        $scope.toPartsInfo = function () {
            if (document.getElementById("partContent").style.display == "none") {
                document.getElementById("partContent").style.display = "";//显示
                document.getElementById("partImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("partContent").style.display = "none";//隐藏
                document.getElementById("partImg").className = "OpenClose_Btn arrow_Left_White";

            }
        };
        $scope.toServiceInfo = function () {
            if (document.getElementById("serviceContent").style.display == "none") {
                document.getElementById("serviceContent").style.display = "";//显示
                document.getElementById("serviceImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("serviceContent").style.display = "none";//隐藏
                document.getElementById("serviceImg").className = "OpenClose_Btn arrow_Left_White";

            }
        };

        $scope.goBack = function () {
            window.history.back();
        };

        $scope.goSave = function () {
            $state.go("app.home");
        };

    });

