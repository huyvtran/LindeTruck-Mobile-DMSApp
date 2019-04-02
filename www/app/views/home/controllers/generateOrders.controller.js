(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('generateOrdersController',
      function ($scope, $ionicHistory, $ionicPopup, ForceClientService, LocalCacheService, $stateParams,
                AppUtilService) {
        var vm           = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);
        $scope.workTypes = [];
        $scope.deliveryTypes = [];
        $scope.upsertSapOrder = '/ServicePartsOrder?action=upsertSapOrder&serviceOrderOverviewId=';
        $scope.saveServicePartOrder = '/ServicePartsOrder?action=saveServicePartOrder&serviceOrderOverviewId=';
        $scope.preparePart = '/ServicePartsOrder?action=preparePart&servicePartOrderId=';
        /**
         * 本地初始化作业类型数据
         */
          $scope.workTypes.push({label: 'ZS01_Z10', value: 'Z10 按次收费服务'});
          $scope.workTypes.push({label: 'ZS01_Z11', value: 'Z11 代开票按次收费服务'});
          $scope.workTypes.push({label: 'ZS02_Z20', value: 'Z20 服务合同要求的服务'});
          $scope.workTypes.push({label: 'ZS02_Z21', value: 'Z21 合同期间长租车的服务（跨区域资产）'});
          $scope.workTypes.push({label: 'ZS02_Z22', value: 'Z22 合同期间长租车的服务（非跨区域资产-仅RE使用）'});
          $scope.workTypes.push({label: 'ZS03_Z30', value: 'Z30 资产（短租）车的服务'});
          $scope.workTypes.push({label: 'ZS03_Z31', value: 'Z31 库存（二手/新车）车的非销售要求的服务'});
          $scope.workTypes.push({label: 'ZS03_Z33', value: 'Z33 服务支持要求的服务'});
          $scope.workTypes.push({label: 'ZS03_Z35', value: 'Z35 工程师培训'});
          $scope.workTypes.push({label: 'ZS03_Z36', value: 'Z36 服务市场活动要求支持的服务'});
          $scope.workTypes.push({label: 'ZS03_Z38', value: 'Z38 跨区域要求的服务'});
          $scope.workTypes.push({label: 'ZS03_Z39', value: 'Z39 资产（短租）车的服务(上海)'});
          $scope.workTypes.push({label: 'ZS04_Z40', value: 'Z40 纯配件销售'});
          $scope.workTypes.push({label: 'ZS03_Z3A', value: 'Z3A 销售合同赠送的服务'});
          $scope.workTypes.push({label: 'ZS03_ZH1', value: 'ZH1 RC为HQ自用叉车提供维保'});
          $scope.workTypes.push({label: 'ZS03_ZH2', value: 'ZH2 测试车事务'});
          $scope.workTypes.push({label: 'ZS03_ZH3', value: 'ZH3 质量部质量分析'});
          $scope.workTypes.push({label: 'ZS03_ZH4', value: 'ZH4 防爆车交车前改装事务'});
          $scope.workTypes.push({label: 'ZS03_ZOC', value: 'ZOC 发车后订单修改'});
          $scope.workTypes.push({label: 'ZS03_ZR2', value: 'ZR2 长租资产化后加装、改装服务'});
          $scope.workTypes.push({label: 'ZS03_ZR3', value: 'ZR3 短租资产化后加装、改装服务'});
          $scope.workTypes.push({label: 'ZS03_ZSS', value: 'ZSS 一般销售支持'});
          $scope.workTypes.push({label: 'ZS03_ZTD', value: 'ZTD 运输损坏'});
          $scope.workTypes.push({label: 'ZS08_Z80', value: 'Z80 保修服务'});
          $scope.workTypes.push({label: 'ZS08_Z81', value: 'Z81 保修服务1'});
          $scope.workTypes.push({label: 'ZS08_Z82', value: 'Z82 保修服务2'});
          $scope.workTypes.push({label: 'ZS08_Z83', value: 'Z83 保修服务3'});

        /**
         * 本地初始化作业类型数据
         */
        $scope.deliveryTypes.push({label: '', value: ''});
        $scope.deliveryTypes.push({label: '1', value: '当日达'});
        $scope.deliveryTypes.push({label: '2', value: '次晨达'});
        $scope.deliveryTypes.push({label: '3', value: '次日达'});
        $scope.deliveryTypes.push({label: '4', value: '隔日达'});

        $scope.goBack = function () {
          $ionicHistory.goBack();
        };
        $(function () {
          var calendar = new lCalendar();
          calendar.init({
            'trigger': '#currentDate',
            'type': 'date'
          });
          // var calendar1 = new lCalendar();
          // calendar1.init({
          //   'trigger': '#currentDate1',
          //   'type': 'date'
          // });
          $scope.Consignee__c = oCurrentUser.Name;
          $scope.Delivery_Address__c = oCurrentUser.Address;

        });

        $(document).ready(function () {
          $('#select_work_type_g').find('option[value = ' + $stateParams.WorkOrderType + ']').attr('selected', true);

        });

        //         生成备件订单
        $scope.goToGenerate = function () {
          var seleCurrentDate = document.getElementById('currentDate').value;
          var getDelivery_Date__c = new Date(Date.parse(seleCurrentDate.replace(/-/g, '/'))).format('yyyy-MM-dd');
          if (getDelivery_Date__c == '1970-01-01') {
            var ionPop = $ionicPopup.alert({
              title: '请选择订单日期'
            });
            return;
          }
          AppUtilService.showLoading();
          var payload1 = $scope.upsertSapOrder + $stateParams.workOrderId + "&isSavePartOrder=" + true;
          console.log('payload1', payload1);
          var servicePartOrder = {};
          servicePartOrder['Consignee__c'] = oCurrentUser.Id;//收货联系人: Consignee__c (User Id)
          servicePartOrder['Tel__c'] = $scope.Tel__c;// 联系电话
          servicePartOrder['Delivery_Address__c'] = $scope.Delivery_Address__c;//收货地址: Delivery_Address__c (Text 255)
          servicePartOrder['Part_Order_Type__c'] = 'ZCS1';// 订单类型
          servicePartOrder['Account__c'] = $stateParams.accountId;// 客户ID
          servicePartOrder['Service_Order_Overview__c'] = $stateParams.workOrderId;//工单ID
          servicePartOrder['Priority__c'] = document.getElementById('Priority__c').value;//订单等级
          servicePartOrder['Last_Work_Order_Type_Code__c'] = $('#select_work_type_g option:selected').val();//作业类型
          servicePartOrder['Delivery_Method__c'] = $('#delivery_type option:selected').val();//物流方式
          servicePartOrder['Delivery_Date__c'] = getDelivery_Date__c;// 订单日期
          servicePartOrder['Entire__c'] = document.getElementById('Entire__c').checked;// 是否整单交货
          var payload2 = $scope.saveServicePartOrder + $stateParams.workOrderId + '&servicePartOrder=' + JSON.stringify(
            servicePartOrder) + "&isSavePartOrder=" + true;
          console.log('payload2', payload2);

          ForceClientService.getForceClient().apexrest(payload1, 'POST', {}, null, function (response1) { //生成备件接口一
            console.log('POST_success1:', response1);
            if (response1.status == 'fail') {
              AppUtilService.hideLoading();
              var ionPop = $ionicPopup.alert({
                title: response1.message
              });
              return;
            }
            ForceClientService.getForceClient().apexrest(payload2, 'POST', {}, null, function (response2) { //生成备件接口二
              console.log('POST_success2:', response2);
              AppUtilService.hideLoading();
              if (response2.status == 'success') {
                var ionPop = $ionicPopup.alert({
                  title: '生成备件成功'
                });
                ionPop.then(function (res) {
                  $ionicHistory.goBack();
                });
              } else {
                var ionPop = $ionicPopup.alert({
                  title: response2.message
                });
                ionPop.then(function (res) {
                  $ionicHistory.goBack();
                });
              }
              // var payload3 = $scope.preparePart + response2.servicePartOrderId;
              // console.log("payload3", payload3);
              // ForceClientService.getForceClient().apexrest(payload3, 'POST', {}, null, function (response3) { //生成备件接口二
              //     console.log("POST_success3:", response3);
              //     AppUtilService.hideLoading();
              //     if (response3.status == "success"){
              //         var ionPop = $ionicPopup.alert({
              //             title: "生成备件成功"
              //         });
              //         ionPop.then(function (res) {
              //             $ionicHistory.goBack();
              //         });
              //     }else {
              //         var ionPop = $ionicPopup.alert({
              //             title: response3.message
              //         });
              //         ionPop.then(function (res) {
              //             $ionicHistory.goBack();
              //         });
              //     }
              // }, function (error) {
              //     console.log("response2POST_error:", error);
              //     AppUtilService.hideLoading();
              //     var ionPop = $ionicPopup.alert({
              //         title: "生成备件失败"
              //     });
              // });

            }, function (error) {
              console.log('response1POST_error:', error);
              AppUtilService.hideLoading();
              var ionPop = $ionicPopup.alert({
                title: '生成备件失败'
              });
            });

          }, function (error) {
            console.log('POST_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '生成备件失败'
            });
          });
        };
      });

})();
