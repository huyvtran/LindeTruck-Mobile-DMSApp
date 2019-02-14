(function () {
  'use strict';


  angular.module('oinio.PurChaseDetailController', [])
    .controller('PurChaseDetailController', function ($scope, $rootScope, $filter, $state,$log,$ionicPopup,$stateParams, ConnectionMonitor,
                                                LocalCacheService,ProcurementInfoService,AppUtilService,Service1Service,ForceClientService) {

      var vm = this,
          supplierInfoSoupId = null,
          localMaterials=[],
          localQuantities=[],
          express = /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/,
          oCurrentUser = LocalCacheService.get('currentUser') || {};
      $scope.recordTypes = [];
      $scope.Taxes =[];
      $scope.statuses =[];
      $scope.allBusinesses=[];
      $scope.allMaterial=[];
      $scope.allWorkOrders=[];
      $scope.chooseItem=null;
      $scope.chooseMaterials=[];
      $scope.chooseWorkOrder = null;
      $scope.chooseWorkOrderId = null;
      $scope.profitRate=0;
      $scope.revenue=0;
      $scope.priceEach=0;
      vm.isOnline = null;
      $scope.selectedRecordType=null;
      $scope.getPurchase={};
      $scope.getWorkOrdersUrl="/ProcurementInformation?type=WorkOrder&name=";
      $scope.postPurChaseUrl="/ProcurementInformation?newProcurementInfo=";

      /**
       * @func    $scope.$on('$ionicView.beforeEnter')
       * @desc
       */
      $scope.$on('$ionicView.beforeEnter', function () {
        LocalCacheService.set('previousStateForSCReady', $state.current.name);
        LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        // var calendar = new lCalendar();
        // calendar.init({
        //   'trigger': '#planDate',
        //   'type': 'date'
        // });
        //ng-click="searchForWorkOrder();"
        // ng-click="searchForBusiness();"
        AppUtilService.showLoading();

        Service1Service.getProcurementInfoDetail($stateParams.overviewId).then(function (response) {
          console.log('response',response);
          $scope.getPurchase = response;
          $scope.chooseMaterials = response.newProcurementInfoItem;
          $scope.chooseWorkOrder = response.Service_Order_Overview__r;
          $scope.chooseItem = response.Supplier_Information__r;

          $scope.revenue = response.Revenue__c;
          $scope.priceEach = response.Price_without_Tax__c;

          var  recordIndex = _.findIndex($scope.recordTypes, function(recordT) {
            return recordT.value == response.RecordType.Name;
          });

          document.getElementById('recordTypeList')[recordIndex].selected = true;

          var  statusIndex = _.findIndex($scope.statuses, function(statuse) {
            return statuse.value == response.Status__c;
          });

          document.getElementById('statusList')[statusIndex].selected = true;

          var  taxeIndex = _.findIndex($scope.Taxes, function(taxe) {
            return taxe.label == response.Tax__c;
          });

          document.getElementById('taxList')[taxeIndex].selected = true;

          $scope.countProfitRates();

          AppUtilService.hideLoading();

        }, function (error) {
          AppUtilService.hideLoading();
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


        $scope.Taxes.push({label:"J6 16% Input Tax, China",value:"J6 16% 进项税, 中国"});
        $scope.Taxes.push({label:"J0 0% Input Tax, China",value:"J0 0% 进项税, 中国"});
        $scope.Taxes.push({label:"J2 13% Input Tax, China",value:"J2 13% 进项税, 中国"});
        $scope.Taxes.push({label:"J3 3% Input Tax, China",value:"J3 3% 进项税, 中国"});
        $scope.Taxes.push({label:"J4 6% Input Tax, China",value:"J4 6% 进项税, 中国"});
        $scope.Taxes.push({label:"J5 11% Input Tax, China",value:"J5 11% 进项税, 中国"});
        $scope.Taxes.push({label:"J7 10% Input Tax, China",value:"J7 10% 进项税, 中国"});

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

      $scope.showLoading = function(){
        //$('#loadingContainer').show();
        AppUtilService.showLoading();
      };
      $scope.hideLoading = function(){
        //$('#loadingContainer').hide();
        AppUtilService.hideLoading();
      };


      $scope.searchForWorkOrder =function(){
        if (document.getElementById("serachWorkOrderContent").style.display == "none") {
          document.getElementById("serachWorkOrderContent").style.display = "block";//显示
          document.getElementById("busyAllContent").style.display = "none";//隐藏
        } else {
          document.getElementById("serachWorkOrderContent").style.display = "none";//隐藏
          document.getElementById("busyAllContent").style.display = "block";//显示
        }
      };

      $scope.showContentHideWorkOrder = function(){
        document.getElementById("busyAllContent").style.display = "block";
        document.getElementById("serachWorkOrderContent").style.display = "none";
        $scope.allWorkOrders=[];
      };

      $scope.searchWorkOrderByNameAndId = function(){
        $scope.showLoading();
        var nameOrId = $("#searchBig3").val();
        if (nameOrId==null||nameOrId==""){
          $ionicPopup.alert({
            title:"搜索内容不能为空!"
          });
          $scope.hideLoading();
          return;
        }
        //AppUtilService.showLoading();
        $scope.allWorkOrders=[];
        ForceClientService.getForceClient().apexrest(
          $scope.getWorkOrdersUrl+nameOrId,
          'GET',
          {},
          null,
          function callBack(res) {
            console.log(res);
            if (res!=null && res.length>0){
              angular.forEach(res,function (item,index,array){
                $scope.allWorkOrders.push(item);
              });
              $scope.hideLoading();
            }else{
              $ionicPopup.alert({
                title:"没有搜索到相关数据!"
              });
              $scope.allWorkOrders=[];
              $scope.hideLoading();
            }
          },function error(msg) {
            $log.error(msg);
            console.log(msg);
            $scope.hideLoading();
          }
        );
      };

      $scope.chooseCurrentWorkOrder =function(obj){
        $scope.chooseWorkOrder = obj;

        $scope.chooseWorkOrderId = obj.Id;
        document.getElementById("busyAllContent").style.display = "block";
        document.getElementById("serachWorkOrderContent").style.display= "none";
        $scope.allWorkOrders=[];
      };


      // $scope.addOrDelMaterial = function(){
        // if (document.getElementById("materialAddBox").className == "btn_modify_Div to_Hide") {
        //   document.getElementById("materialAddBox").className = "btn_modify_Div to_Open";//显示
        // } else {
        //   document.getElementById("materialAddBox").className = "btn_modify_Div to_Hide";//隐藏
        // }
      // };


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
        $scope.showLoading();
        var nameOrId = $("#searchBig").val();
        if (nameOrId==null||nameOrId==""){
          $ionicPopup.alert({
            title:"搜索内容不能为空!"
          });
          $scope.hideLoading();
          return;
        }
        //AppUtilService.showLoading();
        $scope.allBusinesses=[];
        ForceClientService.getForceClient().apexrest(
          $scope.getSupplierInfoUrl+nameOrId,
          'GET',
          {},
          null,
          function callBack(res) {
            console.log(res);
            if (res.length>0){
              angular.forEach(res,function (item,index,array){
                $scope.allBusinesses.push(item);
              });
              $scope.hideLoading();
            }else{
              $ionicPopup.alert({
                title:"没有搜索到相关数据!"
              });
              $scope.allBusinesses=[];
              $scope.hideLoading();
            }
          },function error(msg) {
            $log.error(msg);
            console.log(msg);
            $scope.hideLoading();
          }
        );

        // ProcurementInfoService.querySupplierInformation(nameOrId).then(function success(res) {
        //     $log.info(res);
        //     console.log(res);
        //     if (res.length>0){
        //         angular.forEach(res,function (item,index,array){
        //             $scope.allBusinesses.push(item);
        //         });
        //     }else{
        //         $ionicPopup.alert({
        //             title:"没有搜索到相关数据!"
        //         });
        //         $scope.allBusinesses=[];
        //     }
        // },function error(msg) {
        //     $log.error(msg);
        //     console.log(msg);
        // }).finally(function () {
        //     //AppUtilService.hideLoading();
        // });
      };

      $scope.chooseCurrentBusy =function(obj){
        $scope.chooseItem = obj;
        supplierInfoSoupId = obj.Id;
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
        $scope.showLoading();
        var searchName = $("#searchBig2").val();

        if (searchName==null||searchName==""){
          $ionicPopup.alert({
            title:"搜索内容不能为空!"
          });
          $scope.hideLoading();
          return;
        }
        $scope.allMaterial=[];
        //AppUtilService.showLoading();
        ForceClientService.getForceClient().apexrest(
          $scope.getServiceMaterialUrl+searchName,
          'GET',
          {},
          null,
          function callBack(res) {
            console.log(res);
            if (res.length>0){
              angular.forEach(res,function (item, index, array) {
                $scope.allMaterial.push(item);
              });
              $scope.hideLoading();
            }else{
              $ionicPopup.alert({
                title:"没有搜索到相关数据!"
              });
              $scope.allMaterial=[];
              $scope.hideLoading();
            }
          },function error(msg) {
            $log.error(msg);
            console.log(msg);
            $scope.hideLoading();
          }
        );


        // ProcurementInfoService.queryServiceMaterial(searchName).then(function success(res) {
        //     $log.info(res);
        //     console.log(res);
        //     if (res.length>0){
        //         angular.forEach(res,function (item, index, array) {
        //             $scope.allMaterial.push(item);
        //         });
        //     }else{
        //         $ionicPopup.alert({
        //             title:"没有搜索到相关数据!"
        //         });
        //         $scope.allMaterial=[];
        //     }
        //     //AppUtilService.hideLoading();
        // },function error(msg) {
        //     $log.error(msg);
        //     console.log(msg);
        //     //AppUtilService.hideLoading();
        // }).finally(function () {
        //     //AppUtilService.hideLoading();
        // });
      };

      $scope.chooseCurrentMaterial = function(obj){

        var objOther = {};
        objOther.Item_Code__c =obj.Name!=null?obj.Name:"";
        objOther.Required_Quantity__c =1;
        objOther.Item_Description__c =obj.parts_description__c!=null?obj.parts_description__c:"";
        objOther.Factory__c =obj.Factory__c!=null?obj.Factory__c:"";
        objOther.Unite_Price__c =obj.Cost_Price__c!=null?Number(obj.Cost_Price__c):0;

        if (localMaterials.length>0){
          for(var i =0;i<localMaterials.length;i++){
            if (localMaterials[i].Item_Code__c!=obj.Name){
              localMaterials.push(objOther);
            }
          }
        }else{
          localMaterials.push(objOther);
        }
        $scope.chooseMaterials=localMaterials;

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

      vm.getCountProfitRates= function (){
        $scope.countProfitRates();
      };
      $scope.countProfitRates = function(){
        var taxStrArray = ($('#taxList option:selected').val()).split(" ");
        var taxRate = ((taxStrArray[1]).split("%")[0])*0.01;
        var localRevenue = Number($scope.revenue);
        var localProfitFach = Number($scope.priceEach);
        if (localProfitFach>0){
          //$scope.profitRate=((localRevenue-localProfitFach-(localRevenue*taxRate))/localProfitFach)*100;
          $scope.profitRate=(((localRevenue/1.16-localProfitFach/(1+taxRate))/(localRevenue/1.16))*100).toFixed(2);
        }
      };

      $scope.goBack =function () {
        window.history.back();
      };


      $scope.goSavePurChase =function () {
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


        if (!express.test($scope.revenue)){
          $ionicPopup.alert({
            title: "订单收入 请输入非负数"
          });
          return;
        }

        if (!express.test($scope.priceEach)){
          $ionicPopup.alert({
            title: "采购价格 请输入非负数"
          });
          return;
        }

        $("input.sv_Input_Quantity").each(function (index, element) {
          localQuantities.push(Number($(this).val()));
        });


        var procurementInfo=[ {
          recordType:{
            Name:$('#recordTypeList option:selected').val()
          },
          Delivery_Date__c:planDate,
          Procurement_Description__c:$("#purchaseDesc").val().trim(),
          Status__c:$('#statusList option:selected').val(),
          Tax__c:$('#recordTypeList option:selected').val(),
          Revenue__c:$scope.revenue,
          Price_without_Tax__c:$scope.priceEach,
          Profit__c:$scope.profitRate,
          Remarks__c:$("#purchaseMore").val().trim(),
          Service_Order_Overview__c:$scope.chooseWorkOrderId,
        }];
        AppUtilService.showLoading();

        //离线转在线
        // ProcurementInfoService.ProcurementInfoSaveButton(procurementInfo,supplierInfoSoupId, $scope.chooseMaterials).then(function success(res) {
        //         console.log(res);
        //         $log.info(res);
        //     AppUtilService.hideLoading();
        //     $state.go('app.home');
        // },function error(msg) {
        //         console.log(msg);
        //         $log.error(msg);
        //     AppUtilService.hideLoading();
        // });

        ForceClientService.getForceClient().apexrest(
          $scope.postPurChaseUrl+JSON.stringify(procurementInfo)+'&recordType='+$('#recordTypeList option:selected').val()+"&newProcurementInfoItem="+JSON.stringify($scope.chooseMaterials),
          'POST',
          {},
          null,
          function callBack(res) {
            AppUtilService.hideLoading();
            if (res.status.toLowerCase()=="success"){
              $state.go('app.home');
            }else{
              $ionicPopup.alert({
                title:"保存数据失败"
              });
              return false;
            }
          },function error(msg) {
            AppUtilService.hideLoading();
            $ionicPopup.alert({
              title:"保存数据失败"
            });
            return false;
          }
        );
      };

    });

})();

