angular.module('oinio.workDetailsControllers', [])
    .controller('workDetailsController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
        LocalCacheService, HomeService, AppUtilService, SOrderService, ForceClientService) {

        var vm = this,
            arriveTime = null,
            leaveTime = null,
            startTime = null,
            finishTime = null,
            goOffTimeFromPrefix = null,
            workDescription = null,
            allowEdit = false,
            userInfoId = "",
            Account_Ship_to__c = "",
            localSoupEntryId = "",
            localUris = [],
            regroupVarRefundList = [],
            customerNameValue = "",
            customerAccountValue = "",
            customerAddressValue = "",
            truckNumber = "",
            ownerName = "",
            orderDetailsId = "",//工单ID
            truckItems = [],
            regroupPartList = [], ///配件组装数据用于保存
            h = 0,
            m = 0,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        //配件相关init
        $scope.contentTruckFitItems = [];//配件
        $scope.selectedTruckFitItems = [];
        $scope.contentLSGs = [];//LSG
        $scope.rejectedItems = [];
        $scope.serviceFeeList = [];
        $scope.quoteLabourOriginalsList = [];
        $scope.searchPartssUrl = "/Partss?keyword=";
        $scope.partsRelatedsUrl = "/PartsRelateds?partsNumbers=";
        $scope.partLSGServer = "/LSGServer";
        $scope.savePartsUrl = "/ServiceOrderMaterial?newServiceOrderMaterial=";
        $scope.getPartsForReadUrl = "/ServiceOrderMaterial/";
        $scope.getDeliveryOrder = "/DeliveryOrder/";
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            document.getElementById("describInfDiv").style.display = "none";//隐藏
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_import_Div").style.display = "none";//隐藏
            document.getElementById("btn_refund_Div").style.display = "none";//隐藏


        });
        $scope.$on('$ionicView.afterEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            $scope.HasTruckNum = 0;
            $scope.SelectedTruckNum = 0;
            $scope.workTypes = [];
            $scope.carServices = [];
            $scope.imgUris = ["././img/images/will_add_Img.png"];
            console.log("$stateParams.SendInfo", $stateParams.SendInfo);
            console.log("$stateParams.workDescription", $stateParams.workDescription);
            console.log("$stateParams.goOffTime", $stateParams.goOffTime);
            console.log("$stateParams.isNewWorkList", $stateParams.isNewWorkList);
            userInfoId = $stateParams.SendInfo;
            Account_Ship_to__c = $stateParams.AccountShipToC;
            workDescription = $stateParams.workDescription;
            goOffTimeFromPrefix = $stateParams.goOffTime;
            allowEdit = $stateParams.isNewWorkList;

            SOrderService.getPrintDetails(userInfoId).then(function success(result) {
                $log.info(result);
                console.log(result);
                orderDetailsId = result.Id;
                customerNameValue = result.Account_Ship_to__r.Name != null ? result.Account_Ship_to__r.Name : "";
                customerAccountValue = result.Account_Ship_to__r._soupEntryId != null ? result.Account_Ship_to__r._soupEntryId : "";
                customerAddressValue = result.Account_Ship_to__r.Address__c != null ? result.Account_Ship_to__r.Address__c : "";
                if (result.truckModels != null && result.truckModels.length > 0) {
                    for (var i = 0; i < result.truckModels.length; i++) {
                        truckNumber += result.truckModels[i] + ";";
                    }
                }
                ownerName = result.Service_Order_Owner__r.Name != null ? result.Service_Order_Owner__r.Name : "";

                //*********读取配件*************** */
                $scope.getPartListForRead();
                return SOrderService.getOrdersSelectedTruck(userInfoId);
            }).then(function success(result) {
                $scope.SelectedTruckNum = 0;
                if (result.length > 0) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i].Truck_Serial_Number__r != undefined) {
                            $scope.SelectedTruckNum = Number($scope.SelectedTruckNum) + 1;
                            truckItems.push(
                                {
                                    _soupEntryId: result[i].Truck_Serial_Number__r._soupEntryId,
                                    truckItemNum: result[i].Truck_Serial_Number__r.Name,
                                    Operation_Hour__c: 0,
                                    Service_Suggestion__c: "",
                                    isShow: false
                                }
                            );
                        }
                    }
                    $scope.allTruckItems = truckItems;
                }
                console.log(result);
                $log.info(result);
            }).catch(function error(msg) {
                $log.error(msg);
                console.log(msg);
            });

            //***********交货列表************** */
            $scope.getRefundList();
            //************************* */

            // if (allowEdit) {
            //     $("#call_str").removeAttr("disabled");
            // } else {
            //     $("#call_str").attr("disabled", "disabled");
            // }

            /**
             * 暂时取消选择工作时长弹出框
             * @type {string[]}
             */
            // var numArr1 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            // var numArr2 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'];
            // var mobileSelect3 = new MobileSelect({
            //     trigger: '#leave',
            //     title: '选择工作时长',
            //     wheels: [
            //         {
            //             data: numArr1
            //         },
            //         {
            //             data: numArr2
            //         }
            //     ],
            //     position: [0, 0, 0],
            //     callback: function (indexArr, data) {
            //         $("#leave").text("离开");
            //         h = parseInt(data[0].substring(6, 8));
            //         m = parseInt(data[1].substring(6, 8));
            //         checkHours();
            //     }
            // });

            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            $scope.carServices.push({ label: '1', value: '保养' });
            $scope.carServices.push({ label: '2', value: '维修' });
            $scope.carServices.push({ label: '3', value: '服务' });

            $scope.workTypes.push({ label: 'ZS01_Z10', value: 'Z10 Ad-hoc chargeable service' });
            $scope.workTypes.push({ label: 'ZS01_Z11', value: 'Z11 Bill to customer for other Reg' });
            $scope.workTypes.push({ label: 'ZS02_Z20', value: 'Z20 Service contract job\t' });
            $scope.workTypes.push({ label: 'ZS02_Z21', value: 'Z21 LTR service with Contract' });
            $scope.workTypes.push({ label: 'ZS02_Z22', value: 'Z22 LTR service with contract(RE)' });
            $scope.workTypes.push({ label: 'ZS03_Z30', value: 'Z30 Asset (STR) service' });
            $scope.workTypes.push({ label: 'ZS03_Z31', value: 'Z31 In-Stock Truck(cost only)' });
            $scope.workTypes.push({ label: 'ZS03_Z33', value: 'Z33 Support job for Service' });
            $scope.workTypes.push({ label: 'ZS03_Z35', value: 'Z35 Service Engineer Training' });
            $scope.workTypes.push({ label: 'ZS03_Z36', value: 'Z36 Service Marketing Campaign\t' });
            $scope.workTypes.push({
                label: 'ZS03_Z37',
                value: 'Z37 Internal maintenance for in-Stock Truck(value change)'
            });
            $scope.workTypes.push({ label: 'ZS03_Z38', value: 'Z38 Internal Cross-region billing' });
            $scope.workTypes.push({ label: 'ZS03_Z39', value: 'Z39 Asset (STR) service(RE)' });
            $scope.workTypes.push({ label: 'ZS03_Z3A', value: 'Z3A FOC Service from Truck Sales' });
            $scope.workTypes.push({ label: 'ZS03_ZH1', value: 'ZH1 HQ Truck maintenance' });
            $scope.workTypes.push({ label: 'ZS03_ZH2', value: 'ZH2 Testing truck event' });
            $scope.workTypes.push({ label: 'ZS03_ZH3', value: 'ZH3 QM analyses' });
            $scope.workTypes.push({ label: 'ZS03_ZH4', value: 'ZH4 anti-explosion truck reproduct' });
            $scope.workTypes.push({ label: 'ZS03_ZOC', value: 'ZOC aftersales order changed\t' });
            $scope.workTypes.push({
                label: 'ZS03_ZR1',
                value: 'ZR1 Internal maintenance for rental truck refurbishment'
            });
            $scope.workTypes.push({ label: 'ZS03_ZR2', value: 'ZR2 LRental truck refurbishment' });
            $scope.workTypes.push({ label: 'ZS03_ZR3', value: 'ZR3 SRental truck refurbishment\t' });
            $scope.workTypes.push({ label: 'ZS03_ZSS', value: 'ZSS sales support service' });
            $scope.workTypes.push({ label: 'ZS03_ZTD', value: 'ZTD shipping damage' });
            $scope.workTypes.push({ label: 'ZS04_Z40', value: 'Z40 Spare Parts Only Service\t' });
            $scope.workTypes.push({ label: 'ZS05_Z37', value: 'Z37 In-Stock Truck(value change)' });
            $scope.workTypes.push({ label: 'ZS06_ZR1', value: 'ZR1 Rental truck refurbishment' });
            $scope.workTypes.push({ label: 'ZS08_Z80', value: 'Z80 Warranty' });
            $scope.workTypes.push({ label: 'ZS08_Z81', value: 'Z81 Warranty job1' });
            $scope.workTypes.push({ label: 'ZS08_Z82', value: 'Z82 Warranty job2' });
            $scope.workTypes.push({ label: 'ZS08_Z83', value: 'Z83 Warranty job3' });

            /**
             * 初始化
             */
            SOrderService.getDetails(userInfoId).then(function success(result) {
                if (result != null) {
                    localSoupEntryId = result._soupEntryId;
                    if (result.Mobile_Offline_Name__c == null) {
                        SOrderService.getOfflineName(userInfoId).then(function success(response) {
                            $scope.mobileName = response;
                        }, function error(error) {
                            $scope.mobileName = "";
                            $log.error(error);
                        });
                    } else {
                        $scope.mobileName = result.Mobile_Offline_Name__c;
                    }
                    var workType = result.Work_Order_Type__c;
                    if (workType != null) {
                        $("#select_work_type").find("option[value = workType]").attr("selected", true);
                    }
                    $scope.workContent = result.Description__c != null ? result.Description__c : "";
                    if (workDescription != null) {
                        $scope.callPhoneContent = workDescription;
                    } else {
                        $scope.callPhoneContent = result.Subject__c != null ? result.Subject__c : "";
                    }
                    $scope.suggestStr = result.Service_Suggestion__c != null ? result.Service_Suggestion__c : "";
                }

            }, function error(error) {
                $log.error(error);
            })
                .then(function () {
                    return SOrderService.getWorkItemsForOverview(userInfoId).then(function (result) {
                        console.log(result);
                    }, function (error) {
                        console.log(error);
                        $log.error(error);
                    })
                })
                .then(function () {
                    HomeService.getTrucksForParentOrderSid(userInfoId).then(function (res) {
                        $scope.HasTruckNum = res != null ? res.length : 0;
                    }, function (error) {
                        $log.error('Error ' + error);
                    })
                }
                );

        });

        /**
         * 获取图片
         * 1.拍照
         * 2.从相册取
         */
        $scope.getPhoto = function ($event) {
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
                                    for (var i = 0; i < $scope.imgUris.length; i++) {
                                        if ($scope.imgUris[i] == '././img/images/will_add_Img.png' || $scope.imgUris[i] == imgUri) {
                                            $scope.imgUris.splice(i, 1);
                                            i--;
                                        }
                                    }
                                    $scope.imgUris.push("data:image/jpeg;base64," + imgUri);
                                    $scope.imgUris.push("././img/images/will_add_Img.png");
                                    console.log(imgUri);
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
                                    for (var i = 0; i < $scope.imgUris.length; i++) {
                                        if ($scope.imgUris[i] == '././img/images/will_add_Img.png' || $scope.imgUris[i] == imgUri) {
                                            $scope.imgUris.splice(i, 1);
                                            i--;
                                        }
                                    }
                                    $scope.imgUris.push("data:image/jpeg;base64," + imgUri);
                                    $scope.imgUris.push("././img/images/will_add_Img.png");
                                    console.log(imgUri);
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

        var checkMinutes = function () {
            if (finishTime.getMinutes() - m > 0) {
                return {
                    index: 1,
                    mm: finishTime.getMinutes() - m
                };
            } else {
                return {
                    index: 2,
                    mm: finishTime.getMinutes + 60 - m
                };
            }
        };


        /**
         * 取消选择工作时长
         * 查看doLeave方法
         */

        // var checkHours = function () {
        //     if (arriveTime == null) {
        //         $ionicPopup.alert({
        //             title: "请选择到达时间"
        //         });
        //     } else {
        //         finishTime = new Date();
        //         if (finishTime.getHours() - arriveTime.getHours() > h) {
        //             var min = checkMinutes();
        //             if (min.index == 1) {
        //                 startTime = new Date((finishTime.getFullYear() + "-" + finishTime.getMonth() + "-" + finishTime.getDate() + " " + (finishTime.getHours() - h) + ":" + min.mm + ":" + finishTime.getSeconds()).replace(/-/, "/"));
        //             } else {
        //                 startTime = new Date((finishTime.getFullYear() + "-" + finishTime.getMonth() + "-" + finishTime.getDate() + " " + (finishTime.getHours() - h - 1) + ":" + min.mm + ":" + finishTime.getSeconds()).replace(/-/, "/"));
        //             }
        //         } else {
        //             startTime = arriveTime;
        //             h = finishTime.getHours() - arriveTime.getHours();
        //             m = finishTime.getMinutes() - arriveTime.getMinutes();
        //             if (m < 0) {
        //                 m += 60;
        //                 --h;
        //             }
        //         }
        //         leaveTime = new Date();
        //         $("#leave")[0].style.backgroundColor = "#00FF7F"
        //     }
        // };

        /**
         * 点击离开按钮
         * @param $event
         */
        $scope.doLeave=function($event){
            if (arriveTime == null) {
                $ionicPopup.alert({
                    title: "请选择到达时间"
                });
            }else{
                if (leaveTime!=null||finishTime!=null){
                    return false;
                }
                $ionicPopup.show({
                    title: '是否确定到达？',
                    buttons: [{
                        text: '取消',
                        onTap: function () {

                        }
                    }, {
                        text: '确定',
                        onTap: function () {
                            finishTime = new Date();
                            leaveTime = finishTime;
                            $event.target.style.backgroundColor = "#00FF7F";
                        }
                    }],
                });
            }
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

        //已选车辆
        $scope.toDescribInfDiv = function () {
            if (document.getElementById("describInfDiv").style.display == "none") {
                document.getElementById("describInfDiv").style.display = "";//显示
            } else {
                document.getElementById("describInfDiv").style.display = "none";//隐藏
            }
        };
        $scope.goBack = function () {
            // window.history.back();
            $state.go("app.home");
        };

        $scope.getArrivalTime = function ($event) {
            if (arriveTime != null) {
                return false;
            }
            $ionicPopup.show({
                title: '是否确定到达？',
                buttons: [{
                    text: '取消',
                    onTap: function () {

                    }
                }, {
                    text: '确定',
                    onTap: function () {
                        arriveTime = new Date();
                        startTime = new Date();
                        $event.target.style.backgroundColor = "#00FF7F";
                        console.log(arriveTime);
                    }
                }],
            });
        };


        $scope.doPrint = function ($event) {
            var callStr = $("#call_str").val().trim();
            // if (callStr == "" || callStr == null) {
            //     $ionicPopup.alert({
            //         title: "请填写来电是由!"
            //     });
            //     return;
            // }

            if (arriveTime == null) {
                $ionicPopup.alert({
                    title: "请选择到达时间"
                });
                return;
            }
            if (finishTime == null || leaveTime == null) {
                $ionicPopup.alert({
                    title: "请选择工作时长"
                });
                return;
            }
            $ionicPopup.show({
                title: "是否确定打印？",
                buttons: [
                    {
                        text: "取消",
                        onTap: function () {

                        }
                    },
                    {
                        text: "确定",
                        onTap: function () {
                            PrintPlugin.checkBlueTooth(null, function (result) {
                                console.log(result);
                                $log.info(result);
                                if (result.status == 0) {
                                    PrintPlugin.getBlueToothDevices(null, function (result) {
                                        console.log(result);
                                        if (result.length < 1) {
                                            $log.info("请先在蓝牙中配对好设备！");
                                        } else {
                                            var arr = result[0].split('-');
                                            PrintPlugin.connectBlueToothDevice(arr[1], function (res) {
                                                console.log(res);
                                                $log.info(res);
                                                if (res.status == 0) {
                                                    PrintPlugin.printTicket(
                                                        {
                                                            customerName: customerNameValue,//customerName
                                                            customerAccount: customerAccountValue,//customerAccount
                                                            customerAddress: customerAddressValue,//customerAddress
                                                            workSingleNumber: $("#workSingleNumber").text(),//workSingleNumber
                                                            noticeAccount: "",//noticeAccount
                                                            goodsAccount: "",//goodsAccount
                                                            TruckModel: truckNumber,//TruckModel
                                                            workHour: "  " + h + "小时" + m + "分钟",//workHour
                                                            workTimeTotal: [{
                                                                workName: ownerName,
                                                                workDate: arriveTime.getFullYear() + "-" + arriveTime.getMonth() + "-" + arriveTime.getDate(),
                                                                workStartTime: startTime.getHours() + ":" + startTime.getMinutes() + ":" + startTime.getSeconds() + " -- " + finishTime.getHours() + ":" + finishTime.getMinutes() + ":" + finishTime.getSeconds(),
                                                                workEndTime: startTime.getHours() + ":" + arriveTime.getMinutes() + ":" + arriveTime.getSeconds() + " -- " + leaveTime.getHours() + ":" + leaveTime.getMinutes() + ":" + leaveTime.getSeconds(),
                                                                miles: ""

                                                            }],//workTimeTotal
                                                            listContent: "",//listContent
                                                            demandForRequire: "   " + callStr,//demandForRequire
                                                            workContent: $("#workContentStr").val(),//workContent
                                                            resultAndSuggestions: $("#serviceSuggest").val(),//resultAndSuggestions
                                                            responsibleEngineer: ownerName//responsibleEngineer
                                                        }
                                                        , function (response) {
                                                            console.log(response);
                                                            $log.info(response);
                                                            $event.target.style.backgroundColor = "#00FF7F";
                                                        }, function (error) {
                                                            console.log(error);
                                                            $log.error(error);
                                                        });
                                                }
                                            }, function (error) {
                                                console.log(error);
                                                $log.error(error);
                                            });
                                        }
                                    }, function (error) {
                                        console.log(error);
                                        $log.error(error);
                                    });
                                }
                            }, function (error) {
                                console.log(error);
                                $log.error(error);
                            });
                        }
                    }
                ]
            });
        };

        $scope.signBill = function ($event) {
            $ionicPopup.show({
                title: "是否确定签单？",
                buttons: [
                    {
                        text: "取消",
                        onTap: function () {

                        }
                    },
                    {
                        text: "确定",
                        onTap: function () {
                            $event.target.style.backgroundColor = "#00FF7F";
                        }
                    }
                ]
            });
        };

        $scope.goSave = function () {

            var callStr = $("#call_str").val().trim();
            // if (callStr == "" || callStr == null) {
            //     $ionicPopup.alert({
            //         title: "请填写来电是由!"
            //     });
            //     return;
            // }

            if (arriveTime == null || finishTime == null || startTime == null || leaveTime == null) {
                var ionPop = $ionicPopup.alert({
                    title: "请确认到达和离开时间"
                });
                return;
            }

            for (var i = 0; i < $scope.imgUris.length; i++) {
                if ($scope.imgUris[i] != '././img/images/will_add_Img.png') {
                    localUris.push(($scope.imgUris[i]).slice(23));
                }
            }
            console.log(localUris);
            var order = {
                _soupEntryId: localSoupEntryId,
                Mobile_Offline_Name__c: $scope.mobileName,
                Work_Order_Type__c: $('#select_work_type option:selected').val(),
                Description__c: $('#workContentStr').val(),
                Service_Suggestion__c: $('#serviceSuggest').val(),
                Subject__c: $('#call_str').val()
            };

            SOrderService.workDetailSaveButton(order, $scope.allTruckItems, $('#workContentStr').val(), localUris, arriveTime, leaveTime, startTime, finishTime).then(function success(result) {
                console.log(result);
                
                //*********保存配件************* */
            $scope.regroupPartListForSave();
            //********************** */

            }, function error(error) {
                $log.error(error);
            });


        };

        $scope.showDetailsMoreInf = function () {
            $("input.selectTruckItem").each(function (index, element) {
                if ($(this).prop("checked")) {
                    $scope.allTruckItems[index].isShow = true;
                } else {
                    $scope.allTruckItems[index].isShow = false;
                }
            });

            document.getElementById("workDetailTotal").style.display = "none";//隐藏
            document.getElementById("workDetailPart").style.display = "block";//隐藏

        };

        //***************************** */初始化配件模块*********************************
        $scope.toDisBothModifyDiv = function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_import_Div").style.display = "none";//隐藏
            document.getElementById("btn_refund_Div").style.display = "none";//隐藏

        };
        $scope.toDisplayImportDiv = function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_refund_Div").style.display = "none";//隐藏

            if (document.getElementById("btn_import_Div").style.display == "none") {
                document.getElementById("btn_import_Div").style.display = "";//显示

            } else {
                document.getElementById("btn_import_Div").style.display = "none";//隐藏
            }
        };
        $scope.toDisplayModifyDiv = function () {
            document.getElementById("btn_import_Div").style.display = "none";//隐藏
            document.getElementById("btn_refund_Div").style.display = "none";//隐藏

            if (document.getElementById("btn_modify_Div").style.display == "none") {
                document.getElementById("btn_modify_Div").style.display = "";//显示

            } else {
                document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            }
        };
        $scope.toDisplayRefundDiv = function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_import_Div").style.display = "none";//隐藏

            if (document.getElementById("btn_refund_Div").style.display == "none") {
                document.getElementById("btn_refund_Div").style.display = "";//显示

            } else {
                document.getElementById("btn_refund_Div").style.display = "none";//隐藏
            }
        };
        /**
         * 打开搜索页面
         * @param ele
         */
        $scope.openSelectPage = function (ele) {
            $scope.toDisBothModifyDiv();
            if (ele === 'selectLSG') {
                $('#selectLSG').css('display', 'block');
                $('#selectTruckFit').css('display', 'none');
                $scope.getLSG();
            } else {
                $('#selectTruckFit').css('display', 'block');
                $('#selectLSG').css('display', 'none');
            }

            $('div.workListDetails_bodyer').animate({
                opacity: '0.6'
            }, 'slow', 'swing', function () {
                $('div.workListDetails_bodyer').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity: '1'
                }, 'normal').show();

                // $('#selectTruckFit').css('display', 'block');
            });
        };

        $scope.closeSelectPage = function () {
            $('div.newWorkList_truckSelect').animate({
                opacity: '0.6'
            }, 'slow', function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.workListDetails_bodyer').animate({
                    opacity: '1'
                }, 'normal').show();
            });
        };
        //搜索配件
        $scope.getTrucks = function (keyWord) {
            AppUtilService.showLoading();
            $scope.contentTruckFitItems = [];
            console.log("getTrucks::", keyWord);
            let parts_number__cList = [];
            let partsQuantitys = [];
            var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord;
            ForceClientService.getForceClient().apexrest(getPartsRelatedsKeyWordUrl, 'GET', {}, null, function (response) {
                console.log("searchPartssUrl:", response);
                for (let index = 0; index < response.results.length; index++) {
                    let element = response.results[index];
                    parts_number__cList.push(element.parts_number__c);
                    partsQuantitys.push(100000);
                }
                var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + "&partsQuantitys=" + JSON.stringify(partsQuantitys) + "&accountId=" + Account_Ship_to__c;
                console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);

                ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                    AppUtilService.hideLoading();
                    console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                    for (let i = 0; i < responsePartsRelateds.length; i++) {
                        var responsePartsRelatedsList = responsePartsRelateds[i];
                        for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                            // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                            responsePartsRelatedsList[j]["itemNO"] = j;
                            $scope.contentTruckFitItems.push(responsePartsRelatedsList[j]);
                        }
                    }
                }, function (error) {
                    console.log("error:", error);
                    AppUtilService.hideLoading();

                });

            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();
            });
        };

        $scope.checkAllSearchResults = function () {
            let ele = $("#ckbox_truckFit_searchresult_all");

            console.log('checkAllSearchResults:::', ele.prop("checked"));
            if (ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                    $(this).prop("checked", true);
                });

                angular.forEach($scope.contentTruckFitItems, function (searchResult) {
                    let existFlag = false;
                    angular.forEach($scope.selectedTruckFitItems, function (selected) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        $scope.selectedTruckFitItems.push(searchResult);
                        $scope.updateTruckString();
                    }
                });
            } else {

                $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                    console.log('666:::', element.checked);
                    element.checked = false;
                });

                let arr_temp = [];
                angular.forEach($scope.selectedTruckFitItems, function (selected) {
                    let existFlag = false;
                    angular.forEach($scope.contentTruckFitItems, function (searchResult) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        arr_temp.push(selected);
                    }
                });
                $scope.selectedTruckFitItems = arr_temp;
                $scope.updateTruckString();

            }
        };
        $scope.changeTruckTab = function (index) {
            console.log('cssss:::', $('#selectCustomer'));
            if (index === '1') {
                $("#selectTruckFit_Tab_1").addClass("selectTruckFit_Tab_Active");
                $("#selectTruckFit_Tab_2").removeClass("selectTruckFit_Tab_Active");

                $('#selectTruckFit_result').css('display', 'block');
                $('#selectTruckFit_checked').css('display', 'none');
            } else if (index === '2') {
                $("#selectTruckFit_Tab_1").removeClass("selectTruckFit_Tab_Active");
                $("#selectTruckFit_Tab_2").addClass("selectTruckFit_Tab_Active");

                $('#selectTruckFit_result').css('display', 'none');
                $('#selectTruckFit_checked').css('display', 'block');
            }
        };

        $scope.checkSearchResults = function (ele) {
            let element = $("input.ckbox_truck_searchresult_itemFit[data-recordid*='" + ele.Id + "']");
            if (element != null && element.length > 0) {
                if (element[0].checked) {
                    let existFlag = false;
                    for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                        if (ele.Id == $scope.selectedTruckFitItems[i].Id) {
                            existFlag = true;
                        }
                    }
                    if (!existFlag) {
                        $scope.selectedTruckFitItems.push(ele);
                        $scope.updateTruckString();
                    }
                } else {
                    let temp = [];
                    for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                        if (ele.Id != $scope.selectedTruckFitItems[i].Id) {
                            temp.push($scope.selectedTruckFitItems[i]);
                        }
                    }
                    $scope.selectedTruckFitItems = temp;
                    $scope.updateTruckString();
                }
            } else {
                console.log('checkSearchResults::error');
            }
        };

        $scope.delSelectedItem = function (ele) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
            let new_temp = [];

            for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                if (ele.Id != $scope.selectedTruckFitItems[i].Id) {
                    new_temp.push($scope.selectedTruckFitItems[i]);
                }
            }

            $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                if ($(element).attr("data-recordid") == ele.Id && element.checked) {
                    element.checked = false;
                }
            });
            document.getElementById("ckbox_truckFit_searchresult_all").checked = false;

            $scope.selectedTruckFitItems = new_temp;
            $scope.updateTruckString();

        };

        $scope.delAllSelectedItem = function () {
            $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                element.checked = false;
            });
            document.getElementById("ckbox_truckFit_searchresult_all").checked = false;

            $scope.selectedTruckFitItems = [];
            $scope.updateTruckString();
        };

        $scope.updateTruckString = function () {
            let new_temp = '';
            for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                new_temp = new_temp + $scope.selectedTruckFitItems[i].Name + ';';
            }
            $scope.searchResultTruckName = new_temp;
        };
        $scope.getLSG = function () {
            AppUtilService.showLoading();
            $scope.contentLSGs = [];
            //导入LSG
            ForceClientService.getForceClient().apexrest($scope.partLSGServer, 'GET', {}, null, function (response) {
                console.log("partLSGServer_success:", response);
                for (let i = 0; i < response.ShoppingCartList.length; i++) {
                    var element = response.ShoppingCartList[i];
                    var ShoppingCartList = {};
                    ShoppingCartList["cartName"] = element.cartName;
                    var cartList = [];
                    for (let j = 0; j < 20; j++) {
                        if (element[j]) {
                            cartList.push(element[j])
                        }
                    }
                    ShoppingCartList["cartList"] = cartList;
                    console.log("ShoppingCartList:", ShoppingCartList);
                    $scope.contentLSGs.push(ShoppingCartList);
                }
                AppUtilService.hideLoading();
            }, function (error) {
                console.log("partLSGServer_error:", error);
                AppUtilService.hideLoading();
            });
        }

        $scope.toggleGroup = function (group) {
            group.show = !group.show;
            // console.log("toggleGroup:", group);
        };
        $scope.isGroupShown = function (group) {
            // console.log("isGroupShown:", group);
            return group.show;
        };
        //经济件 替代件 常规件
        $scope.isquoted_Table = function (type) {
            //   console.log("type:", type);
            var returnType = 'quoted_Table';
            if (type === "economical") {
                returnType = "quoted_Table blue_legend"
            } else if (type === "substitution") {
                returnType = "quoted_Table red_legend"
            } else if (type === "common") {
                returnType = "quoted_Table "
            }
            return returnType;
        };
        //******************LSG勾选框************************ */
        $scope.checkAllSearchResultsLSG = function () {
            let ele = $("#ckbox_truckLSG_searchresult_all");

            console.log('checkAllSearchResultsLSG:::', ele.prop("checked"));
            if (ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                    $(this).prop("checked", true);
                });
            } else {
                $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                    console.log('666:::', element.checked);
                    element.checked = false;
                });

            }
        };
        $scope.setLSGList = function () {
            AppUtilService.showLoading();
            var contentLSGsGetList = [];
            $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                if (element.checked) {
                    console.log('ckbox_truck_searchresult_itemLSG:::', $(element).attr("data-recordid"));
                    contentLSGsGetList.push($(element).attr("data-recordid"));
                }
            });
            let partsQuantitys = [];
            for (let i = 0; i < contentLSGsGetList.length; i++) {
                partsQuantitys.push(100000);
            }
            var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(contentLSGsGetList) + "&partsQuantitys=" + JSON.stringify(partsQuantitys) + "&accountId=" + Account_Ship_to__c;
            console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);
            ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                AppUtilService.hideLoading();
                console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                var rebuildListForLSG = [];
                for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                        // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                        responsePartsRelatedsList[j]["itemNO"] = j;
                        rebuildListForLSG.push(responsePartsRelatedsList[j]);
                    }
                }

                for (let i = 0; i < rebuildListForLSG.length; i++) {
                    $scope.selectedTruckFitItems.push(rebuildListForLSG[i]);
                }
                $scope.closeSelectPage();

            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();

            });

        }
        $scope.choooseAllCheckBox = function () {
            var ele = $("#selectTruckAll");
            if (ele.prop("checked")) {
                $("input.selectTruckItem").each(function (index, element) {
                    $(this).prop("checked", true);
                });

            } else {
                $("input.selectTruckItem").each(function (index, element) {
                    $(this).prop("checked", false);
                });
            }
        };

        $scope.regroupPartListForSave = function () {
            AppUtilService.showLoading();

            regroupPartList = [];
            for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                const element = $scope.selectedTruckFitItems[i];
                var onePartOriginals = {};
                onePartOriginals["Line_Item__c"] = element.itemNO;//行项
                onePartOriginals["Parent_Line_Item__c"] = element.itemNO;//行项
                onePartOriginals["Quantity__c"] = element.quantity;//数量
                if (element.priceCondition != null) {
                    onePartOriginals["Gross_Price__c"] = element.priceCondition.price;//公布价
                }
                onePartOriginals["Reserved__c"] = element.View_Integrity__c;//预留
                onePartOriginals["Service_Material__c"] = element.materialId;//物料号
                onePartOriginals["Id"] = element.saveId;//物料号
                onePartOriginals["Parts_Type__c"] = element.type;//配件类型
                onePartOriginals["Service_Order_Overview__c"] = orderDetailsId;//工单ID
                regroupPartList.push(onePartOriginals);
            }
            console.log("regroupPartList:", regroupPartList);

            var savePartsUrlVar = $scope.savePartsUrl + JSON.stringify(regroupPartList);
            console.log("savePartsUrl:", savePartsUrlVar);
            ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'POST', {}, null, function (responseSaveParts) {
                AppUtilService.hideLoading();
                console.log("responseSaveParts:", responseSaveParts);
                $state.go("app.home");

            }, function (error) {
                console.log("responseSaveParts_error:", error);
                AppUtilService.hideLoading();

            });

        }

        $scope.getPartListForRead = function () {

            ForceClientService.getForceClient().apexrest($scope.getPartsForReadUrl + orderDetailsId, 'GET', {}, null, function (responseGetParts) {
                AppUtilService.hideLoading();
                console.log("responseGetParts:", responseGetParts);
                for (let i = 0; i < responseGetParts.length; i++) {
                    const element = responseGetParts[i].Service_Material__r;
                    element["itemNO"] = i;
                    element["materialId"] = responseGetParts[i].Service_Material__c;
                    element["saveId"] = responseGetParts[i].Id;

                    $scope.selectedTruckFitItems.push(element);
                }
                console.log("$scope.selectedTruckFitItems:", $scope.selectedTruckFitItems);

            }, function (error) {
                console.log("responseGetParts_error:", error);
                AppUtilService.hideLoading();

            });

        }

        $scope.hidePartPage = function () {
            document.getElementById("workDetailTotal").style.display = "block";//隐藏
            document.getElementById("workDetailPart").style.display = "none";//隐藏
        };

        $scope.hidePartPagewithSave = function () {
            document.getElementById("workDetailTotal").style.display = "block";//隐藏
            document.getElementById("workDetailPart").style.display = "none";//隐藏
        };
        /**
 *删除数组指定下标或指定对象
 */
        Array.prototype.remove = function (obj) {
            for (var i = 0; i < this.length; i++) {
                var temp = this[i];
                if (!isNaN(obj)) {
                    temp = i;
                }
                if (temp == obj) {
                    for (var j = i; j < this.length; j++) {
                        this[j] = this[j + 1];
                    }
                    this.length = this.length - 1;
                }
            }
        }
        $scope.openRefundPage = function () {
            $("input.refundcheckbox").each(function (index, element) {
                if (element.checked) {
                    console.log('sv_checkbox refund:::', $(element).attr("data-recordid"));
                    // contentLSGsGetList.push($(element).attr("data-recordid"));
                    for (let i = 0; i < $scope.rejectedItems.length; i++) {
                        var element1 = $scope.rejectedItems[i];
                        for (let j = 0; j < element1.Delivery_Line_Item__r.length; j++) {
                            var element2 = element1.Delivery_Line_Item__r[j];
                            if (element2.Id === $(element).attr("data-recordid")) {
                                element2["checkBool"] = true;
                            }
                        }
                    }
                }
            });

            console.log('reNewSendRefund:::', $scope.rejectedItems);

            var reNewSendRefund = JSON.parse(JSON.stringify(regroupVarRefundList));
            var regroupSendRefund = [];

            for (let i = 0; i < reNewSendRefund.length; i++) {
                var element = reNewSendRefund[i];
                regroupSendRefund.push(element);

            }
            for (let i = 0; i < regroupSendRefund.length; i++) {
                var element = regroupSendRefund[i];
                element.Delivery_Line_Item__r = [];
            }

            for (var i = 0; i < $scope.rejectedItems.length; i++) {//删除二级数据内未勾选的二级
                for (var j = 0; j < $scope.rejectedItems[i].Delivery_Line_Item__r.length; j++) {
                    var element4 = $scope.rejectedItems[i].Delivery_Line_Item__r[j];
                    if (element4.checkBool) {
                        for (let index = 0; index < regroupSendRefund.length; index++) {
                            var element = regroupSendRefund[index];

                            if (element.Id === reNewSendRefund[i].Id) {
                                element.Delivery_Line_Item__r.push($scope.rejectedItems[i].Delivery_Line_Item__r[j]);
                            }
                        }

                    }
                }
            }
            var nowSendRefund = [];
            for (var i = 0; i < regroupSendRefund.length; i++) {//删除二级数据内未勾选的二级
                if (regroupSendRefund[i].Delivery_Line_Item__r.length != 0) {
                    nowSendRefund.push(regroupSendRefund[i]);
                }
            }

            $state.go('app.refund', { refundInfo: nowSendRefund });
        };
        //退件接口
        $scope.getRefundList = function () {
            ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder+orderDetailsId, 'GET', {}, null, function (responseGetDelivery) {
            // ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder + 'a1Zp0000000CWqd', 'GET', {}, null, function (responseGetDelivery) {
                AppUtilService.hideLoading();
                console.log("responseGetDelivery:", responseGetDelivery);
                $scope.rejectedItems = responseGetDelivery;
                regroupVarRefundList = responseGetDelivery;
                for (var i = 0; i < $scope.rejectedItems.length; i++) {
                    for (var j = 0; j < $scope.rejectedItems[i].Delivery_Line_Item__r.length; j++) {
                        var elementget = $scope.rejectedItems[i].Delivery_Line_Item__r[j];
                        elementget["checkBool"] = false;

                    }
                }
                console.log("responseGetDeliveryafter:", $scope.rejectedItems);

            }, function (error) {
                console.log("responseGetDelivery_error:", error);
                AppUtilService.hideLoading();

            });

        }

        $scope.checkAllBoxRefund = function () {
            var ele = $("#selectRefundAll");
            if (ele.prop("checked")) {
                $("input.refundcheckbox").each(function (index, element) {
                    $(this).prop("checked", true);
                });

            } else {
                $("input.refundcheckbox").each(function (index, element) {
                    $(this).prop("checked", false);
                });
            }
        };

        $scope.popupRefundContext = function (reitems) {
            var setButtons = [];
            setButtons = [
                {
                    text: '取消',
                }
            ];
            // 自定义弹窗
            myPopup = $ionicPopup.show({
                title: '<div><span>交货单状态:' + reitems.D_Status__c + '</span></div>' +
                    '<div><span>到货物流单号:' + reitems.Tracking_Number__c + '</span></div>' +
                    '<div><span>到货物流状态:' + reitems.TrackState + '</span></div>' +
                    '<div><span>退货物流单号:' + reitems.Return_Tracking_Number__c + '</span></div>' +
                    '<div><span>退货物流状态:' + reitems.ReturnTrackState + '</span></div>',
                scope: $scope,
                buttons: setButtons
            });
            myPopup.then(function (res) {
                console.log('Tapped!', res);
            });

        };
        $scope.popupRefundContextItem = function (item) {
            var setButtons = [];
            setButtons = [
                {
                    text: '取消',
                }
            ];
            // 自定义弹窗
            myPopup = $ionicPopup.show({
                title: '<div><span>退件原因:' + item.Return_Reason__c + '</span></div>' +
                    '<div><span>备注:' + '' + '</span></div>',
                scope: $scope,
                buttons: setButtons
            });
            myPopup.then(function (res) {
                console.log('Tapped!', res);
            });
        };
    });

