(function () {
    'use strict';


    angular.module('oinio.PurChaseController', [])
        .controller('PurChaseController', function ($scope, $rootScope, $filter, $state,$log,$ionicPopup,$stateParams, ConnectionMonitor,
                                                    LocalCacheService,ProcurementInfoService,AppUtilService) {

            var vm = this,
                supplierInfoSoupId = null,
                localMaterials=[],
                localQuantities=[],
                oCurrentUser = LocalCacheService.get('currentUser') || {};
            $scope.recordTypes = [];
            $scope.Taxes =[];
            $scope.statuses =[];
            $scope.allBusinesses=[];
            $scope.allMaterial=[];
            $scope.chooseItem=null;
            $scope.chooseMaterials=[];
            vm.isOnline = null;

            /**
             * @func    $scope.$on('$ionicView.beforeEnter')
             * @desc
             */
            $scope.$on('$ionicView.beforeEnter', function () {
                LocalCacheService.set('previousStateForSCReady', $state.current.name);
                LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

                var calendar = new lCalendar();
                calendar.init({
                    'trigger': '#planDate',
                    'type': 'date'
                });
            });
            $scope.$on('$ionicView.enter', function () {
                // check if device is online/offline
                vm.isOnline = ConnectionMonitor.isOnline();
                if (oCurrentUser) {
                    vm.username = oCurrentUser.Name;
                }

                $scope.recordTypes.push({value:"Service Parts Procurement"});
                $scope.recordTypes.push({value:"Service Support Procurement"});


                $scope.statuses.push({value:"Draft"});
                $scope.statuses.push({value:"Approving"});
                $scope.statuses.push({value:"Approved"});
                $scope.statuses.push({value:"Completed"});

                $scope.Taxes.push({value:"A4 6% Fixed Assets Input Tax,China"});
                $scope.Taxes.push({value:"A5 11% Fixed Assets Input Tax,China"});
                $scope.Taxes.push({value:"A6 16% Fixed Assets Input Tax,China"});
                $scope.Taxes.push({value:"A7 10% Fixed Assets Input Tax,China"});
                $scope.Taxes.push({value:"J0 0% Input Tax, China"});
                $scope.Taxes.push({value:"J1 17% Input Tax, China"});
                $scope.Taxes.push({value:"J2 13% Input Tax, China"});
                $scope.Taxes.push({value:"J3 3% Input Tax, China"});
                $scope.Taxes.push({value:"J4 6% Input Tax, China"});
                $scope.Taxes.push({value:"J5 11% Input Tax, China"});
                $scope.Taxes.push({value:"J6 16% Input Tax, China"});
                $scope.Taxes.push({value:"J7 10% Input Tax, China"});
                $scope.Taxes.push({value:"L1 5% Luxuries Tax, China"});
                $scope.Taxes.push({value:"X0 0% Input Tax, China"});
                $scope.Taxes.push({value:"X1 17% Input Tax, China"});
                $scope.Taxes.push({value:"X2 13% Input Tax, China"});
                $scope.Taxes.push({value:"X3 3% Input Tax, China"});
                $scope.Taxes.push({value:"X4 6% Input Tax, China"});
                $scope.Taxes.push({value:"X6 16% Input Tax, China"});




            });
            $scope.showMaterialPage = function(){
                if (document.getElementById("serachMaterialContent").style.display == "none") {
                    document.getElementById("serachMaterialContent").style.display = "block";//显示
                    document.getElementById("busyAllContent").style.display = "none";//隐藏
                } else {
                    document.getElementById("serachMaterialContent").style.display = "none";//隐藏
                    document.getElementById("busyAllContent").style.display = "block";//显示
                }
                document.getElementById("materialAddBox").className = "btn_modify_Div to_Hide";
            };


            $scope.searchForBusiness =function(){
                if (document.getElementById("serachBusinessContent").style.display == "none") {
                    document.getElementById("serachBusinessContent").style.display = "block";//显示
                    document.getElementById("busyAllContent").style.display = "none";//隐藏
                } else {
                    document.getElementById("serachBusinessContent").style.display = "none";//隐藏
                    document.getElementById("busyAllContent").style.display = "block";//显示
                }
            };

            $scope.showBusinessInfo = function(){
                if (document.getElementById("businessBox").style.display == "none") {
                    document.getElementById("businessBox").style.display = "block";//显示
                    document.getElementById("businessInfoImg").className = "arrow_Down_White";
                } else {
                    document.getElementById("businessBox").style.display = "none";//隐藏
                    document.getElementById("businessInfoImg").className = "arrow_Down_White";
                }
            };


            $scope.showBaseInfo = function(){
                if (document.getElementById("baseBugInfo").style.display == "none") {
                    document.getElementById("baseBugInfo").style.display = "block";//显示
                    document.getElementById("baseInfoImg").className = "OpenClose_Btn arrow_Down_White";
                } else {
                    document.getElementById("baseBugInfo").style.display = "none";//隐藏
                    document.getElementById("baseInfoImg").className = "OpenClose_Btn arrow_Down_White";
                }
            };


            $scope.showMaterialInfo = function(){
                if (document.getElementById("materialContent").style.display == "none") {
                    document.getElementById("materialContent").style.display = "block";//显示
                    document.getElementById("materialImg").className = "OpenClose_Btn arrow_Down_White";
                } else {
                    document.getElementById("materialContent").style.display = "none";//隐藏
                    document.getElementById("materialImg").className = "OpenClose_Btn arrow_Down_White";

                }

            };



            $scope.addOrDelMaterial = function(){
                if (document.getElementById("materialAddBox").className == "btn_modify_Div to_Hide") {
                    document.getElementById("materialAddBox").className = "btn_modify_Div to_Open";//显示
                } else {
                    document.getElementById("materialAddBox").className = "btn_modify_Div to_Hide";//隐藏
                }
            };


            $scope.showContentHideBusiness = function(){
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachBusinessContent").style.display = "none";
                $scope.allBusinesses=[];
            };


            $scope.showContentHideMaterial = function(){
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachMaterialContent").style.display = "none";
                $scope.allMaterial=[];
            };




            $scope.searchBusinessByNameAndId = function(){
                var nameOrId = $("#searchBig").val();
                if (nameOrId==null||nameOrId==""){
                    $ionicPopup.alert({
                        title:"搜索内容不能为空!"
                    });
                    return;
                }
                AppUtilService.showLoading();
                ProcurementInfoService.querySupplierInformation(nameOrId).then(function success(res) {
                    $log.info(res);
                    console.log(res);
                    if (res.length>0){
                        angular.forEach(res,function (item,index,array){
                            $scope.allBusinesses.push(item);
                        });
                    }else{
                        $ionicPopup.alert({
                            title:"没有搜索到相关数据!"
                        });
                        $scope.allBusinesses=[];
                    }
                    AppUtilService.hideLoading();
                },function error(msg) {
                    $log.error(msg);
                    console.log(msg);
                    AppUtilService.hideLoading();
                });
            };

            $scope.chooseCurrentBusy =function(obj){
                $scope.chooseItem = obj;
                supplierInfoSoupId = obj._soupEntryId;
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachBusinessContent").style.display= "none";
                $scope.allBusinesses=[];
            };

            $scope.selectAllMaterial =function(){
                var ele = $("#selectMaterialCheck");
                if (ele.prop("checked")){
                    $("input.sv_checkboxItem").each(function (index, element) {
                        $(this).prop("checked", true);
                    });
                }else{
                    $("input.sv_checkboxItem").each(function (index, element) {
                        $(this).prop("checked", false);
                    });
                }
            };



            $scope.searchMaterilaByName =function(){
                var searchName = $("#searchBig2").val();

                if (searchName==null||searchName==""){
                    $ionicPopup.alert({
                        title:"搜索内容不能为空!"
                    });
                    return;
                }
                $scope.allMaterial=[];
                AppUtilService.showLoading();
                ProcurementInfoService.queryServiceMaterial(searchName).then(function success(res) {
                    $log.info(res);
                    console.log(res);
                    if (res.length>0){
                        angular.forEach(res,function (item, index, array) {
                            $scope.allMaterial.push(item);
                        });
                    }else{
                        $ionicPopup.alert({
                            title:"没有搜索到相关数据!"
                        });
                        $scope.allMaterial=[];
                    }
                    AppUtilService.hideLoading();
                },function error(msg) {
                    $log.error(msg);
                    console.log(msg);
                    AppUtilService.hideLoading();
                });
            };

            $scope.chooseCurrentMaterial = function(obj){
                obj.Required_Quantity__c = 1;
                if ($scope.chooseMaterials.length>0){
                    angular.forEach($scope.chooseMaterials,function (item,index,array) {
                        if ($scope.chooseMaterials[index].Name == obj.Name){
                            $scope.chooseMaterials[index].Required_Quantity__c+=1;
                        }else{
                            $scope.chooseMaterials.push(obj);
                        }
                    });
                }else{
                    $scope.chooseMaterials.push(obj);
                }


                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachMaterialContent").style.display = "none";
                $scope.allMaterial=[];
            };


            $scope.deleteSelectMatelials = function(){
                document.getElementById("materialAddBox").className = "btn_modify_Div to_Hide";
                $("input.sv_checkboxItem").each(function (index, element) {
                    if ($(this).prop("checked")){
                       $scope.chooseMaterials.splice(index,1);
                    }
                });
            };

            $scope.goBack =function () {
                window.history.back();
            };


            $scope.goSavePurChase =function () {
                var express = /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/;
                var planDate = $("#planDate").val();

                if (!planDate){
                    $ionicPopup.alert({
                        title: "请选择计划日期"
                    });
                    return;
                }
                if (supplierInfoSoupId==null){
                    $ionicPopup.alert({
                        title: "请选择供应商"
                    });
                    return;
                }

                var revenue = $("#revenue").val().trim();
                var priceEach=$("#priceEach").val().trim();
                if (!express.test(revenue)||revenue==0){
                    $ionicPopup.alert({
                        title: "订单收入 请输入正数"
                    });
                    return;
                }

                if (!express.test(priceEach)||priceEach==0){
                    $ionicPopup.alert({
                        title: "采购价格 请输入正数"
                    });
                    return;
                }

                $("input.sv_Input_Quantity").each(function (index, element) {
                    localQuantities.push(Number($(this).val()));
                });

                // if ($scope.chooseMaterials.length>0){
                //     angular.forEach($scope.chooseMaterials,function (item, index, array) {
                //         localMaterials.push({
                //             Item_Code__c:item.Name,
                //             Required_Quantity__c:localQuantities[index],
                //             Item_Description__c:item.parts_description__c,
                //             Factory__c:item.Factory__c,
                //             Unite_Price__c:item.Cost_Price__c
                //         });
                //     });
                // }


                var procurementInfo= {
                    recordType:$('#recordTypeList option:selected').val(),
                    Delivery_Date__c:planDate,
                    Procurement_Description__c:$("#purchaseDesc").val().trim(),
                    Status__c:$('#statusList option:selected').val(),
                    Tax__c:$('#recordTypeList option:selected').val(),
                    Revenue__c:$("#revenue").val().trim(),
                    Price_without_Tax__c:$("#priceEach").val().trim(),
                    Profit__c:$("#profit").val().trim(),
                    Remarks__c:$("#purchaseMore").val().trim()
                };
                AppUtilService.showLoading();
                ProcurementInfoService.ProcurementInfoSaveButton(procurementInfo,supplierInfoSoupId, $scope.chooseMaterials).then(function success(res) {
                        console.log(res);
                        $log.info(res);
                    AppUtilService.hideLoading();
                    $state.go('app.home');
                },function error(msg) {
                        console.log(msg);
                        $log.error(msg);
                    AppUtilService.hideLoading();
                });

            };

        });

})();

