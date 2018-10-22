angular.module('oinio.workDetailsControllers', [])
    .controller('workDetailsController', function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                                                   LocalCacheService, HomeService, SOrderService) {

        var vm = this,
            arriveTime = null,
            leaveTime = null,
            startTime = null,
            finishTime = null,
            workDescription = null,
            userInfoId = "",
            localSoupEntryId = "",
            localUris = [],
            h=0,
            m = 0,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            $scope.HasTruckNum = 0;
            $scope.workTypes = [];
            $scope.carServices = [];
            $scope.imgUris = ["././img/images/will_add_Img.png"];
        });
        $scope.$on('$ionicView.enter', function () {

            var numArr1=['01','02','03','04','05','06','07','08','09','10','11','12'];
            var numArr2=['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60'];
            var mobileSelect3 = new MobileSelect({
                trigger: '#leave',
                title: '选择工作时长',
                wheels: [
                    {
                        data: numArr1
                    },
                    {
                        data: numArr2
                    }
                ],
                position:[0, 0, 0],
                callback:function(indexArr, data){
                   $("#leave").text("离开");
                   h = parseInt(data[0].substring(6,8));
                   m = parseInt(data[1].substring(6,8));
                   checkHours();
                }
            });

            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            $scope.carServices.push({label: '1', value: '保养'});
            $scope.carServices.push({label: '2', value: '维修'});
            $scope.carServices.push({label: '3', value: '服务'});

            $scope.workTypes.push({label: 'ZS01_Z10', value: 'Z10 Ad-hoc chargeable service'});
            $scope.workTypes.push({label: 'ZS01_Z11', value: 'Z11 Bill to customer for other Reg'});
            $scope.workTypes.push({label: 'ZS02_Z20', value: 'Z20 Service contract job\t'});
            $scope.workTypes.push({label: 'ZS02_Z21', value: 'Z21 LTR service with Contract'});
            $scope.workTypes.push({label: 'ZS02_Z22', value: 'Z22 LTR service with contract(RE)'});
            $scope.workTypes.push({label: 'ZS03_Z30', value: 'Z30 Asset (STR) service'});
            $scope.workTypes.push({label: 'ZS03_Z31', value: 'Z31 In-Stock Truck(cost only)'});
            $scope.workTypes.push({label: 'ZS03_Z33', value: 'Z33 Support job for Service'});
            $scope.workTypes.push({label: 'ZS03_Z35', value: 'Z35 Service Engineer Training'});
            $scope.workTypes.push({label: 'ZS03_Z36', value: 'Z36 Service Marketing Campaign\t'});
            $scope.workTypes.push({
                label: 'ZS03_Z37',
                value: 'Z37 Internal maintenance for in-Stock Truck(value change)'
            });
            $scope.workTypes.push({label: 'ZS03_Z38', value: 'Z38 Internal Cross-region billing'});
            $scope.workTypes.push({label: 'ZS03_Z39', value: 'Z39 Asset (STR) service(RE)'});
            $scope.workTypes.push({label: 'ZS03_Z3A', value: 'Z3A FOC Service from Truck Sales'});
            $scope.workTypes.push({label: 'ZS03_ZH1', value: 'ZH1 HQ Truck maintenance'});
            $scope.workTypes.push({label: 'ZS03_ZH2', value: 'ZH2 Testing truck event'});
            $scope.workTypes.push({label: 'ZS03_ZH3', value: 'ZH3 QM analyses'});
            $scope.workTypes.push({label: 'ZS03_ZH4', value: 'ZH4 anti-explosion truck reproduct'});
            $scope.workTypes.push({label: 'ZS03_ZOC', value: 'ZOC aftersales order changed\t'});
            $scope.workTypes.push({
                label: 'ZS03_ZR1',
                value: 'ZR1 Internal maintenance for rental truck refurbishment'
            });
            $scope.workTypes.push({label: 'ZS03_ZR2', value: 'ZR2 LRental truck refurbishment'});
            $scope.workTypes.push({label: 'ZS03_ZR3', value: 'ZR3 SRental truck refurbishment\t'});
            $scope.workTypes.push({label: 'ZS03_ZSS', value: 'ZSS sales support service'});
            $scope.workTypes.push({label: 'ZS03_ZTD', value: 'ZTD shipping damage'});
            $scope.workTypes.push({label: 'ZS04_Z40', value: 'Z40 Spare Parts Only Service\t'});
            $scope.workTypes.push({label: 'ZS05_Z37', value: 'Z37 In-Stock Truck(value change)'});
            $scope.workTypes.push({label: 'ZS06_ZR1', value: 'ZR1 Rental truck refurbishment'});
            $scope.workTypes.push({label: 'ZS08_Z80', value: 'Z80 Warranty'});
            $scope.workTypes.push({label: 'ZS08_Z81', value: 'Z81 Warranty job1'});
            $scope.workTypes.push({label: 'ZS08_Z82', value: 'Z82 Warranty job2'});
            $scope.workTypes.push({label: 'ZS08_Z83', value: 'Z83 Warranty job3'});
            console.log("$stateParams.SendInfo", $stateParams.SendInfo);
            console.log("$stateParams.workDescription", $stateParams.workDescription);
            userInfoId = $stateParams.SendInfo;
            workDescription = $stateParams.workDescription;
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
                    if (workDescription!=null){
                        $scope.callPhoneContent = workDescription;
                    }else{
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

        var checkMinutes = function(){
            if (finishTime.getMinutes()-m > 0){
                return {
                    index:1,
                    mm:finishTime.getMinutes() -m
                };
            }else{
                return {
                    index:2,
                    mm:finishTime.getMinutes + 60 - m
                };
            }
        };

        var checkHours = function(){
            if (arriveTime==null){
                $ionicPopup.alert({
                    title:"请选择到达时间"
                });
            }else{
                finishTime = new Date();
                if (finishTime.getHours()-arriveTime.getHours()>h){
                    var min = checkMinutes();
                    if (min.index == 1){
                        startTime = new Date((finishTime.getFullYear()+"-"+finishTime.getMonth()+"-"+finishTime.getDate()+" "+(finishTime.getHours()-h)+":"+min.mm+":"+finishTime.getSeconds()).replace(/-/,"/"));
                    }else{
                        startTime = new Date((finishTime.getFullYear()+"-"+finishTime.getMonth()+"-"+finishTime.getDate()+" "+(finishTime.getHours()-h-1)+":"+min.mm+":"+finishTime.getSeconds()).replace(/-/,"/"));
                    }
                }else{
                    startTime = arriveTime;
                }
                leaveTime=new Date();
                $("#leave")[0].style.backgroundColor = "#00FF7F"
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

        $scope.goBack = function () {
            window.history.back();
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
                        arriveTime =new Date();
                        startTime =new Date();
                        $event.target.style.backgroundColor = "#00FF7F";
                        console.log(arriveTime);
                    }
                }],
            });
        };


        $scope.doPrint = function ($event) {
            $ionicPopup.show({
                title:"是否确定打印？",
                buttons:[
                    {
                        text:"取消",
                        onTap:function () {

                        }
                    },
                    {
                        text:"确定",
                        onTap:function () {
                            $event.target.style.backgroundColor = "#00FF7F";
                        }
                    }
                ]
            });
        };

        $scope.signBill = function ($event) {
            $ionicPopup.show({
                title:"是否确定签单？",
                buttons:[
                    {
                        text:"取消",
                        onTap:function () {

                        }
                    },
                    {
                        text:"确定",
                        onTap:function () {
                            $event.target.style.backgroundColor = "#00FF7F";
                        }
                    }
                ]
            });
        };

        $scope.goSave = function () {
            if (arriveTime==null || finishTime ==null|| startTime==null||leaveTime==null){
                var ionPop = $ionicPopup.alert({
                    title: "请确认到达和离开时间"
                });
                return ;
            }
            for (var i = 0; i < $scope.imgUris.length; i++) {
                if ($scope.imgUris[i] != '././img/images/will_add_Img.png') {
                    localUris.push($scope.imgUris[i]);
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

            SOrderService.workDetailSaveButton(order, $('#workContentStr').val(), localUris, arriveTime, leaveTime, startTime, finishTime).then(function success(result) {
                console.log(result);
                $state.go("app.home");
            }, function error(error) {
                $log.error(error);
            });

        };
    });

