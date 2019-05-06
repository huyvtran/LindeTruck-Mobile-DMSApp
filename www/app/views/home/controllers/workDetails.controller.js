(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('workDetailsController',
      function ($scope, $rootScope, $q,$filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
                LocalCacheService, HomeService, AppUtilService, ForceClientService, SQuoteService,
                dualModeService) {

        var vm                   = this,
            doOnline             = true,
            arriveTime           = null,
            leaveTime            = null,
            localWorkers         = [],
            goOffTimeFromPrefix  = null,
            workDescription      = null,
            allowEdit            = false,
            myPopup              = null,
            userInfoId           = '',
            Account_Ship_to__c   = '',
            localSoupEntryId     = '',
            localUris            = [],
            regroupVarRefundList = [],
            customerNameValue    = '',
            customerAccountValue = '',
            customerAddressValue = '',
            truckNumber          = '',
            ownerName            = '',
            orderDetailsId       = '',//工单详情ID
            truckItems           = [],
            truckItemsSecond     = [],
            regroupPartList      = [], ///配件组装数据用于保存
            ah                   = 0,
            am                   = 0,
            h                    = 0,
            m                    = 0,
            localLatitude        = null,
            localLongitude       = null,
            localAccountShipToc  = null,
            goTime               = null,
            truckIds             = [],
            initChildOrders      = [],
            initTrucks           = [],
            orderAccountId       = null,
            orderBelong          = true,
            selectTypeIndex      = 0, //作业类型默认选择第一个
            enableArrival        = true,
            oCurrentUser         = LocalCacheService.get('currentUser') || {};
        vm.isOnline = null;

        $scope.shipToSapNumber = "";
        $scope.soldToSapNumber = "";
        $scope.serviceOrderSapNumber = "";

        $scope.checkNinePices = false;
        $scope.printWorkContent="";
        //配件相关init
        $scope.contentTruckFitItems = [];//配件
        $scope.selectedTruckFitItems = [];
        $scope.contentTruckParts = [];//常用配件列表
        $scope.contentTruckItems = [];//常用配件筛选
        $scope.contentLSGs = [];//LSG
        $scope.rejectedItems = [];
        $scope.serviceFeeList = [];
        $scope.quoteLabourOriginalsList = [];
        $scope.searchPartssUrl = '/Partss?keyword=';
        $scope.partsRelatedsUrl = '/PartsRelateds?partsNumbers=';
        $scope.partLSGServer = '/LSGServer';
        $scope.savePartsUrl = '/ServiceOrderMaterial?type=updateServiceOrderMaterial&serviceOrderOvId=';
        $scope.getPartsForReadUrl = '/ServiceOrderMaterial?type=getServiceOrderMaterialSums&serviceOrderOvId=';
        $scope.getDeliveryOrder = '/DeliverOrderService?action=queryWithOrderId&dlvrOrdId=';
        $scope.getNewWorkDetailService = '/NewWorkDetailService?sooId=';
        $scope.postDataToRemote = '/WorkDetailService?action=saveAction';
        $scope.getInitDataUri = '/WorkDetailService';
        $scope.convertOrderToQuoteUrl = '/Service1Service?type=convertOrderToQuote&param=';
        $scope.workers = [];//全部派工人员
        $scope.selectWorkersArr = [];//已选派工人员
        $scope.selectWorkersStr = '';//已选派工人员组成字符串
        $scope.searchWorkersText = '';
        $scope.updateDataStatusUrl = '/WorkDetailService?action=updateStatus';
        $scope.getMaintanceChoiceUrl = '/NewWorkDetailService?model=';
        $scope.HasTruckNum = 0;
        $scope.SelectedTruckNum = 0;
        $scope.workTypes = [];
        $scope.carServices = [];
        $scope.showFooter = true;
        $scope.openPrint = false;
        $scope.bfObjs = [];
        $scope.afObjs = [];
        var initmjiInfos = [];
        var initmjiInfosSecond = [];
        var initLevel="";
        $scope.mainTanceChioces = [];
        $scope.imgUris = [
          {
            imageId: '',
            imageBody: '././img/images/will_add_Img.png',
            // imageName: new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
          }
        ];
        //Maintain before
        $scope.imgUrisBefore = [
          {
            imageId: '',
            imageBody: '././img/images/will_add_Img.png',
            // imageName: 'bfth_'+new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
          }
        ];
        //Maintain after
        $scope.imgUrisAfter = [
          {
            imageId: '',
            imageBody: '././img/images/will_add_Img.png',
            // imageName: 'afth_'+new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
          }
        ];

        $scope.selectedTruckItemsMore = [];
        $scope.arrivalPostUrl = '/WorkDetailService?action=arrival&sooId=';
        $scope.leavePostUrl = '/WorkDetailService?action=leave&sooId=';
        $scope.departureUrl = '/WorkDetailService?action=departure&sooId=';
        $scope.searchAddTruckText = '';

        $scope.engineerImgStr = '././img/images/will_add_Img.png';
        $scope.busyImgStr = '././img/images/will_add_Img.png';

        $scope.getOrderTypeUri = '/NewWorkDetailService?serviceOrderViewId=';
        $scope.getPersonalPartListService = '/PersonalPartListService?action=getParts&userId=';
        $scope.getPartsWithKeyWord = '/PersonalPartListService?action=getPartsWithKeyWord&userId=';
        $scope.reloadWorkitemsUrl = '/NewWorkDetailService?action=getWorkItems&wiParent=';

        $scope.customerNameValueShow = '';   //客户名称
        $scope.customerAccountValueShow = '';//客户号
        $scope.customerAddressValueShow = ''; //客户地址
        $scope.truckTypesValueShow = '';//叉车型号
        $scope.ownerNameShow = '';//负责工程师
        $scope.workHourShow = '';//工作小时
        $scope.callStrShow = '';//报修需求
        //$scope.workContentShow = '';//工作信息
        $scope.suggestionShoW = '';//结果及建议

        $scope.localWorkItems = [];
        $scope.workTimes = [];//工作时间列表
        $scope.serPartOdStatus = '';//备件状态
        $scope.maintainType = false;
        $scope.mcb = false;
        $scope.serviceLevels = [''];
        $scope.serviceNames = [];
        $scope.showOrderBelong = true;
        $scope.localAccId = '';
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {
          console.log('$stateParams.SendInfo', $stateParams.SendInfo);
          console.log('$stateParams.workDescription', $stateParams.workDescription);
          console.log('$stateParams.goOffTime', $stateParams.goOffTime);
          console.log('$stateParams.isNewWorkList', $stateParams.isNewWorkList);
          console.log('$stateParams.selectTypeIndex', $stateParams.selectWorkTypeIndex);
          console.log('$stateParams.workOrderId', $stateParams.workOrderId);
          console.log('$stateParams.enableArrivalBtn', $stateParams.enableArrivalBtn);
          console.log('$stateParams.accountId', $stateParams.accountId);
          console.log('$stateParams.orderBelong', $stateParams.orderBelong);
          console.log('$stateParams.openPrintPage', $stateParams.openPrintPage);

          userInfoId = $stateParams.SendInfo;
          Account_Ship_to__c = $stateParams.AccountShipToC;
          workDescription = $stateParams.workDescription;
          goOffTimeFromPrefix = $stateParams.goOffTime;
          allowEdit = $stateParams.isNewWorkList;
          orderDetailsId = $stateParams.workOrderId;
          $scope.showFooter = $stateParams.isNewWorkList;
          enableArrival = $stateParams.enableArrivalBtn;
          orderAccountId = $stateParams.accountId;
          orderBelong = $stateParams.orderBelong;
          $scope.showOrderBelong = orderBelong;
          $scope.openPrint = $stateParams.openPrintPage;
          //获取作业类型选择索引
          if ($stateParams.selectWorkTypeIndex != null) {
            selectTypeIndex = $stateParams.selectWorkTypeIndex;
          }

          if (goOffTimeFromPrefix != null) {
            for (var i = 0; i < 2; i++) {
              $('ol li:eq(' + i + ')').addClass('slds-is-active');
            }
            $('#departureBtn').css('pointer-events', 'none');
            $('#departureBtn').addClass('textCompleted');
            if (orderBelong) {
              $('#sidProgressBar').css('width', '25%');
            } else {
              $('#sidProgressBar').css('width', '33%');
            }
          }

          /**
           * 本地初始化服务类型数据
           */
          $scope.carServices.push({label: 'Maintenance', value: '保养'});
          $scope.carServices.push({label: 'Repair', value: '维修'});
          $scope.carServices.push({label: 'Inspection', value: '巡检'});

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
          $scope.workTypes.push({label: 'ZS04_Z40', value: 'Z40 纯配件销售'});
          $scope.workTypes.push({label: 'ZS08_Z80', value: 'Z80 保修服务'});
          $scope.workTypes.push({label: 'ZS08_Z81', value: 'Z81 保修服务1'});
          $scope.workTypes.push({label: 'ZS08_Z82', value: 'Z82 保修服务2'});
          $scope.workTypes.push({label: 'ZS08_Z83', value: 'Z83 保修服务3'});

          //before
          $scope.bfObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'bf_' + new Date().format('yyyyMMddhhmmss/') + '*整车'
            });
          $scope.bfObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'bf_' + new Date().format('yyyyMMddhhmmss/') + '*车体号'
            });
          $scope.bfObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'bf_' + new Date().format('yyyyMMddhhmmss/') + '*小时数'
            });
          $scope.bfObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'bf_' + new Date().format('yyyyMMddhhmmss/') + '*维修部位'
            });

          //after
          $scope.afObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'af_' + new Date().format('yyyyMMddhhmmss/') + '*整车'
            });
          $scope.afObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'af_' + new Date().format('yyyyMMddhhmmss/') + '*维修部位'
            });
          $scope.afObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'af_' + new Date().format('yyyyMMddhhmmss/') + '*更换旧件'
            });
          $scope.afObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'af_' + new Date().format('yyyyMMddhhmmss/') + '*维修现场'
            });
          $scope.afObjs.push(
            {
              imageId: '',
              imageBody: '././img/images/will_add_Img.png',
              imageName: 'af_' + new Date().format('yyyyMMddhhmmss/') + '*服务车外观及后备箱'
            });
        });

        // $scope.replacementPartStatus = function (type) {
        //   var returnType = '';
        //   if (type === 'Draft') {
        //     returnType = '草稿';
        //   } else if (type === 'Pending') {
        //     returnType = '待定';
        //   } else if (type === 'Approved') {
        //     returnType = '已审核';
        //   } else if (type === 'Reject') {
        //     returnType = '拒绝';
        //   }else {
        //     returnType = '';//其他
        //   }
        //   return returnType;
        // };

        $scope.$on('$ionicView.enter', function () {
          LocalCacheService.set('previousStateForSCReady', $state.current.name);
          LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
          vm.isOnline = ConnectionMonitor.isOnline();
          if (oCurrentUser) {
            vm.username = oCurrentUser.Name;
          }
          if (!allowEdit) {
            $('#workListDetailBody').css('height', '100vh');
            $('#call_str').prop('disabled', 'disabled');
            $('#workContentStr').prop('disabled', 'disabled');
            $('#serviceSuggest').prop('disabled', 'disabled');
          }

          if (!enableArrival) {
            $('#departureBtn').css('pointer-events', 'none');
            $('#arriveBtn').css('pointer-events', 'none');
            $('#leave').css('pointer-events', 'none');
            // $("#printBtn").css("pointer-events","none");
            // $("#signBillBtn").css("pointer-events","none");
          } else {
            $('#arriveBtn').css('pointer-events', '');
            $('#leave').css('pointer-events', '');
            $('#printBtn').css('pointer-events', '');
            $('#signBillBtn').css('pointer-events', '');
          }

          /**
           * 初始化 详细信息／工作信息／配件需求／交货列表／服务建议
           */
          //HomeService.searchUnplannedOrders2();
          AppUtilService.showLoading();
          dualModeService.getWorkOrderUtilInfo(Number(localStorage.onoffline),
            Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
            Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId).then(
            function callBack(res) {
              AppUtilService.hideLoading();
              console.log('getInitDataUri', res);
              $scope.initSoResult(res.soResult);
              $scope.initWorkItems(res.workItems, res.soResult.On_Order__c,res.soResult);
              $scope.initPartNumers(res.partNumers).then(function (res) {
                  return $scope.initPartNumersStep2(res.soResult);
              });
              $scope.initAssignUserData(res.assignUser);
              $scope.initSavedUserData(res.savedUser, res.assignUser);
              initChildOrders = res.childOrders;
              initmjiInfos = res.mjiInfos;
              initmjiInfosSecond = res.mjiInfos;
              if (Number(localStorage.onoffline) != 0) {

                $scope.initPhotoData(res.images);
                $scope.serPartOdStatus = res.serPartOdStatus;
                $scope.initSignature(res.sigEngineerImage, res.sigAcctImage);
                $scope.SelectedTruckNum = res.truckModels.length;
                $scope.initTrucks(res.truckModels, res.childOrders);
                initTrucks = res.truckModels;
                if (initTrucks != null) {
                  $scope.getMainLevelsAndDesc(initTrucks.length > 0?initTrucks[0]:{}).then(function (res0) {
                      return $scope.initChidOrderInfo(initTrucks[0], initChildOrders);
                  }).then(function (res1) {
                      return $scope.changeCareTypeStep1();
                  }).then(function (res2) {
                      return  $scope.changeCareTypeStep2();
                  }).then(function (res3) {
                     return $scope.confirmServiceModal();
                  }).then(function (res4) {
                      if ($scope.openPrint){
                          return $scope.getWorkContent(res.soResult);
                      }
                  }).then(function () {
                      return  $scope.getRefundList();
                  }).then(function () {
                      if ($scope.openPrint) {
                          $scope.doPrint();
                      }
                  });
                }
                $scope.allTruckItems = truckItems;

                //交货列表

                //*********读取配件*************** */
                $scope.getPartListForRead();
              }


            }, function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg.responseText);
            });
        });

        $scope.getWorkContent=function(soResult){
            if(soResult!=undefined&&soResult!=null){
                $scope.workContent = soResult.Description__c != undefined && soResult.Description__c != null ? soResult.Description__c : '';
            }
        };


        $scope.reloadTruckData = function(){
            AppUtilService.showLoading();
            dualModeService.getWorkOrderUtilInfo(Number(localStorage.onoffline),
                Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId).then(
                function callBack(res) {
                    AppUtilService.hideLoading();
                    if (Number(localStorage.onoffline) != 0) {
                        $scope.initTrucks(res.truckModels, res.childOrders);
                        $scope.allTruckItems = truckItems;
                        $scope.SelectedTruckNum=  $scope.allTruckItems.length;
                    }
                }, function error(msg) {
                    AppUtilService.hideLoading();
                    console.log(msg.responseText);
                });
        };


        $scope.initSoResult = function (soResult) {
          if (soResult != undefined && soResult != null) {
            $scope.Pricing_Date__c = soResult.Pricing_Date__c;//建单日
            $scope.Rate__c = soResult.Rate__c;//优惠价的税率

            $scope.mobileName = soResult.Name != undefined && soResult.Name != null ? soResult.Name : '';
            if(soResult.Main_Service_Order__r!=undefined &&soResult.Main_Service_Order__r!=null){
                if(soResult.Main_Service_Order__r.SAP_Number__c!=undefined&&soResult.Main_Service_Order__r.SAP_Number__c!=null&&soResult.Main_Service_Order__r.SAP_Number__c!=""){
                    $scope.serviceOrderSapNumber = "/"+soResult.Main_Service_Order__r.SAP_Number__c;
                }
            }
            if (soResult.Account_Ship_to__r != undefined&& soResult.Account_Ship_to__r != null) {
              //客户名称：
              customerNameValue =
                soResult.Account_Ship_to__r.Name != undefined && soResult.Account_Ship_to__r.Name != null
                  ? soResult.Account_Ship_to__r.Name : '';
              //客户号：
              customerAccountValue = soResult.Account_Ship_to__r.Customer_Number__c != undefined
                                     && soResult.Account_Ship_to__r.Customer_Number__c != null
                ? soResult.Account_Ship_to__r.Customer_Number__c : '';
              //客户地址：
              customerAddressValue =
                soResult.Account_Ship_to__r.Office_Address__c != undefined && soResult.Account_Ship_to__r.Office_Address__c != null
                  ? soResult.Account_Ship_to__r.Office_Address__c : '';
              if (soResult.Account_Ship_to__r.Id != null) {
                $scope.localAccId = soResult.Account_Ship_to__r.Id;
                $scope.getTrucksMore('');
              }
              if (soResult.Account_Ship_to__r.SAP_Number__c!=undefined && soResult.Account_Ship_to__r.SAP_Number__c!=null&&soResult.Account_Ship_to__r.SAP_Number__c!=""){
                 $scope.shipToSapNumber = "/"+soResult.Account_Ship_to__r.SAP_Number__c;
              }
              if (soResult.Account_Ship_to__r.Sold_To__r!=undefined && soResult.Account_Ship_to__r.Sold_To__r!=null){
                  if (soResult.Account_Ship_to__r.Sold_To__r.SAP_Number__c!=undefined && soResult.Account_Ship_to__r.Sold_To__r.SAP_Number__c!=null){
                      $scope.soldToSapNumber = soResult.Account_Ship_to__r.Sold_To__r.SAP_Number__c;
                  }else{
                      if (soResult.Account_Ship_to__r.SAP_Number__c!=undefined && soResult.Account_Ship_to__r.SAP_Number__c!=null){
                          $scope.soldToSapNumber = soResult.Account_Ship_to__r.SAP_Number__c;
                      }
                  }
              }else{
                  if (soResult.Account_Ship_to__r.SAP_Number__c!=undefined && soResult.Account_Ship_to__r.SAP_Number__c!=null){
                      $scope.soldToSapNumber = soResult.Account_Ship_to__r.SAP_Number__c;
                  }
              }
            }
            localAccountShipToc = soResult.Account_Ship_to__c != undefined && soResult.Account_Ship_to__c != null
              ? soResult.Account_Ship_to__c : '';
            if (soResult.Service_Order_Owner__r != null && soResult.Service_Order_Owner__r != undefined) {
              //责任人：
              ownerName =
                soResult.Service_Order_Owner__r.Name != undefined && soResult.Service_Order_Owner__r.Name != null
                  ? soResult.Service_Order_Owner__r.Name : '';
            }

            $scope.workContent =
              soResult.Description__c != undefined && soResult.Description__c != null ? soResult.Description__c : '';
            $scope.suggestStr = soResult.Service_Suggestion__c != undefined && soResult.Service_Suggestion__c != null
              ? soResult.Service_Suggestion__c : '';
            $scope.callPhoneContent =
              soResult.Subject__c != undefined && soResult.Subject__c != null ? soResult.Subject__c : '';
            if (soResult.Work_Order_Type__c != undefined && soResult.Work_Order_Type__c != null&& soResult.Work_Order_Type__c != "") {
              $('#select_work_type').find('option[value = ' + soResult.Work_Order_Type__c + ']').attr('selected', true);
              if (soResult.Work_Order_Type__c.indexOf('Z80') > -1 || soResult.Work_Order_Type__c.indexOf('Z81') > -1
                  || soResult.Work_Order_Type__c.indexOf('Z82') > -1 || soResult.Work_Order_Type__c.indexOf('Z83')
                  > -1) {
                $scope.mcb = true;
              }
            } else {
              $('#select_work_type').find('option[value = \'ZS01_Z10\']').attr('selected', true);
            }
            if (soResult.Service_Order_Sub_Type__c != undefined && soResult.Service_Order_Sub_Type__c != null&& soResult.Service_Order_Sub_Type__c != "") {
              try {
                $('#select_service_type').find('option[value = ' + soResult.Service_Order_Sub_Type__c + ']').attr(
                  'selected', true);
                $scope.singleCarService = soResult.Service_Order_Sub_Type__c;
              } catch (e) {
                $('#select_service_type').find('option[value = \'Maintenance\']').attr('selected', true);
                $scope.singleCarService = 'Maintenance';
              }
            } else {
              $('#select_service_type').find('option[value = \'Maintenance\']').attr('selected', true);
              $scope.singleCarService = 'Maintenance';
            }
          }
        };

        $scope.errorFaults = [];
        $scope.initPartNumers = function (partNumers) {
          let deferred = $q.defer();
          $scope.errorFaults = [];
          if (partNumers != undefined && partNumers != null && partNumers.length > 0) {
            for (var i = 0; i < partNumers.length; i++) {
              $scope.errorFaults.push(partNumers[i]);
            }
          }
          deferred.resolve("");
          return deferred.promise;
        };

        $scope.initPartNumersStep2=function(result){
            if (result != undefined && result != null) {
                if (result.Fault_Part_Code__c != undefined && result.Fault_Part_Code__c != null && result.Fault_Part_Code__c != "") {
                        $('#select_error_faults').find('option[value = ' + result.Fault_Part_Code__c + ']').attr(
                            'selected', true);
                }
            }
        };

        /**
         *  初始化保养级别
         */
        $scope.initChidOrderInfo = function (truckObj, childOrders) {
          let deferred = $q.defer();
          if (childOrders != undefined && childOrders != null && childOrders.length > 0) {
            var serviceLevel = childOrders[0].Maintenance_Level__c;
            var serviceType =  $('#select_service_type option:selected').val();
            if (serviceType!="Maintenance"){
                serviceLevel="";
            }
            initLevel = serviceLevel;
            if (serviceLevel!="? undefined:undefined ?" && serviceLevel!=undefined && serviceLevel!=""){
                $('#select_care_type').find('option[value = ' + serviceLevel + ']').attr('selected', true);
            }
            deferred.resolve("");
          }
          return deferred.promise;
        };

        /**
         * 初始化上传图片
         * @param photoes
         */
        $scope.initPhotoData = function (photoes) {
          if (photoes != undefined && photoes != null) {
            if (photoes.length > 0) {
              //删除默认的图片  第一张
              $scope.imgUris.splice(0, 1);
              $scope.imgUrisBefore.splice(0, 1);
              $scope.imgUrisAfter.splice(0, 1);
              for (var i = 0; i < photoes.length; i++) {
                if (photoes[i].imageName.indexOf('bf_') > -1) {
                  for (var j = 0; j < $scope.bfObjs.length; j++) {
                    if (photoes[i].imageName.split('/')[1] === $scope.bfObjs[j].imageName.split('/')[1]) {
                      $scope.bfObjs[j].imageId = photoes[i].imageId;
                      $scope.bfObjs[j].imageBody = 'data:image/jpeg;base64,' + photoes[i].imageBody;
                    }
                  }
                } else if (photoes[i].imageName.indexOf('af_') > -1) {
                  for (var j = 0; j < $scope.afObjs.length; j++) {
                    if (photoes[i].imageName.split('/')[1] === $scope.afObjs[j].imageName.split('/')[1]) {
                      $scope.afObjs[j].imageId = photoes[i].imageId;
                      $scope.afObjs[j].imageBody = 'data:image/jpeg;base64,' + photoes[i].imageBody;
                    }
                  }
                } else if (photoes[i].imageName.indexOf('bfth_') > -1) {
                  $scope.imgUrisBefore.push(
                    {
                      imageId: photoes[i].imageId,
                      imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                      imageName: photoes[i].imageName
                    }
                  );
                } else if (photoes[i].imageName.indexOf('afth_') > -1) {
                  $scope.imgUrisAfter.push(
                    {
                      imageId: photoes[i].imageId,
                      imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                      imageName: photoes[i].imageName
                    }
                  );
                } else {
                  $scope.imgUris.push(
                    {
                      imageId: photoes[i].imageId,
                      imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                      imageName: photoes[i].imageName
                    }
                  );
                }
              }
              if (allowEdit) {
                //添加默认图片
                $scope.imgUris.push(
                  {
                    imageId: '',
                    imageBody: '././img/images/will_add_Img.png',
                    // imageName: new Date().format('yyyyMMddhhmmss/')+''
                    imageName: ''
                  }
                );

                $scope.imgUrisBefore.push({
                  imageId: '',
                  imageBody: '././img/images/will_add_Img.png',
                  // imageName: 'bfth_'+new Date().format('yyyyMMddhhmmss/')+' '
                  imageName: ''
                });

                $scope.imgUrisAfter.push({
                  imageId: '',
                  imageBody: '././img/images/will_add_Img.png',
                  // imageName: 'afth_'+new Date().format('yyyyMMddhhmmss/')+' '
                  imageName: ''
                });

              }
            }

          }
        };

        $scope.initAssignUserData = function (workersStrArr) {
          if (workersStrArr != undefined && workersStrArr != null && workersStrArr[0] != "查找不到Sales Office!") {
            for (var i = 0; i < workersStrArr.length; i++) {
              var singleArr = workersStrArr[i].split(',');
              $scope.workers.push({label: singleArr[0], value: singleArr[1]});
            }
            localWorkers = $scope.workers;
          }
        };

        $scope.initSavedUserData = function (savedUsers, workersStrArr) {
          if (savedUsers != undefined && workersStrArr != undefined && savedUsers != null && workersStrArr != null) {
            if (savedUsers.length > 0 && workersStrArr.length > 0) {
              for (var i = 0; i < savedUsers.length; i++) {
                for (var j = 0; j < workersStrArr.length; j++) {
                  if ((savedUsers[i].split(','))[0] == (workersStrArr[j].split(','))[0]) {
                    $scope.selectWorkersArr.push(
                      {label: workersStrArr[j].split(',')[0], value: workersStrArr[j].split(',')[1]});
                  }
                }
              }
              $scope.updateWorkerString();
            }
          }
        };

        $scope.initTrucks = function (trucks, childOrders) {
          if (trucks != undefined && trucks != null && childOrders != undefined && childOrders != null && trucks.length
              > 0 && childOrders.length > 0) {
            truckItems = [];
            for (var i = 0; i < trucks.length; i++) {
              for (var j = 0; j < childOrders.length; j++) {
                if (trucks[i].Id == childOrders[j].Truck_Serial_Number__c) {
                  var optHour = 0;
                  if (childOrders[j].Operation_Hour__c != undefined && childOrders[j].Operation_Hour__c != null) {
                    optHour = childOrders[j].Operation_Hour__c;
                  } else {
                    if (childOrders[j].Truck_Serial_Number__r != undefined && childOrders[j].Truck_Serial_Number__r
                        != null) {
                      if (childOrders[j].Truck_Serial_Number__r.Operation_Hour__c != undefined
                          && childOrders[j].Truck_Serial_Number__r.Operation_Hour__c != null) {
                        optHour = childOrders[j].Truck_Serial_Number__r.Operation_Hour__c;
                      } else {
                        optHour = 0;
                      }
                    }
                  }
                  var suggestStr="";
                  if (childOrders[j].Service_Suggestion__c!=undefined&&childOrders[j].Service_Suggestion__c!=null){
                      suggestStr=childOrders[j].Service_Suggestion__c;
                  }
                }
              }
              truckNumber += trucks[i].Name + "(" + optHour + "H)" + ';';
              truckItems.push(
                {
                  Id: trucks[i].Id,
                  truckItemNum: trucks[i].Name,
                  Operation_Hour__c: optHour,
                  Equipement__c:trucks[i].Equipement__c != undefined && trucks[i].Equipement__c != null ? trucks[i].Equipement__c : "",
                  Maintenance_Key__c: trucks[i].Maintenance_Key__c != undefined&&trucks[i].Maintenance_Key__c != null ? trucks[i].Maintenance_Key__c : "",
                  Service_Suggestion__c: suggestStr,
                  Model__c: trucks[i].Model__c != undefined &&trucks[i].Model__c != null ? trucks[i].Model__c : "",
                  chooseCheckBox: false,
                  New_Operation_Hour__c: 0,
                  isShow: false
                }
              );
            }

          }
        };

        $scope.initSignature = function (uri1, uri2) {
          if (uri1 != "") {
            $scope.engineerImgStr = 'data:image/jpeg;base64,' + uri1;
          } else {
            $scope.engineerImgStr = '././img/images/will_add_Img.png';
          }

          if (uri2 != "") {
            $scope.busyImgStr = 'data:image/jpeg;base64,' + uri2;
          } else {
            $scope.busyImgStr = '././img/images/will_add_Img.png';
          }

        };

        $scope.initWorkItems = function (workItems, onOrder,soResult) {
          console.log('workItems', workItems);
          if (workItems != undefined && workItems != null && workItems.length > 0) {
            for (var i = 0; i < workItems.length; i++) {
                if (soResult!=undefined && soResult!=null &&soResult.Service_Order_Owner__r!=undefined&&soResult.Service_Order_Owner__r!=null&&soResult.Service_Order_Owner__r.Id!=undefined&&soResult.Service_Order_Owner__r.Id!=null){
                    if (soResult.Service_Order_Owner__r.Id==oCurrentUser.Id&&workItems[i].CreatedById==oCurrentUser.Id){
                        if (workItems[i].Arrival_Time__c != undefined && onOrder) {
                            if (workItems[i].Leave_Time__c != undefined && onOrder) {
                                continue;
                            } else {
                                for (var j = 0; j < 3; j++) {
                                    $('ol li:eq(' + j + ')').addClass('slds-is-active');
                                }
                                $('#departureBtn').css('pointer-events', 'none');
                                $('#departureBtn').addClass('textCompleted');
                                $('#arriveBtn').css('pointer-events', 'none');
                                $('#arriveBtn').addClass('textCompleted');
                                if (orderBelong) {
                                    $('#sidProgressBar').css('width', '50%');
                                } else {
                                    $('#sidProgressBar').css('width', '66%');
                                }
                                arriveTime = new Date(workItems[i].Arrival_Time__c);
                                goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                                break;
                            }
                        } else if (workItems[i].Departure_Time__c != undefined && onOrder) {
                            for (var j = 0; j < 2; j++) {
                                $('ol li:eq(' + j + ')').addClass('slds-is-active');
                            }
                            $('#departureBtn').css('pointer-events', 'none');
                            $('#departureBtn').addClass('textCompleted');
                            if (orderBelong) {
                                $('#sidProgressBar').css('width', '25%');
                            } else {
                                $('#sidProgressBar').css('width', '33%');
                            }

                            goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                            break;
                        } else if (workItems[i].Leave_Time__c != undefined && onOrder) {
                            goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                            break;
                        } else {
                            goOffTimeFromPrefix = null;
                            break;
                        }
                    }else if(soResult.Service_Order_Owner__r.Id!=oCurrentUser.Id&&workItems[i].CreatedById==oCurrentUser.Id){
                        if (workItems[i].Arrival_Time__c != undefined ) {
                            if (workItems[i].Leave_Time__c != undefined) {
                                continue;
                            } else {
                                for (var j = 0; j < 3; j++) {
                                    $('ol li:eq(' + j + ')').addClass('slds-is-active');
                                }
                                $('#departureBtn').css('pointer-events', 'none');
                                $('#departureBtn').addClass('textCompleted');
                                $('#arriveBtn').css('pointer-events', 'none');
                                $('#arriveBtn').addClass('textCompleted');
                                if (orderBelong) {
                                    $('#sidProgressBar').css('width', '50%');
                                } else {
                                    $('#sidProgressBar').css('width', '66%');
                                }
                                arriveTime = new Date(workItems[i].Arrival_Time__c);
                                goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                                break;
                            }
                        } else if (workItems[i].Departure_Time__c != undefined) {
                            for (var j = 0; j < 2; j++) {
                                $('ol li:eq(' + j + ')').addClass('slds-is-active');
                            }
                            $('#departureBtn').css('pointer-events', 'none');
                            $('#departureBtn').addClass('textCompleted');
                            if (orderBelong) {
                                $('#sidProgressBar').css('width', '25%');
                            } else {
                                $('#sidProgressBar').css('width', '33%');
                            }

                            goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                            break;
                        } else if (workItems[i].Leave_Time__c != undefined) {
                            goOffTimeFromPrefix = new Date(workItems[i].Departure_Time__c);
                            break;
                        } else {
                            goOffTimeFromPrefix = null;
                            break;
                        }
                    }

                }
            }
          }

          $scope.loadOrRefersh(workItems);

          if (orderBelong) {
            $('.workListDetails_bodyer').css('height', 'calc(100vh - 120px)');
            $('.textBtn').css('width', '25%');
          } else {
            $('.workListDetails_bodyer').css('height', 'calc(100vh)');
            $('.textBtn').css('width', '33.3%');
            $('.next_Footer').css('bottom', '0px');
            if ($("#leave").hasClass("textCompleted")) {
              $("#sidProgressBar").css('width', '99%');
            } else if ($("#arriveBtn").hasClass("textCompleted")) {
              $("#sidProgressBar").css('width', '66%');
            } else if ($("#departureBtn").hasClass("textCompleted")) {
              $("#sidProgressBar").css('width', '33%');
            } else {
              $("#sidProgressBar").css('width', '0%');
            }
          }

        };

        $scope.loadOrRefersh = function (workItems) {
          $scope.workTimes = [];
          $scope.localWorkItems = [];
          for (var i = 0; i < workItems.length; i++) {
            $scope.workTimes.push({
              Id: workItems[i].Id != undefined && workItems[i].Id != null ? workItems[i].Id : '',
              name: workItems[i].CreatedBy != undefined && workItems[i].CreatedBy != null && workItems[i].CreatedBy.Name
                    != undefined ? workItems[i].CreatedBy.Name : '',
              departureTime: workItems[i].Departure_Time__c != undefined && workItems[i].Departure_Time__c != null
                ? workItems[i].Departure_Time__c.substring(0, 19).replace(/T/g, ' ') : '',
              leaveTime: workItems[i].Leave_Time__c != undefined && workItems[i].Leave_Time__c != null
                ? workItems[i].Leave_Time__c.substring(0, 19).replace(/T/g, ' ') : '',
              miles: workItems[i].Miles__c != undefined && workItems[i].Miles__c != null ? workItems[i].Miles__c : 0
            });
            $scope.localWorkItems.push(
              {
                ownerName: workItems[i].Engineer__r != undefined && workItems[i].Engineer__r != null
                           && workItems[i].Engineer__r.Name != undefined && workItems[i].Engineer__r.Name != null
                  ? workItems[i].Engineer__r.Name : '  ',
                dame: workItems[i].Departure_Time__c != undefined && workItems[i].Departure_Time__c != null ? new Date(
                  workItems[i].Departure_Time__c.replace(/T/g, ' ').replace(/-/g, '/') + '+0800').format('yy/MM/dd')
                  : '  ',
                departureTime: workItems[i].Departure_Time__c != undefined && workItems[i].Departure_Time__c != null
                  ? new Date(workItems[i].Departure_Time__c.replace(/T/g, ' ').replace(/-/g, '/') + '+0800').format(
                    'hh:mm') : '  ',
                arriveTime: workItems[i].Arrival_Time__c != undefined && workItems[i].Arrival_Time__c != null
                  ? new Date(workItems[i].Arrival_Time__c.replace(/T/g, ' ').replace(/-/g, '/') + '+0800').format(
                    'hh:mm') : '  ',
                leaveTime: workItems[i].Leave_Time__c != undefined && workItems[i].Leave_Time__c != null ? new Date(
                  workItems[i].Leave_Time__c.replace(/T/g, ' ').replace(/-/g, '/') + '+0800').format('hh:mm') : '  ',
                workMiles: workItems[i].Miles__c != undefined && workItems[i].Miles__c != null
                  ? workItems[i].Miles__c.toString() : '0'
              }
            );
          }
        };

        $scope.getPhoto = function ($event, imgs, prefix) {
          if ($event.target.getAttribute('id') != '././img/images/will_add_Img.png') {
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
                        for (var i = 0; i < imgs.length; i++) {
                          if (imgs[i].imageBody == '././img/images/will_add_Img.png' || imgs[i].imageBody == imgUri) {
                            imgs.splice(i, 1);
                            i--;
                          }
                        }
                        imgs.push({
                          imageId: '',
                          imageBody: 'data:image/jpeg;base64,' + imgUri,
                          imageName: prefix + new Date().format('yyyyMMddhhmmss/') + ' '
                        });
                        imgs.push({
                          imageId: '',
                          imageBody: '././img/images/will_add_Img.png',
                          // imageName: prefix+new Date().format('yyyyMMddhhmmss/')+''
                          imageName: ''
                        });
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
                        encodingType: Camera.EncodingType.JPEG,
                            targetWidth: 300,
                            targetHeight: 300
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
                        for (var i = 0; i < imgs.length; i++) {
                          if (imgs[i].imageBody == '././img/images/will_add_Img.png' || imgs[i].imageBody == imgUri) {
                            imgs.splice(i, 1);
                            i--;
                          }
                        }
                        imgs.push(
                          {
                            imageId: '',
                            imageBody: 'data:image/jpeg;base64,' + imgUri,
                            imageName: prefix + new Date().format('yyyyMMddhhmmss/') + ' '
                          });
                        imgs.push({
                          imageId: '',
                          imageBody: '././img/images/will_add_Img.png',
                          // imageName: prefix+new Date().format('yyyyMMddhhmmss/')+''
                          imageName: ''
                        });
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
                        encodingType: Camera.EncodingType.JPEG,
                          targetWidth: 300,
                          targetHeight: 300
                      });
                  } catch (e) {
                    return;
                  }

                }
              },
            ]
          });
        };

        $scope.getBfAfPic = function ($event, currentObj) {
          if ($event.target.getAttribute('id') != '././img/images/will_add_Img.png') {
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
                        currentObj.imageBody = 'data:image/jpeg;base64,' + imgUri;
                      },
                      function onError(error) {
                        return;
                      }
                      , {
                        quality: 50,
                        saveToPhotoAlbum: false,
                        destinationType: navigator.camera.DestinationType.DATA_URL,
                        mediaType: Camera.MediaType.PICTURE,
                        encodingType: Camera.EncodingType.JPEG,
                            targetWidth: 300,
                            targetHeight: 300
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
                        currentObj.imageBody = 'data:image/jpeg;base64,' + imgUri;
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
                        encodingType: Camera.EncodingType.JPEG,
                          targetWidth: 300,
                          targetHeight: 300
                      });
                  } catch (e) {
                    return;
                  }

                }
              },
            ]
          });

        };

        var checkMinutes = function (time, m) {
          if (time.getMinutes() - m > 0) {
            return {
              index: 1,
              mm: time.getMinutes() - m
            };
          } else {
            return {
              index: 2,
              mm: time.getMinutes() + 60 - m
            };
          }
        };

        var canLeave=true;

        /**
         * 点击离开按钮
         * @param $event
         */
        var mobileSelect2=null;
        $scope.doLeave = function () {
          $(".mobileSelect").remove();
          if (goOffTimeFromPrefix == null) {
            $ionicPopup.alert({
              title: '请先选择到达'
            });
            return;
          }

          if (arriveTime === null) {
            console.log("111::");
            var numArr1 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            var numArr2 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14',
                           '15',
                           '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
                           '31',
                           '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
                           '47',
                           '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'];
              mobileSelect2= new MobileSelect({
              trigger: '#leave',
              title: '选择工作时长',
              wheels: [
                {
                  data: numArr1
                },
                {
                  data: ':'
                },
                {
                  data: numArr2
                }
              ],
              position: [0, 0, 0],
              triggerDisplayData:false,
              cancel:function(indexArr, data){
                console.log("22::");
              },
              callback: function (indexArr, data) {
                // $('#leave').text('离开');
                ah = parseInt(data[0].substring(6, 8));
                am = parseInt(data[2].substring(6, 8));
                //checkHours();
                leaveTime = new Date();
                // var min = checkMinutes(leaveTime, am);
                // if (min.index == 1) {
                //   arriveTime = new Date(
                //     (leaveTime.getFullYear() + '-' + (leaveTime.getMonth() + 1) + '-' + leaveTime.getDate() + ' '
                //      + (leaveTime.getHours() - ah) + ':' + min.mm + ':' + leaveTime.getSeconds()).replace(/-/, '-'));
                // } else {
                //   arriveTime = new Date(
                //     (leaveTime.getFullYear() + '-' + (leaveTime.getMonth() + 1) + '-' + leaveTime.getDate() + ' '
                //      + (leaveTime.getHours() - ah - 1) + ':' + min.mm + ':' + leaveTime.getSeconds()).replace(/-/,
                //       '-'));
                // }
                var timeLong = null;
                var timeLongMin=leaveTime.getMinutes()-goOffTimeFromPrefix.getMinutes();
                var timeLongHour= leaveTime.getHours()-goOffTimeFromPrefix.getHours();
                if (timeLongMin>=0){
                     timeLong = 60*(timeLongHour)+timeLongMin;
                }else{
                     timeLong= 60*(timeLong-1)+timeLongMin;
                }

              if (timeLong-(ah*60+am)<0){
                  ah=0;
                  am=1;
                  arriveTime=null;
                  leaveTime=null;
                  $ionicPopup.alert({
                      title:"到达时间早于出发时间"
                  });
                  return;
              }
              if (canLeave){
                  canLeave=false;
                  AppUtilService.showLoading();
                  //arriveTime.format('yyyy-MM-dd hh:mm:ss')
                  //leaveTime.format('yyyy-MM-dd hh:mm:ss')
                  dualModeService.leaveActionUtil(Number(localStorage.onoffline),
                      Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                      Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId,ah*60+am).then(
                      function callBack(res) {
                          console.log(res);
                          AppUtilService.hideLoading();
                          if (Number(localStorage.onoffline) !== 0) {
                              if (res.status.toLowerCase() == 'success') {
                                  $scope.reloadWorkItems();
                                  //$rootScope.getSomeData();
                                  if (orderBelong) {
                                      $('#sidProgressBar').css('width', '75%');
                                  } else {
                                      $('#sidProgressBar').css('width', '99%');
                                  }
                                  for (var i = 0; i < 4; i++) {
                                      $('ol li:eq(' + i + ')').addClass('slds-is-active');
                                  }
                                  $('#arriveBtn').css('pointer-events', 'none');
                                  $('#arriveBtn').addClass('textCompleted');
                                  $('#leave').css('pointer-events', 'none');
                                  $('#leave').addClass('textCompleted');
                                  $ionicPopup.alert({
                                      title: '记录到达/离开时间成功'
                                  });
                              } else {
                                  $ionicPopup.alert({
                                      title: '记录到达/离开时间失败',
                                      template: res.message
                                  });
                                  return false;
                              }
                          } else {
                              if (res.toLowerCase() == 'success') {
                                  if (orderBelong) {
                                      $('#sidProgressBar').css('width', '75%');
                                  } else {
                                      $('#sidProgressBar').css('width', '99%');
                                  }
                                  for (var i = 0; i < 4; i++) {
                                      $('ol li:eq(' + i + ')').addClass('slds-is-active');
                                  }
                                  $('#arriveBtn').css('pointer-events', 'none');
                                  $('#arriveBtn').addClass('textCompleted');
                                  $('#leave').css('pointer-events', 'none');
                                  $('#leave').addClass('textCompleted');
                                  $ionicPopup.alert({
                                      title: '记录到达/离开时间成功'
                                  });
                              } else {
                                  $ionicPopup.alert({
                                      title: '记录到达/离开时间失败',
                                      template: res.message
                                  });
                                  return false;
                              }
                          }
                          canLeave=true;
                      }, function error(msg) {
                          AppUtilService.hideLoading();
                          arriveTime=null;
                          console.log(msg);
                          canLeave=true;
                          $ionicPopup.alert({
                              title: '记录到达/离开时间失败',
                              template: msg.responseText
                          });
                          return false;
                      });
              }
              }
            });
            mobileSelect2.show();
          } else {
            if (leaveTime != null) {
              return false;
            }
            $ionicPopup.show({
              title: '是否确定离开？',
              buttons: [{
                text: '取消',
                onTap: function () {

                }
              }, {
                text: '确定',
                onTap: function () {
                  leaveTime = new Date();
                  //arriveTime.format('yyyy-MM-dd hh:mm:ss')
                  //leaveTime.format('yyyy-MM-dd hh:mm:ss')
                  if (canLeave){
                      canLeave=false;
                      AppUtilService.showLoading();
                      dualModeService.leaveActionUtil(Number(localStorage.onoffline),
                          Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                          Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId,0).then(
                          function callBack(res) {
                              console.log(res);
                              AppUtilService.hideLoading();
                              if (Number(localStorage.onoffline) !== 0) {
                                  if (res.status.toLowerCase() == 'success') {
                                      $scope.reloadWorkItems();
                                      //$rootScope.getSomeData();
                                      //$event.target.style.backgroundColor = "#00FF7F";
                                      $('#leave').addClass('textCompleted');
                                      for (var i = 0; i <= 3; i++) {
                                          $('ol li:eq(' + i + ')').addClass('slds-is-active');
                                      }
                                      if (orderBelong) {
                                          $('#sidProgressBar').css('width', '75%');
                                      } else {
                                          $('#sidProgressBar').css('width', '99%');
                                      }
                                      $ionicPopup.alert({
                                          title: '记录到达/离开时间成功'
                                      });
                                  } else {
                                      $ionicPopup.alert({
                                          title: '记录到达/离开时间失败',
                                          template: res.message
                                      });
                                      return false;
                                  }
                              } else {
                                  if (res.toLowerCase() == 'success') {
                                      //$event.target.style.backgroundColor = "#00FF7F";
                                      $('#leave').addClass('textCompleted');
                                      for (var i = 0; i <= 3; i++) {
                                          $('ol li:eq(' + i + ')').addClass('slds-is-active');
                                      }
                                      if (orderBelong) {
                                          $('#sidProgressBar').css('width', '75%');
                                      } else {
                                          $('#sidProgressBar').css('width', '99%');
                                      }
                                      $ionicPopup.alert({
                                          title: '记录到达/离开时间成功'
                                      });
                                  } else {
                                      $ionicPopup.alert({
                                          title: '记录到达/离开时间失败',
                                          template: res.message
                                      });

                                      return false;
                                  }
                              }
                              canLeave=true;
                          }, function error(msg) {
                              AppUtilService.hideLoading();
                              console.log(msg);
                              canLeave=true;
                              $ionicPopup.alert({
                                  title: '记录到达/离开时间失败',
                                  template: msg.responseText
                              });
                              return false;
                          });
                  }
                }
              }],
            });
          }
        };

        /**
         * 删除当前图片
         */
        $scope.deleteCurrentImg = function (imgUri, imgUris) {
          $ionicPopup.show({
            title: '确认删除图片？',
            buttons: [
              {
                text: '否',
                onTap: function () {
                  return true;
                }
              },
              {
                text: '是',
                onTap: function () {
                  for (var i = 0; i < imgUris.length; i++) {
                    if (imgUris[i].imageBody == imgUri) {
                      imgUris.splice(i, 1);
                      i--;
                    }
                  }
                  return true;
                }
              }
            ]
          });
        };

        /**
         * 删除维修前或者维修后的图片
         */
        $scope.deleteBfAfImg = function (singleObj) {
          $ionicPopup.show({
            title: '确认删除图片？',
            buttons: [
              {
                text: '否',
                onTap: function () {
                  return false;
                }
              },
              {
                text: '是',
                onTap: function () {
                  singleObj.imageBody = '././img/images/will_add_Img.png';
                }
              }
            ]
          });
        };
        /**
         * 详细信息／工作信息／配件需求／交货列表／服务建议  共用
         * @param idStr1 显示更多信息的内容
         * @param idStr2 显示更多信息的图片
         */
        $scope.sameDisPlayInfo = function (idStr1, idStr2) {
          if (document.getElementById(idStr1).style.display == 'none') {
            document.getElementById(idStr1).style.display = '';//显示
            document.getElementById(idStr2).className = 'OpenClose_Btn arrow_Down_White';
          } else {
            document.getElementById(idStr1).style.display = 'none';//隐藏
            document.getElementById(idStr2).className = 'OpenClose_Btn arrow_Left_White';
          }
        };

        //已选车辆
        $scope.toDescribInfDiv = function () {
          setTimeout(function () {
            if (document.getElementById('describInfDiv').style.display == 'none') {
              document.getElementById('describInfDiv').style.display = '';//显示
            } else {
              document.getElementById('describInfDiv').style.display = 'none';//隐藏
            }
            if (document.getElementById('whiteBgForBlock').style.display == 'none') {
              document.getElementById('whiteBgForBlock').style.display = '';//显示
            } else {
              document.getElementById('whiteBgForBlock').style.display = 'none';//隐藏
            }

            if (!allowEdit) {
              $('input.workDetailCustomeHourclas').prop('disabled', 'disabled');
            }
          }, 100);

        };
        /**
         * 取消按钮
         */
        $scope.goBack = function () {
          // window.history.back();
          $state.go('app.home');
          $rootScope.getSomeData();
        };
        var canDeparture = true;
        var departTurePop = null;
        $scope.serviceCars = [];

        var checkDeParture=true;
        $scope.dePartureOrder = function () {
            if (checkDeParture){
                checkDeParture=false;
                var deferred = $q.defer();
                var result = null;
                try {
                    $scope.beforeDeparture().then(function (serviceCarInfo) {
                        return $scope.showServiceCarPop(serviceCarInfo);
                    }).then(function () {
                        result =$("#serviceCarSelectSecond").val()!=undefined&&$("#serviceCarSelectSecond").val()!=null? $("#serviceCarSelectSecond").val():"";
                        return $scope.doDeparture(result);
                    }).then(function () {
                        checkDeParture=true;
                    });
                } catch (ex){
                    console.log('ex::',ex);
                    checkDeParture=true;
                    deferred.reject(ex);
                }
                return deferred.promise;
            }else{
                return;
            }
        };


        $scope.arriveOrder=function(timeMin){
            var deferred = $q.defer();
            var result = null;
            try {
                $scope.beforeDeparture().then(function (serviceCarInfo) {
                    return $scope.showServiceCarPop(serviceCarInfo);
                }).then(function () {
                    result = $("#serviceCarSelectSecond").val()!=undefined&&$("#serviceCarSelectSecond").val()!=null? $("#serviceCarSelectSecond").val():"";
                    return $scope.doDeparture(result);
                }).then(function () {
                    return $scope.departureArrive(timeMin);
                });
            } catch (ex){
                console.log('ex::',ex);
                deferred.reject(ex);
            }
            return deferred.promise;
        };

        $scope.showServiceCarPop=function(serviceCarInfo){
            let deferred = $q.defer();
            setTimeout(function () {
                $('#serviceCarSelectSecond').find('option[value ='+serviceCarInfo.CarNo__c+']').attr('selected', true);
            },500);
            departTurePop = $ionicPopup.show({
                title: "请选择服务车",
                template: "    <select id=\"serviceCarSelectSecond\" class=\"small_Type_Select\" >\n" +
                "                                            <option ng-repeat=\" singleServiceCar  in serviceCarsSecond\" value=\"{{singleServiceCar.CarNo__c}}\">{{singleServiceCar.CarNo__c}}</option>\n"
                +
                "                                        </select>",
                scope: $scope,
                buttons: [{
                    text: '<b>OK</b>',
                    type: 'button-positive',
                    onTap: function () {
                        // if (!canDeparture) {
                        //     departTurePop.close();
                        //     return;
                        // }
                        // canDeparture = false;
                        if(canDeparture){
                            canDeparture=false;
                        }
                        deferred.resolve();
                        //$scope.doDeparture($("#serviceCarSelectSecond").val());
                    }
                }]
            });

            return deferred.promise;
        };

        var defaultServiceCar = "";
        $scope.beforeDeparture = function () {
         let deferred = $q.defer();
          AppUtilService.showLoading();
          ForceClientService.getForceClient().apexrest(
            '/ServiceCarService?action=init&currentUser=' + oCurrentUser.Id,
            'GET',
            {},
            null,
            function callBack(res) {
              AppUtilService.hideLoading();
              $scope.serviceCarsSecond = [];
              $scope.serviceCarsSecond.push("");
              console.log(res);
              if (res.default != null && res.default.length > 0) {
                for (var i = 0; i < res.default.length; i++) {
                    defaultServiceCar=res.default[0];
                    $scope.serviceCarsSecond.push(res.default[i]);
                }
              }else{
                  defaultServiceCar="";
              }

              if (res.all != null && res.all.length > 0) {
                for (var i = 0; i < res.all.length; i++) {
                  $scope.serviceCarsSecond.push(res.all[i]);
                }
              }
            deferred.resolve(defaultServiceCar);
            },
            function error(msg) {
              AppUtilService.hideLoading();
              deferred.reject(msg);
              console.log(msg.responseText);
            });
          return deferred.promise;
        };

        $scope.reloadWorkItems = function () {
          ForceClientService.getForceClient().apexrest(
            $scope.reloadWorkitemsUrl + orderDetailsId,
            'GET',
            {},
            null,
            function callBack(res) {
              console.log(res);
              if (res != undefined && res != null) {
                $scope.loadOrRefersh(res);
              }
            }, function error(msg) {
              console.log(msg.responseText);
            });
        };

        $scope.doDeparture = function (carNo) {
          let deferred =$q.defer();
          var departureTime = new Date();
          goOffTimeFromPrefix = departureTime;
          AppUtilService.showLoading();
          dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline),
            Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId, 'Not Completed').then(
            function callBack(res) {
              if (res.status.toLowerCase() == 'success') {
                  //departureTime.format('yyyy-MM-dd hh:mm:ss')
                dualModeService.departureActionUtil(Number(localStorage.onoffline),
                  Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                  Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId,carNo).then(function callBack(res) {
                  AppUtilService.hideLoading();
                  if (res.status.toLowerCase() == 'success') {
                    $scope.reloadWorkItems();
                    //$rootScope.getSomeData();
                    for (var i = 0; i < 2; i++) {
                      $('ol li:eq(' + i + ')').addClass('slds-is-active');
                    }
                    $('#departureBtn').css('pointer-events', 'none');
                    $('#departureBtn').addClass('textCompleted');
                    if (orderBelong) {
                      $('#sidProgressBar').css('width', '25%');
                    } else {
                      $('#sidProgressBar').css('width', '33%');
                    }
                    canDeparture = true;
                  deferred.resolve('');
                  } else {
                    canDeparture = true;
                    // $ionicPopup.alert({
                    //   title: res.message
                    // });
                    // return;
                      $scope.updateOrderType('Not Started',res.message);
                  }
                }, function error(msg) {
                  canDeparture = true;
                  AppUtilService.hideLoading();
                  console.log(msg);
                  // $ionicPopup.alert({
                  //   title: msg.responseText
                  // });
                  // return;
                    $scope.updateOrderType('Not Started',JSON.stringify(msg));
                });
              } else {
                canDeparture = true;
              }
            }, function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg);
              canDeparture = true;
              deferred.reject(msg);
              // $ionicPopup.alert({
              //   title: msg.responseText
              // });
              // return;
                  $scope.updateOrderType('Not Started',JSON.stringify(msg));
            });
            return deferred.promise;
        };

      $scope.updateOrderType = function (status,msgStr) {
          dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline), Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId, status).then(function callBack(res) {
              console.log(res);
              AppUtilService.hideLoading();
              if (res.status.toLowerCase() == 'success') {
                  $ionicPopup.alert({
                      title: msgStr
                  });

              } else {
                  $ionicPopup.alert({
                      title: '更新工单状态失败',
                      template: res.message
                  });
                  return false;
              }
          }, function error(msg) {
              console.log(msg);
              AppUtilService.hideLoading();
              $ionicPopup.alert({
                  title: '更新工单状态失败',
                  template: msg.responseText
              });
              return false;
          });
      };

        var canArrive = true;
          var mobileSelect1=null;
        $scope.getArrivalTime = function () {
          $(".mobileSelect").remove();
          if (arriveTime != null) {
            return false;
          } else {
            if (goOffTimeFromPrefix === null) {
              var numArr1 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
              var numArr2 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14',
                             '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                             '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44',
                             '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
                             '60'];
                mobileSelect1 = new MobileSelect({
                trigger: '#arriveBtn',
                title: '选择旅途时长',
                wheels: [
                  {
                    data: numArr1
                  },
                  {
                    data: ':'
                  },
                  {
                    data: numArr2
                  }
                ],
                position: [0, 0, 0],
                triggerDisplayData:false,
                cancel:function(indexArr, data){
                    console.log("11::");
                },
                callback: function (indexArr, data) {
                  arriveTime = new Date();
                  // $('#arriveBtn').text('到达');
                  h = parseInt(data[0].substring(6, 8));
                  m = parseInt(data[2].substring(6, 8));
                  var min = checkMinutes(arriveTime, m);
                  if (min.index == 1) {
                    goOffTimeFromPrefix = new Date(
                      (arriveTime.getFullYear() + '-' + (arriveTime.getMonth() + 1) + '-' + arriveTime.getDate() + ' '
                       + (arriveTime.getHours() - h) + ':' + min.mm + ':' + arriveTime.getSeconds()).replace(/-/, '-'));
                  } else {
                    goOffTimeFromPrefix = new Date(
                      (arriveTime.getFullYear() + '-' + (arriveTime.getMonth() + 1) + '-' + arriveTime.getDate() + ' '
                       + (arriveTime.getHours() - h - 1) + ':' + min.mm + ':' + arriveTime.getSeconds()).replace(/-/,
                        '-'));
                  }
                  if (canArrive){
                        canArrive=false;
                      navigator.geolocation.getCurrentPosition(function success(position) {
                          localLatitude = position.coords.latitude;
                          localLongitude = position.coords.longitude;
                          AppUtilService.showLoading();
                          dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline),
                              Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId, 'Not Completed').then(
                              function callBack(res) {
                                  console.log(res);
                                  if (res.status.toLowerCase() == 'success') {
                                      $scope.arriveOrder(h*60+m);
                                  } else {
                                      AppUtilService.hideLoading();
                                      $ionicPopup.alert({
                                          title: '更新工单状态失败',
                                          template: res.message
                                      });
                                      return false;
                                  }
                                  canArrive=true;
                              }, function error(msg) {
                                  AppUtilService.hideLoading();
                                  console.log(msg);
                                  canArrive=true;
                                  $ionicPopup.alert({
                                      title: '更新工单状态失败',
                                      template: msg.responseText
                                  });
                                  return false;
                              });

                      }, function error(msg) {
                          console.log(msg);
                          canArrive=true;
                          $ionicPopup.alert({
                              title: '获取定位失败',
                              template: msg.responseText
                          });
                          return false;
                      });
                  }
                }
              });
              mobileSelect1.show();
            } else {
              arriveTime = new Date();
              //arriveTime.format('yyyy-MM-dd hh:mm:ss')
              if (canArrive){
                  canArrive=false;
                  AppUtilService.showLoading();
                  dualModeService.arrivalActionUtil(Number(localStorage.onoffline),
                      Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                      Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId,
                      0).then(function callBack(res) {
                      console.log(res);
                      AppUtilService.hideLoading();
                      if (res.status.toLowerCase() == 'success') {
                          $scope.reloadWorkItems();
                          //$rootScope.getSomeData();
                          //$event.target.style.backgroundColor = "#00FF7F";
                          if (orderBelong) {
                              $('#sidProgressBar').css('width', '50%');
                          } else {
                              $('#sidProgressBar').css('width', '66%');
                          }
                          for (var i = 0; i < 3; i++) {
                              $('ol li:eq(' + i + ')').addClass('slds-is-active');
                          }
                          $('#arriveBtn').css('pointer-events', 'none');
                          $('#arriveBtn').addClass('textCompleted');
                          $ionicPopup.alert({
                              title: '记录到达时间成功'
                          });
                      } else {
                          $ionicPopup.alert({
                              title: '记录到达时间失败',
                              template: res.message
                          });
                          arriveTime = null;
                          return false;
                      }
                      canArrive=true;
                  }, function error(msg) {
                      AppUtilService.hideLoading();
                      console.log(msg);
                      canArrive=true;
                      $ionicPopup.alert({
                          title: '记录到达时间失败',
                          template: msg.responseText
                      });
                      arriveTime = null;
                      return false;
                  });
              }
            }
          }
        };


        $scope.departureArrive=function(timeMin){
            let deferred =$q.defer();
            dualModeService.arrivalActionUtil(Number(localStorage.onoffline),
                Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId,
                Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id : oCurrentUser._soupEntryId,
                timeMin).then(function callBack(res) {
                AppUtilService.hideLoading();
                console.log(res);
                if (res.status.toLowerCase() == 'success') {
                    $scope.reloadWorkItems();
                    //$rootScope.getSomeData();
                    //$event.target.style.backgroundColor = "#00FF7F";
                    if (orderBelong) {
                        $('#sidProgressBar').css('width', '50%');
                    } else {
                        $('#sidProgressBar').css('width', '66%');
                    }
                    for (var i = 0; i < 3; i++) {
                        $('ol li:eq(' + i + ')').addClass('slds-is-active');
                    }
                    $('#arriveBtn').css('pointer-events', 'none');
                    $('#arriveBtn').addClass('textCompleted');
                    deferred.resolve('');
                } else {
                    $ionicPopup.alert({
                        title: '记录到达时间失败',
                        template: res.message
                    });
                    return false;
                }
            }, function error(msg) {
                AppUtilService.hideLoading();
                console.log(msg);
                $ionicPopup.alert({
                    title: '记录到达时间失败',
                    template: msg.responseText
                });
                return false;
            });
            return deferred.promise;
        };

        $scope.goodsList = [];
        /**
         * 打印功能
         * @param $event
         */
        $scope.doPrint = function () {
          document.getElementById('workDetailTotal').style.display = 'none';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'block';

          $scope.customerNameValueShow = customerNameValue;
          $scope.customerAccountValueShow = customerAccountValue;
          $scope.customerAddressValueShow = customerAddressValue;
          $scope.ownerNameShow = ownerName;
          $scope.truckTypesValueShow = truckNumber;//叉车型号

            $("#workContentShowBox")[0].innerHTML="";
            $("#workContentShowBox").append("<p>  "+$("#workContentStr").val()+"</p>");
            $("#workContentShowBox").append(localWorkContent2);
            $scope.printWorkContent="";
            $scope.printWorkContent+=$("#workContentStr").val()+"\n";
            $scope.printWorkContent+= localWorkContent;

          var minTotal = 0;
          for (var i = 0; i < $scope.localWorkItems.length; i++) {
            if ($scope.localWorkItems[i].leaveTime != "  ") {
              minTotal +=
                $scope.calculateWorkHour($scope.localWorkItems[i].arriveTime, $scope.localWorkItems[i].leaveTime);
            }
          }
          //$scope.workHourShow = !isNaN(minTotal) ? (minTotal / 60).toFixed(2) + '小时' : "0小时";//工作小时
          $scope.callStrShow = $('#call_str').val().trim();//报修需求
          // $scope.workContentShow = $('#workContentStr').val();//工作信息
          // $scope.printWorkContent= $('#workContentStr').val();
          $scope.suggestionShoW = $('#serviceSuggest').val();//结果及建议

          $scope.goodsList = [];
          for (var i = 0; i < $scope.rejectedItems.length; i++) {
            var items = $scope.rejectedItems[i].Delivery_Line_Item__r;
            for (var j = 0; j < items.length; j++) {
              if (items[j]!=null){
                  $scope.goodsList.push({
                      SAP_Delivery_Order_Line_Item__c: items[j].SAP_Delivery_Order_Line_Item__c!=undefined&&items[j].SAP_Delivery_Order_Line_Item__c!=null?items[j].SAP_Delivery_Order_Line_Item__c:"      ",
                      Service_Material__rparts_number__c: items[j].Service_Material__rparts_number__c!=undefined&&items[j].Service_Material__rparts_number__c!=null?$scope.polishText(items[j].Service_Material__rparts_number__c,10):"          ",
                      Service_Material__rName:items[j].Service_Material__rName!=undefined&&items[j].Service_Material__rName!=null?$scope.polishText(items[j].Service_Material__rName.replace(/\s+/g,"").substring(0, 4),4):"    ",
                      Quantity__c: items[j].Quantity__c!=undefined&&items[j].Quantity__c!=null?items[j].Quantity__c:0,
                      Used_Quantity__c: items[j].Used_Quantity__c!=undefined&&items[j].Used_Quantity__c!=null?items[j].Used_Quantity__c:0
                  });
              }
            }
          }
        };

        $scope.polishText=function(str,len){
            if (str.length<len){
                for (var k =0;k<len-str.length;k++){
                    str+=" ";
                }
            }
            return str;
        };

        $scope.calculateWorkHour = function (at, lt) {
          var h1 = 0, m1 = 0;
          if (lt != undefined && at != undefined && lt != null && at != null) {
            h1 = lt.split(":")[0] - at.split(":")[0];
            m1 = lt.split(":")[1] - at.split(":")[1];
          }
          return h1 * 60 + m1;
        };
        /**
         * 签单
         * @param $event
         */
        $scope.signBill = function () {
          // if ($scope.engineerImgStr == "././img/images/will_add_Img.png") {
          //   $ionicPopup.alert({
          //     title: "请工程师签名!"
          //   });
          //   return;
          // }
          // if ($scope.busyImgStr == "././img/images/will_add_Img.png") {
          //   $ionicPopup.alert({
          //     title: "请客户签名!"
          //   });
          //   return;
          // }
          ForceClientService.getForceClient().apexrest(
            $scope.getOrderTypeUri + orderDetailsId,
            'GET',
            {},
            null, function callBack(res) {
              console.log(res);
              if (!res) {
                $ionicPopup.show({
                  title: '是否确定签单？',
                  buttons: [
                    {
                      text: '取消',
                      onTap: function () {

                      }
                    },
                    {
                      text: '确定',
                      onTap: function () {
                        AppUtilService.showLoading();
                        dualModeService.updateServiceOrderOverviewStatusUtil(Number(localStorage.onoffline),
                          Number(localStorage.onoffline) !== 0 ? orderDetailsId : userInfoId, 'Field Work Done').then(
                          function callBack(res) {
                            console.log(res);
                            AppUtilService.hideLoading();
                            if (res.status.toLowerCase() == 'success') {
                              AppUtilService.hideLoading();
                              //$event.target.style.backgroundColor = "#00FF7F";
                              $('#signBillBtn').css('pointer-events', 'none');
                              $('#signBillBtn').addClass('textCompleted');
                              $('ol li:eq(5)').addClass('slds-is-active');
                              $('#sidProgressBar').css('width', '100%');
                              $scope.goSave();
                            } else {
                              $ionicPopup.alert({
                                title: '更新工单状态失败',
                                template: res.message
                              });
                              return false;
                            }
                          }, function error(msg) {
                            console.log(msg);
                            AppUtilService.hideLoading();
                            $ionicPopup.alert({
                              title: '更新工单状态失败',
                              template: msg.responseText
                            });
                            return false;
                          });
                      }
                    }
                  ]
                });
              } else {
                $ionicPopup.alert({
                  title: '请先点击离开'
                });
                return false;
              }
            }, function error(msg) {
              console.log(msg.responseText);
            });
        };
        var canSave=true;
        $scope.goSave = function () {
            var sameOrNot = false;
            var serviceType =  $('#select_service_type option:selected').val();
            if (serviceType==="Maintenance"){
                if ($scope.allTruckItems.length>0){
                    let mk = $scope.allTruckItems[0].Maintenance_Key__c;
                    for(var i =0;i<$scope.allTruckItems.length;i++){
                        if($scope.allTruckItems[i].Maintenance_Key__c!=mk){
                            sameOrNot=true;
                            break;
                        }
                    }
                    if (sameOrNot){
                        $ionicPopup.alert({
                            title: '保养只能是同一保养key的车'
                        });
                        return false;
                    }
                }
            }else if (serviceType==="Repair"){
                if ($scope.allTruckItems.length>1){
                    $ionicPopup.alert({
                        title: '维修只能加一台车'
                    });
                    return false;
                }
            }

          AppUtilService.showLoading();
          localUris = [];
          //是否点击checkbox
          if ($scope.checkNinePices) {
            if ($scope.bfObjs != null && $scope.bfObjs.length > 0) {
              for (var i = 0; i < $scope.bfObjs.length; i++) {
                var aa = Object.assign({}, $scope.bfObjs[i]);
                if (aa.imageBody != '././img/images/will_add_Img.png') {
                  aa.imageBody = aa.imageBody.slice(23);
                  localUris.push(aa);
                }
              }
            }

            if ($scope.afObjs != null && $scope.afObjs.length > 0) {
              for (var i = 0; i < $scope.afObjs.length; i++) {
                var bb = Object.assign({}, $scope.afObjs[i]);
                if (bb.imageBody != '././img/images/will_add_Img.png') {
                  bb.imageBody = bb.imageBody.slice(23);
                  localUris.push(bb);
                }
              }
            }
            //维修前固定图片后增加的
            if ($scope.imgUrisBefore != null && $scope.imgUrisBefore.length > 0) {
              for (var i = 0; i < $scope.imgUrisBefore.length; i++) {
                var cc = Object.assign({}, $scope.imgUrisBefore[i]);
                if (cc.imageBody != '././img/images/will_add_Img.png') {
                  cc.imageBody = cc.imageBody.slice(23);
                  localUris.push(cc);
                }
              }
            }
            //维修后固定图片后增加的
            if ($scope.imgUrisAfter != null && $scope.imgUrisAfter.length > 0) {
              for (var i = 0; i < $scope.imgUrisAfter.length; i++) {
                var dd = Object.assign({}, $scope.imgUrisAfter[i]);
                if (dd.imageBody != '././img/images/will_add_Img.png') {
                  dd.imageBody = dd.imageBody.slice(23);
                  localUris.push(dd);
                }
              }
            }

          } else {
            //未勾选
            if ($scope.imgUris != null && $scope.imgUris.length > 0) {
              for (var i = 0; i < $scope.imgUris.length; i++) {
                if ($scope.imgUris[i].imageBody != '././img/images/will_add_Img.png') {
                  let aa = Object.assign({}, $scope.imgUris[i]);
                  aa.imageBody = $scope.imgUris[i].imageBody.slice(23);
                  localUris.push(aa);
                }
              }
            }
            console.log(localUris);
          }
          if ($scope.engineerImgStr != '././img/images/will_add_Img.png'){
              localUris.push({
                  imageId: '',
                  imageName: '工程师签名-' + new Date().format('yyyyMMddhhmmss'),
                  imageBody: $scope.engineerImgStr.replace(/data:image\/jpeg;base64,/, '')
              });
          }

          if ($scope.busyImgStr != '././img/images/will_add_Img.png'){
              localUris.push({
                  imageId: '',
                  imageName: '客户签名-' + new Date().format('yyyyMMddhhmmss'),
                  imageBody:  $scope.busyImgStr.replace(/data:image\/jpeg;base64,/, '')
              });
          }


          var orderObj = null;
          if (Number(localStorage.onoffline) != 0) {
            orderObj = [{
              'Id': orderDetailsId,
              'Mobile_Offline_Name__c': $scope.mobileName,
              'Work_Order_Type__c': $('#select_work_type option:selected').val()!=undefined&&$('#select_work_type option:selected').val()!=null?$('#select_work_type option:selected').val():"",
              'Description__c': $('#workContentStr').val(),
              'Service_Suggestion__c': $('#serviceSuggest').val(),
              'Subject__c': $('#call_str').val(),
              'Service_Order_Sub_Type__c': $('#select_service_type option:selected').val()!=undefined&&$('#select_service_type option:selected').val()!=null?$('#select_service_type option:selected').val():"",
              'Fault_Part_Code__c': $('#select_error_faults option:selected').val()!=undefined&&$('#select_error_faults option:selected').val()!=null?$('#select_error_faults option:selected').val():""
            }];
          } else {
            orderObj = {
              '_soupEntryId': userInfoId,
              'Mobile_Offline_Name__c': $scope.mobileName,
              'Work_Order_Type__c': $('#select_work_type option:selected').val()!=undefined&&$('#select_work_type option:selected').val()!=null?$('#select_work_type option:selected').val():"",
              'Description__c': $('#workContentStr').val(),
              'Service_Suggestion__c': $('#serviceSuggest').val(),
              'Subject__c': $('#call_str').val(),
              'Service_Order_Sub_Type__c': $('#select_service_type option:selected').val()!=undefined&&$('#select_service_type option:selected').val()!=null?$('#select_service_type option:selected').val():"",
              'Fault_Part_Code__c': $('#select_error_faults option:selected').val()!=undefined&&$('#select_service_type option:selected').val()!=null?$('#select_service_type option:selected').val():""
            };
          }

          var selectUserIds = [];
          if ($scope.selectWorkersArr != null && $scope.selectWorkersArr.length > 0) {
            for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
              selectUserIds.push($scope.selectWorkersArr[i].label + ',' + $scope.selectWorkersArr[i].value);
            }
          }
          /**
           * 修改离线为在线提交
           */

          truckItemsSecond = [];
          var newTrucks = [];
          if (Number(localStorage.onoffline) != 0) {
            if ($scope.allTruckItems != null && $scope.allTruckItems.length > 0) {
              for (var i = 0; i < $scope.allTruckItems.length; i++) {
                truckItemsSecond.push({
                  Truck_Serial_Number__c: $scope.allTruckItems[i].Id,
                  Operation_Hour__c: Number($scope.allTruckItems[i].Operation_Hour__c),
                  Service_Suggestion__c: $scope.allTruckItems[i].Service_Suggestion__c,
                  New_Operation_Hour__c: Number($scope.allTruckItems[i].New_Operation_Hour__c),
                  Maintenance_Level__c: $('#select_care_type option:selected').val()!="? undefined:undefined ?"&&$('#select_care_type option:selected').val()!=undefined?$('#select_care_type option:selected').val():"",
                  //Measure_Date__c:new Date()
                });
              }
              if (!addMore && $scope.contentTruckItemsMore.length > 0) {
                angular.forEach($scope.allTruckItems, function (item) {
                  for (var j = 0; j < $scope.contentTruckItemsMore.length; j++) {
                    if (item.Id == $scope.contentTruckItemsMore[j].Id) {
                      $scope.selectedTruckItemsMore.push($scope.contentTruckItemsMore[j]);
                    }
                  }
                });
              }
            }
            for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
              truckIds.push($scope.selectedTruckItemsMore[i].Id);
            }
            if (truckIds != null && truckItemsSecond != null && truckIds.length > 0 && truckItemsSecond.length > 0) {
              for (var i = 0; i < truckIds.length; i++) {
                for (var j = 0; j < truckItemsSecond.length; j++) {
                  if (truckIds[i] == truckItemsSecond[j].Truck_Serial_Number__c) {
                    newTrucks.push(truckItemsSecond[j]);
                  }
                }
              }
            }
          } else {
            if (initChildOrders != null && initChildOrders.length > 0) {
              for (var i = 0; i < initChildOrders.length; i++) {
                truckItemsSecond.push({
                  _soupEntryId: initChildOrders[i]._soupEntryId,
                  Truck_Serial_Number__c: initChildOrders[i].Id,
                  Operation_Hour__c: Number(initChildOrders[i].Operation_Hour__c),
                  Service_Suggestion__c: initChildOrders[i].Service_Suggestion__c,
                  New_Operation_Hour__c: Number(initChildOrders[i].New_Operation_Hour__c),
                  Maintenance_Level__c: initChildOrders[i].Maintenance_Level__c,
                  //Measure_Date__c:new Date()
                });
              }
            }
          }

          var workItemObj = [];
          for (var i = 0; i < $scope.workTimes.length; i++) {
            workItemObj.push({
              Id: $scope.workTimes[i].Id,
              Miles__c: Number($scope.workTimes[i].miles)
            });
          }

          if (serviceType!="Maintenance"){
              localMJobItemIds=[];
          }
          var requestBody = null;
          if (Number(localStorage.onoffline) != 0) {
            requestBody = JSON.stringify({
              'order': orderObj,
              'childOrders': truckItemsSecond,
              'workItems': workItemObj,
              'images': localUris,
              'assignUsers': selectUserIds,
              'str_suggestion': $('#serviceSuggest').val().trim(),
              'truckOrders': newTrucks,
              'MJobItemIds': localMJobItemIds
            });
          } else {
            requestBody = {
              'order': orderObj,
              'childOrders': truckItemsSecond,
              'assignUsers': selectUserIds
            };
          }
          if (canSave){
              canSave=false;
              // dualModeService.updateWorkOrderUtilInfo(Number(localStorage.onoffline), requestBody).then(
              //     function callBack(res) {
              //         AppUtilService.hideLoading();
              //         console.log(res);
              //         if (res.status.toLowerCase() != 'fail') {
              //             if (Number(localStorage.onoffline) != 0) {
              //                 $scope.regroupPartListForSave();
              //             } else {
              //                 $state.go('app.home');
              //                 $rootScope.getSomeData();
              //             }
              //         } else {
              //             canSave=true;
              //             $ionicPopup.alert({
              //                 title: res.message
              //             });
              //             return false;
              //         }
              //     }, function error(msg) {
              //         console.log(msg);
              //         AppUtilService.hideLoading();
              //         $ionicPopup.alert({
              //             title: msg.responseText
              //         });
              //         canSave=true;
              //         return false;
              //     });


            AppUtilService.showLoading();

            //异步合并保存工单与配件
            async.parallel([
                function(callback) {
                  setTimeout(function() {
                    dualModeService.updateWorkOrderUtilInfo(Number(localStorage.onoffline), requestBody).then(
                      function callBack(res) {
                        console.log(res);
                        if (res.status.toLowerCase() != 'fail') {
                          callback(null, 'one');
                          console.log("one");

                        } else {
                          AppUtilService.hideLoading();
                          canSave=true;
                          $ionicPopup.alert({
                            title: res.message
                          });
                          return false;
                        }
                      }, function error(msg) {
                        console.log(msg);
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                          title: msg.responseText
                        });
                        canSave=true;
                        return false;
                      });
                  }, 200);
                },
                function(callback) {
                  setTimeout(function() {
                    regroupPartList = [];
                    var part_InputForListChecked = [];//预留状态
                    $('input.partCheckbox').each(function (index, element) {
                      part_InputForListChecked.push(element.checked);
                    });
                    for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                      const element = $scope.selectedTruckFitItems[i];
                      var onePartOriginals = {};
                      onePartOriginals['Line_Item__c'] = i;//行项
                      onePartOriginals['Name'] = element.Name;//name
                      onePartOriginals['Quantity__c'] = element.quantity;//数量
                      if (element.priceCondition != null) {
                        onePartOriginals['Gross_Price__c'] = element.priceCondition.price;//公布价
                      }
                      // onePartOriginals['View_Integrity__c'] = element.View_Integrity__c;//预留
                      onePartOriginals['Service_Material__c'] = element.Id;//Service_Material__c
                      onePartOriginals['Material_Number__c'] = element.parts_number__c;//物料号
                      onePartOriginals['Parts_Type__c'] = element.type;//配件类型
                      onePartOriginals['Reserved__c'] = part_InputForListChecked[i];//预留
                      onePartOriginals['Service_Order_Overview__c'] = orderDetailsId;//工单ID
                      onePartOriginals['Material_Type__c'] = 'Part';
                      if (element.inventory != null) {
                        onePartOriginals['Delivery_Message__c'] = element.inventory.inventoryInfo;//可发货数量以及交货期
                        onePartOriginals['Delivery_Date__c'] = element.inventory.estimatedDeliveryDate;//可发货数量以及交货期
                      }

                      if (element.Procurement_Item_Information__c != null) {
                        onePartOriginals['Procurement_Item_Information__c'] = element.Procurement_Item_Information__c;//外协
                      } else {
                        regroupPartList.push(onePartOriginals);
                      }
                    }

                    console.log('regroupPartList:', regroupPartList);
                    var savePartsUrlVar = $scope.savePartsUrl + orderDetailsId;
                    console.log('savePartsUrl:', savePartsUrlVar);

                    ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'PUT', JSON.stringify(
                        regroupPartList), null, function callBack(responseSaveParts) {
                      console.log('responseSaveParts:', responseSaveParts);

                      //添加点击保存更改工单状态
                      if (responseSaveParts.ServiceOrderMaterialSums) { //舒哥接口特例，只要有ServiceOrderMaterialSums就是成功

                        callback(null, 'two');
                        console.log("two");


                      } else {
                        AppUtilService.hideLoading();

                        canSave=true;
                        $ionicPopup.alert({
                          title: responseSaveParts.message
                        });
                        return false;
                      }
                    }, function error(msg) {
                      console.log('responseSaveParts_error:', msg);
                      AppUtilService.hideLoading();
                      canSave=true;
                      $ionicPopup.alert({
                        title: msg.responseText
                      });
                      return false;
                    });

                  }, 100);
                }
              ],
              function(err, results) {
                // the results array will equal ['one','two'] even though
                // the second function had a shorter timeout.
                console.log("async.parallel:",results);
                AppUtilService.hideLoading();
                $state.go('app.home');
                $rootScope.getSomeData();
              });


          }
        };

        /**
         * 日期格式化方法
         * @param format
         * @returns {*}
         */
        Date.prototype.format = function (format) {
          var date = {
            'M+': this.getMonth() + 1,
            'd+': this.getDate(),
            'h+': this.getHours(),
            'm+': this.getMinutes(),
            's+': this.getSeconds(),
            'q+': Math.floor((this.getMonth() + 3) / 3),
            'S+': this.getMilliseconds()
          };
          if (/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
          }
          for (var k in date) {
            if (new RegExp('(' + k + ')').test(format)) {
              format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length));
            }
          }
          return format;
        };

        /**
         * 进入页面时
         */
        $scope.$on('$ionicView.enter', function () {
          console.log('接受点击事件');
          document.addEventListener('click', newHandle);//初始化弹框
          $(".popup-container").remove();
        });
        /**
         * 离开页面前
         */
        $scope.$on('$ionicView.beforeLeave', function () {
          console.log('移除点击事件');
          document.removeEventListener('click', newHandle);
        });

        var newHandle = function (e) {
          if (event.target.nodeName === 'HTML') {
            if (myPopup) {//myPopup即为popup
              myPopup.close();
            }
          }
          if (e.target === document.getElementById('btn_modify_Btn')) {
            $scope.toDisplayModifyDiv();
          } else {
            if (document.getElementById('btn_modify_Div').style) {
              document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
            }
          }
          if (e.target === document.getElementById('btn_import_Btn')) {
            $scope.toDisplayImportDiv();
          } else {
            if (document.getElementById('btn_import_Div').style) {
              document.getElementById('btn_import_Div').style.display = 'none';//隐藏
            }
          }
          if (e.target === document.getElementById('btn_refund_Btn')) {
            $scope.toDisplayRefundDiv();
          } else {
            if (document.getElementById('btn_refund_Div').style) {
              document.getElementById('btn_refund_Div').style.display = 'none';//隐藏
            }
          }
        };

        $scope.toDisBothModifyDiv = function () {
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏
          document.getElementById('btn_refund_Div').style.display = 'none';//隐藏
        };

        $scope.selectWorkers = function () {
          document.getElementById('workDetailTotal').style.display = 'none';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'block';
          document.getElementById('workPrintPage').style.display = 'none';

          for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
            $('input.ckbox_woker_searchresult_item').each(function (index, element) {
              if ($(element).attr('data-recordid') == $scope.selectWorkersArr[i].label) {
                $(this).prop('checked', true);
              }
            });
          }
        };

        $scope.hideSelectWorkersPage = function () {
          document.getElementById('workDetailTotal').style.display = 'block';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'none';
        };

        $scope.showDetailsMoreInf = function () {
          if (!allowEdit) {
            $('#moreBody').css('height', '100vh');
            $('#moreBody input.small_Type_Input ').prop('disabled', 'disabled');
            $('#moreBody textarea.small_Type_Textarea ').prop('disabled', 'disabled');
          }

          $('input.selectTruckItem').each(function (index, element) {
            if ($(this).prop('checked')) {
              $scope.allTruckItems[index].isShow = true;
            } else {
              $scope.allTruckItems[index].isShow = false;
            }
          });

          document.getElementById('workDetailTotal').style.display = 'none';//隐藏
          document.getElementById('workDetailPart').style.display = 'block';//隐藏

        };

        $scope.toDisBothModifyDiv = function () {
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏
          document.getElementById('btn_refund_Div').style.display = 'none';//隐藏

        };
        $scope.toDisplayImportDiv = function () {
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          document.getElementById('btn_refund_Div').style.display = 'none';//隐藏

          if (document.getElementById('btn_import_Div').style.display == 'none') {
            document.getElementById('btn_import_Div').style.display = '';//显示

          } else {
            document.getElementById('btn_import_Div').style.display = 'none';//隐藏
          }
        };
        $scope.toDisplayModifyDiv = function () {
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏
          document.getElementById('btn_refund_Div').style.display = 'none';//隐藏

          if (document.getElementById('btn_modify_Div').style.display == 'none') {
            document.getElementById('btn_modify_Div').style.display = '';//显示

          } else {
            document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          }
        };
        $scope.toDisplayRefundDiv = function () {
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏

          if (document.getElementById('btn_refund_Div').style.display == 'none') {
            document.getElementById('btn_refund_Div').style.display = '';//显示

          } else {
            document.getElementById('btn_refund_Div').style.display = 'none';//隐藏
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
            $('#selectCommonPart').css('display', 'none');
            $('#selectCommonPartWithKey').css('display', 'none');
            $('#selectTruckFit').css('display', 'none');
            $scope.getLSG();
          } else if (ele === 'selectCommonPart') {
            $('#selectCommonPart').css('display', 'block');
            $('#selectTruckFit').css('display', 'none');
            $('#selectCommonPartWithKey').css('display', 'none');
            $('#selectLSG').css('display', 'none');
            $scope.getCommonPart();
          } else if (ele === 'addDeleCP') {
            $('#selectCommonPart').css('display', 'none');
            $('#selectCommonPartWithKey').css('display', 'block');
            $('#selectLSG').css('display', 'none');
            $('#selectTruckFit').css('display', 'none');
          } else {
            $('#selectTruckFit').css('display', 'block');
            $('#selectLSG').css('display', 'none');
            $('#selectCommonPart').css('display', 'none');
            $('#selectCommonPartWithKey').css('display', 'none');
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
          console.log('closeSelectPage');
          $('div.newWorkList_truckSelect').animate({
            opacity: '0.6'
          }, 'slow', function () {
            $('div.newWorkList_truckSelect').hide();
            $('div.workListDetails_bodyer').animate({
              opacity: '1'
            }, 'normal').show();
          });
        };

        $scope.addDelePartConfirmBtn = function () {//配件添加删除搜索页面 确定按钮
          $scope.closeSelectPage();
          $scope.getTrucksWithSubstitution();
          // if ($scope.contentTruckFitItems.length == 0 && $scope.searchTruckText != null && $scope.searchTruckText != "") { //自定义配件名的添加
          //     var onePartOriginals = {};
          //     var priceCondition = {};
          //     onePartOriginals['quantity'] = '';//数量
          //     onePartOriginals['priceCondition'] = priceCondition['price'];//公布价
          //     onePartOriginals['View_Integrity__c'] = '';//预留
          //     onePartOriginals['parts_number__c'] = $scope.searchTruckText;//物料信息
          //     onePartOriginals['Name'] = $scope.searchTruckText;//Name
          //     onePartOriginals['materialId'] = $scope.searchTruckText;//物料号
          //     onePartOriginals['edit'] = true;
          //     onePartOriginals['type'] = '';//配件类型
          //     $scope.selectedTruckFitItems.push(onePartOriginals);
          //     $scope.searchTruckText = '';
          // }
        };
        //搜索配件
        $scope.getTrucks = function (keyWord) {
          AppUtilService.showLoading();
          $scope.contentTruckFitItems = [];
          console.log('getTrucks::', keyWord);
          let parts_number__cList = [];
          let partsQuantitys = [];
          var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord+"&accId="+Account_Ship_to__c;
          ForceClientService.getForceClient().apexrest(getPartsRelatedsKeyWordUrl, 'GET', {}, null,
            function (response) {
              console.log('searchPartssUrl:', response);
              for (let index = 0; index < response.results.length; index++) {
                let element = response.results[index];
                parts_number__cList.push(element.parts_number__c);
                partsQuantitys.push(1);//默认库存
              }
              var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList)
                                        + '&partsQuantitys='
                                        + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c+'&Rate__c='+$scope.Rate__c+'&Pricing_Date__c='+$scope.Pricing_Date__c;
              console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

              ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
                function (responsePartsRelateds) {
                  AppUtilService.hideLoading();
                  console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);
                  for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    // for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                    //     // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                    //     responsePartsRelatedsList[j]["itemNO"] = j;
                    //     $scope.contentTruckFitItems.push(responsePartsRelatedsList[j]);
                    // }
                    $scope.contentTruckFitItems.push(responsePartsRelatedsList[0]);
                  }
                }, function (error) {
                  console.log('error:', error);
                  AppUtilService.hideLoading();

                });

            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();
            });
        };

        //--清空经济件
        $scope.delByEconomical = function () {
          $scope.contentTruckFitItems = [];
          for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
            let element = $scope.selectedTruckFitItems[index];
            if (element.type == 'economical') {
              setTimeout(function () {
                // $scope.selectedTruckFitItems.remove(element);
                _.pull($scope.selectedTruckFitItems, element);
              }, 50);
            }
          }
        };

        //--使用经济件
        $scope.useByEconomical = function () {
          $scope.contentTruckFitItems = [];
          for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
            let element = $scope.selectedTruckFitItems[index];
            if (element.type == 'common' || element.type == 'substitution') {
              setTimeout(function () {
                // $scope.selectedTruckFitItems.remove(element);
                _.pull($scope.selectedTruckFitItems, element);
              }, 50);
            }
          }
        };
        //搜索配件--导入经济件
        $scope.getTrucksByEconomical = function () {
          AppUtilService.showLoading();
          $scope.contentTruckFitItems = [];
          let parts_number__cList = [];
          let partsQuantitys = [];
          let forOrdParts = [];
          for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
            let element = $scope.selectedTruckFitItems[index];
            if (element.type == 'common') {
              parts_number__cList.push(element.parts_number__c);
              partsQuantitys.push(1);//默认库存
            }
            if (element.edit) {
              forOrdParts.push(element);
            }
          }
          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c+'&Rate__c='+$scope.Rate__c+'&Pricing_Date__c='+$scope.Pricing_Date__c;
          console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);
          $scope.selectedTruckFitItems = [];// 清空列表

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();
              console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);
              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                  responsePartsRelatedsList[j]['edit'] = true;
                  if (responsePartsRelatedsList[j].type == 'common') {
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'economical') {
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'substitution') {
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }

                }
              }
              console.log('forOrdParts:', forOrdParts);
              console.log('$scope.selectedTruckFitItems:', $scope.selectedTruckFitItems);

              _.each(forOrdParts, function (oldItem) { //替换已经编辑过的配件
                _.each($scope.selectedTruckFitItems, function (newItem) { //替换已经编辑过的配件
                  // if (oldItem.materialId ==newItem.materialId ||oldItem.parts_number__c == newItem.parts_number__c){
                  if (oldItem.materialId == newItem.materialId) {
                    _.merge(newItem, oldItem);
                  }
                });
              });
              forOrdParts = [];

            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();
            });
        };

        //带入替代件
        $scope.getTrucksWithSubstitution = function () {
          if ($scope.selectedTruckFitItems.length == 0) {
            return;
          }
          AppUtilService.showLoading();
          let parts_number__cList = [];
          let partsQuantitys = [];
          let forOrdParts = [];
          for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
            if ($scope.selectedTruckFitItems[i].type == 'common' && !$scope.selectedTruckFitItems[i].edit) {
              parts_number__cList.push($scope.selectedTruckFitItems[i].parts_number__c);
              partsQuantitys.push(1);//默认库存
            }
            if ($scope.selectedTruckFitItems[i].edit) {
              forOrdParts.push($scope.selectedTruckFitItems[i]);
            }
          }
          $scope.selectedTruckFitItems = [];
          _.each(forOrdParts, function (item) { //为了保留之前保存过的配件
            $scope.selectedTruckFitItems.push(item);
          });
          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c+'&Rate__c='+$scope.Rate__c+'&Pricing_Date__c='+$scope.Pricing_Date__c;
          console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();
              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                  responsePartsRelatedsList[j]['edit'] = true;
                  if (responsePartsRelatedsList[j].type == 'common') {
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'substitution') {
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }

                }
              }
            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();

            });

        };

        $scope.scanCode = function () {

          cordova.plugins.barcodeScanner.scan(
            function (result) {
              //扫码成功后执行的回调函数
              console.log('result', result);
              $scope.searchAddTruckText = result.text;
              $scope.getTrucksWithKey(result.text);
            },
            function (error) {
              //扫码失败执行的回调函数
              alert('Scanning failed: ' + error);
            }, {
              preferFrontCamera: false, // iOS and Android 设置前置摄像头
              showFlipCameraButton: false, // iOS and Android 显示旋转摄像头按钮
              showTorchButton: true, // iOS and Android 显示打开闪光灯按钮
              torchOn: true, // Android, launch with the torch switched on (if available)打开手电筒
              prompt: '在扫描区域内放置二维码', // Android提示语
              resultDisplayDuration: 500, // Android, display scanned text for X ms.
              //0 suppresses it entirely, default 1500 设置扫码时间的参数
              formats: 'QR_CODE', // 二维码格式可设置多种类型
              orientation: 'portrait', // Android only (portrait|landscape),
                                       //default unset so it rotates with the device在安卓上 landscape 是横屏状态
              disableAnimations: false, // iOS     是否禁止动画
              disableSuccessBeep: false // iOS      禁止成功后提示声音 “滴”
            }
          );
        };

        $scope.checkAllSearchResults = function () {
          let ele = $('#ckbox_truckFit_searchresult_all');

          console.log('checkAllSearchResults:::', ele.prop('checked'));
          if (ele.prop('checked')) {
            $('input.ckbox_truck_searchresult_itemFit').each(function (index, element) {
              $(this).prop('checked', true);
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

            $('input.ckbox_truck_searchresult_itemFit').each(function (index, element) {
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
            $('#selectTruckFit_Tab_1').addClass('selectTruckFit_Tab_Active');
            $('#selectTruckFit_Tab_2').removeClass('selectTruckFit_Tab_Active');

            $('#selectTruckFit_result').css('display', 'block');
            $('#selectTruckFit_checked').css('display', 'none');
          } else if (index === '2') {
            $('#selectTruckFit_Tab_1').removeClass('selectTruckFit_Tab_Active');
            $('#selectTruckFit_Tab_2').addClass('selectTruckFit_Tab_Active');

            $('#selectTruckFit_result').css('display', 'none');
            $('#selectTruckFit_checked').css('display', 'block');
          }
        };

        $scope.checkSearchResults = function (ele) {
          let element = $('input.ckbox_truck_searchresult_itemFit[data-recordid*=\'' + ele.Id + '\']');
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

          $('input.ckbox_truck_searchresult_itemFit').each(function (index, element) {
            if ($(element).attr('data-recordid') == ele.Id && element.checked) {
              element.checked = false;
            }
          });
          document.getElementById('ckbox_truckFit_searchresult_all').checked = false;

          $scope.selectedTruckFitItems = new_temp;
          $scope.updateTruckString();

        };

        $scope.delAllSelectedItem = function () {
          $('input.ckbox_truck_searchresult_itemFit').each(function (index, element) {
            element.checked = false;
          });
          document.getElementById('ckbox_truckFit_searchresult_all').checked = false;

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
            console.log('partLSGServer_success:', response);
            for (let i = 0; i < response.ShoppingCartList.length; i++) {
              var element = response.ShoppingCartList[i];
              var ShoppingCartList = {};
              ShoppingCartList['cartName'] = element.cartName;
              var cartList = [];
              for (let j = 0; j < 20; j++) {
                if (element[j]) {
                  cartList.push(element[j]);
                }
              }
              ShoppingCartList['cartList'] = cartList;
              console.log('ShoppingCartList:', ShoppingCartList);
              $scope.contentLSGs.push(ShoppingCartList);
            }
            AppUtilService.hideLoading();
          }, function (error) {
            console.log('partLSGServer_error:', error);
            AppUtilService.hideLoading();
          });
        };

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
          if (type === 'economical') {
            returnType = 'quoted_Table green_legend';
          } else if (type === 'substitution') {
            returnType = 'quoted_Table blue_legend';
          } else if (type === 'common') {
            returnType = 'quoted_Table ';
          }
          return returnType;
        };
        //******************LSG勾选框************************ */
        $scope.checkAllSearchResultsLSG = function () {
          let ele = $('#ckbox_truckLSG_searchresult_all');

          console.log('checkAllSearchResultsLSG:::', ele.prop('checked'));
          if (ele.prop('checked')) {
            $('input.ckbox_truck_searchresult_itemLSG').each(function (index, element) {
              $(this).prop('checked', true);
            });
          } else {
            $('input.ckbox_truck_searchresult_itemLSG').each(function (index, element) {
              console.log('666:::', element.checked);
              element.checked = false;
            });

          }
        };
        $scope.setLSGList = function () {
          AppUtilService.showLoading();
          var contentLSGsGetList = [];
          $('input.ckbox_truck_searchresult_itemLSG').each(function (index, element) {
            if (element.checked) {
              console.log('ckbox_truck_searchresult_itemLSG:::', $(element).attr('data-recordid'));
              contentLSGsGetList.push($(element).attr('data-recordid'));
            }
          });
          let partsQuantitys = [];
          for (let i = 0; i < contentLSGsGetList.length; i++) {
            partsQuantitys.push(1);//默认库存
          }
          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(contentLSGsGetList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c+'&Rate__c='+$scope.Rate__c+'&Pricing_Date__c='+$scope.Pricing_Date__c;
          console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);
          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();
              console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);
              var rebuildListForLSG = [];
              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                  // responsePartsRelatedsList[j]["itemNO"] = j;
                  if (responsePartsRelatedsList[j].type == 'common') {
                    rebuildListForLSG.push(responsePartsRelatedsList[j]);
                  }
                }
              }

              for (let i = 0; i < rebuildListForLSG.length; i++) {
                $scope.selectedTruckFitItems.push(rebuildListForLSG[i]);
              }
              //添加未找到但是勾选的LSG
              //$scope.contentLSGs

              $scope.closeSelectPage();

            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();

            });

        };
        $scope.choooseAllCheckBox = function () {
          var ele = $('#selectTruckAll');
          if (ele.prop('checked')) {
            $('input.selectTruckItem').each(function (index, element) {
              $(this).prop('checked', true);
            });

          } else {
            $('input.selectTruckItem').each(function (index, element) {
              $(this).prop('checked', false);
            });
          }
        };

        // $('input.ckbox_part').each(function (index, element) {
        //   part_InputForListChecked.push(element.checked);
        // });
        $scope.regroupPartListForSave = function () {
          // AppUtilService.showLoading();
          // regroupPartList = [];
          // var part_InputForListChecked = [];//预留状态
          // $('input.partCheckbox').each(function (index, element) {
          //   part_InputForListChecked.push(element.checked);
          // });
          // for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
          //   const element = $scope.selectedTruckFitItems[i];
          //   var onePartOriginals = {};
          //   onePartOriginals['Line_Item__c'] = i;//行项
          //   onePartOriginals['Name'] = element.Name;//name
          //   onePartOriginals['Quantity__c'] = element.quantity;//数量
          //   if (element.priceCondition != null) {
          //     onePartOriginals['Gross_Price__c'] = element.priceCondition.price;//公布价
          //   }
          //   // onePartOriginals['View_Integrity__c'] = element.View_Integrity__c;//预留
          //   onePartOriginals['Service_Material__c'] = element.Id;//Service_Material__c
          //   onePartOriginals['Material_Number__c'] = element.parts_number__c;//物料号
          //   onePartOriginals['Parts_Type__c'] = element.type;//配件类型
          //   onePartOriginals['Reserved__c'] = part_InputForListChecked[i];//预留
          //   onePartOriginals['Service_Order_Overview__c'] = orderDetailsId;//工单ID
          //   if (element.Procurement_Item_Information__c != null) {
          //     onePartOriginals['Procurement_Item_Information__c'] = element.Procurement_Item_Information__c;//外协
          //   } else {
          //     regroupPartList.push(onePartOriginals);
          //   }
          // }
          //
          // console.log('regroupPartList:', regroupPartList);
          // var savePartsUrlVar = $scope.savePartsUrl + orderDetailsId + '&materialSumJSON=' + JSON.stringify(
          //   regroupPartList);
          // console.log('savePartsUrl:', savePartsUrlVar);
          //
          // ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'PUT', {}, null, function callBack(responseSaveParts) {
          //   AppUtilService.hideLoading();
          //   console.log('responseSaveParts:', responseSaveParts);
          //
          //   //添加点击保存更改工单状态
          //   if (responseSaveParts.ServiceOrderMaterialSums) { //舒哥接口特例，只要有ServiceOrderMaterialSums就是成功
          //     // $state.go('app.home');
          //     // $rootScope.getSomeData();
          //
          //     // if (enableArrival){
          //     //     $state.go('app.home');
          //     //     $rootScope.getSomeData();
          //     // }else{
          //     //     $state.go('app.workDetails', {
          //     //         //SendInfo: obj._soupEntryId,
          //     //         workDescription: null,
          //     //         AccountShipToC: localAccountShipToc,
          //     //         workOrderId: orderDetailsId,
          //     //         enableArrivalBtn: true,
          //     //         goOffTime: null,
          //     //         isNewWorkList: true,
          //     //         accountId: $scope.localAccId,
          //     //         orderBelong:true,
          //     //         openPrintPage:false
          //     //     });
          //     //     $rootScope.getSomeData();
          //     // }
          //
          //   } else {
          //     canSave=true;
          //     $ionicPopup.alert({
          //       title: '保存失败'
          //     });
          //     return false;
          //   }
          // }, function error(msg) {
          //   console.log('responseSaveParts_error:', msg);
          //   AppUtilService.hideLoading();
          //   canSave=true;
          //   $ionicPopup.alert({
          //     title: msg.responseText
          //   });
          //   return false;
          // });

        };

        $scope.getPartListForRead = function () {
          $scope.getPartsForReadUrl1 = $scope.getPartsForReadUrl + orderDetailsId;
          console.log('getServiceOrderMaterialSumsURL:', $scope.getPartsForReadUrl1);

          ForceClientService.getForceClient().apexrest($scope.getPartsForReadUrl1, 'PUT', {}, null,
            function (responseGetParts) {
              console.log('$scope.getServiceOrderMaterialSums:responseGetParts', responseGetParts);
              // $log.log('>>>> URL：'+$scope.getPartsForReadUrl1);
              // $log.log('>>>> Response：'+responseGetParts);

              AppUtilService.hideLoading();
              for (let i = 0; i < responseGetParts.length; i++) {
                const element = responseGetParts[i];
                element['Line_Item__c'] = i;
                element['materialId'] = responseGetParts[i].Service_Material__c;
                element['Service_Material__c'] = responseGetParts[i].Service_Material__c;
                element['parts_number__c'] = responseGetParts[i].Material_Number__c;
                element['Id'] = responseGetParts[i].Service_Material__c;
                element['type'] = 'common';
                element['edit'] = true;
                if (responseGetParts[i].Procurement_Item_Information__c != null) {
                  element['Procurement_Item_Information__c'] = responseGetParts[i].Procurement_Item_Information__c;//外协
                }
                var priceCondition = {};
                priceCondition['price'] = responseGetParts[i].Gross_Price__c;
                element['priceCondition'] = priceCondition;//公布价
                element['Reserved__c'] = responseGetParts[i].Reserved__c;
                element['quantity'] = responseGetParts[i].Quantity__c;
                var inventory = {};
                inventory['inventoryInfo'] = responseGetParts[i].Delivery_Message__c;
                inventory['estimatedDeliveryDate'] = responseGetParts[i].Delivery_Date__c;
                element['inventory'] = inventory;//
                element['Material_Type__c'] = responseGetParts[i].Material_Type__c;

                $scope.selectedTruckFitItems.push(element);
              }
              console.log('$scope.getServiceOrderMaterialSums:', $scope.selectedTruckFitItems);

              window.setTimeout(function () {
                $('input.partCheckbox').each(function (index, element) {
                  if ($scope.selectedTruckFitItems[index].Reserved__c == "true") {
                    element.checked = "true";
                  }
                });
              }, 200);

            }, function (error) {
              console.log('getServiceOrderMaterialSums_error:', error);
              AppUtilService.hideLoading();

            });

        };

        $scope.hidePartPage = function () {
          $scope.reloadTruckData();
          document.getElementById('workDetailTotal').style.display = 'block';//隐藏
          document.getElementById('workDetailPart').style.display = 'none';//隐藏
        };
        var updateTrucks=[];
        $scope.hidePartPagewithSave = function () {
          if (oCurrentUser.EmployeeNumber==undefined||oCurrentUser.EmployeeNumber==null||oCurrentUser.EmployeeNumber==""){
              return;
          }
          AppUtilService.showLoading();
          updateTrucks=[];
          angular.forEach($scope.allTruckItems,function (singleTruckItem) {
             if(singleTruckItem.isShow){
                 updateTrucks.push({
                     orderId:orderDetailsId,
                     truckId:singleTruckItem.Id,
                     truckName:singleTruckItem.truckItemNum,
                     equipment:singleTruckItem.Equipement__c,
                     opHour:singleTruckItem.Operation_Hour__c,
                     newOpHour:singleTruckItem.New_Operation_Hour__c,
                     ownerNumber:oCurrentUser.EmployeeNumber,
                     serviceSuggestion:encodeURIComponent(singleTruckItem.Service_Suggestion__c)
                 });
             }
          });

          ForceClientService.getForceClient().apexrest(
              '/TruckFleetOpHourService?action=updateTruckHour&trukHourRequest='+JSON.stringify(updateTrucks),
              'POST',
              {},
              null,
              function callBack(res) {
                AppUtilService.hideLoading();
                console.log(res);
                var canUpdateData=true;
                if(res.OriginData!=undefined&&res.OriginData!=null&&res.OriginData.length>0){
                    for(var i =0;i<res.OriginData.length;i++){
                        if (res.OriginData[i].updateStatus=="fail"||res.OriginData[i].updateStatus==null){
                            canUpdateData=false;
                        }
                    }
                    var errorTruckMsg="";
                    if (!canUpdateData){
                        res.OriginData.map(function (singleData) {
                             errorTruckMsg+="<p>"+singleData.truckName+":"+singleData.messageText+"</p>\n";
                        });
                        $ionicPopup.alert({
                            title:errorTruckMsg
                        });
                        return ;
                    }else{
                        document.getElementById('workDetailTotal').style.display = 'block';//隐藏
                        document.getElementById('workDetailPart').style.display = 'none';//隐藏
                        truckNumber="";
                        angular.forEach($scope.allTruckItems,function (singleCar) {
                            truckNumber += singleCar.truckItemNum + "(" + singleCar.Operation_Hour__c + "H)" + '; ';
                        });
                    }
                }else{
                    $ionicPopup.alert({
                        title:JSON.stringify(res)
                    });
                    return;
                }
              },function error(msg) {
                AppUtilService.hideLoading();
                console.log(msg);
                $ionicPopup.alert({
                    title:msg.responseText
                });
                return;
              });
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

        $scope.goGenerateOrders = function () {
          //跳转备件页面前先保存配件信息
          AppUtilService.showLoading();
          regroupPartList = [];
          var part_InputForListChecked = [];//预留状态
          $('input.partCheckbox').each(function (index, element) {
            part_InputForListChecked.push(element.checked);
          });
          for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
            const element = $scope.selectedTruckFitItems[i];
            var onePartOriginals = {};
            onePartOriginals['Line_Item__c'] = i;//行项
            onePartOriginals['Name'] = element.Name;//name
            onePartOriginals['Quantity__c'] = element.quantity;//数量
            if (element.priceCondition != null) {
              onePartOriginals['Gross_Price__c'] = element.priceCondition.price;//公布价
            }

            onePartOriginals['Reserved__c'] = part_InputForListChecked[i];//预留
            onePartOriginals['Service_Material__c'] = element.Id;//Service_Material__c
            onePartOriginals['Material_Number__c'] = element.parts_number__c;//物料号
            onePartOriginals['Parts_Type__c'] = element.type;//配件类型
            onePartOriginals['Service_Order_Overview__c'] = orderDetailsId;//工单ID
            onePartOriginals['Material_Type__c'] = 'Part';
            if (element.inventory != null) {
              onePartOriginals['Delivery_Message__c'] = element.inventory.inventoryInfo;//可发货数量以及交货期
              onePartOriginals['Delivery_Date__c'] = element.inventory.estimatedDeliveryDate;//可发货数量以及交货期
            }
            if (element.Procurement_Item_Information__c != null) {
              onePartOriginals['Procurement_Item_Information__c'] = element.Procurement_Item_Information__c;//外协
            } else {
              regroupPartList.push(onePartOriginals);

            }
          }
          console.log('regroupPartList:', regroupPartList);
          var savePartsUrlVar = $scope.savePartsUrl + orderDetailsId;
          console.log('savePartsUrl:', savePartsUrlVar);

          ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'PUT', JSON.stringify(
              regroupPartList), null, function callBack(responseSaveParts) {
            AppUtilService.hideLoading();
            console.log('responseSaveParts:', responseSaveParts);
            $state.go('app.generateOrders', {workOrderId: orderDetailsId, accountId: $stateParams.accountId, WorkOrderType: $('#select_work_type option:selected').val()!=undefined&&$('#select_work_type option:selected').val()!=null?$('#select_work_type option:selected').val():""});//跳转备件页面

          }, function error(msg) {
            console.log('responseSaveParts_error:', msg);
            AppUtilService.hideLoading();
            $ionicPopup.alert({
              title: msg.responseText
            });
            return false;
          });

        };

        $scope.openRefundPage = function () {
          $('input.refundcheckbox').each(function (index, element) {
            if (element.checked) {
              console.log('sv_checkbox refund:::', $(element).attr('data-recordid'));
              // contentLSGsGetList.push($(element).attr("data-recordid"));
              for (let i = 0; i < $scope.rejectedItems.length; i++) {
                var element1 = $scope.rejectedItems[i];
                for (let j = 0; j < element1.Delivery_Line_Item__r.length; j++) {
                  var element2 = element1.Delivery_Line_Item__r[j];
                  if (element2.Id === $(element).attr('data-recordid')) {
                    element2['checkBool'] = true;
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

          $state.go('app.refund', {refundInfo: nowSendRefund, orderDetailsId: orderDetailsId});
        };
        //退件接口
        $scope.getRefundList = function () {
          let deferred = $q.defer();
          console.log('$scope.getDeliveryOrder + orderDetailsId:', $scope.getDeliveryOrder + orderDetailsId);
          ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder + orderDetailsId, 'GET', {}, null,
            function (responseGetDelivery) {
              // ForceClientService.getForceClient().apexrest($scope.getDeliveryOrder + 'a1Zp0000000CWqd', 'GET', {},
              // null, function (responseGetDelivery) {
              AppUtilService.hideLoading();
              $scope.getNewWorkDetailServiceList();//备件接口get
              console.log('responseGetDelivery:', responseGetDelivery);
              $scope.rejectedItems = responseGetDelivery;
              regroupVarRefundList = responseGetDelivery;
              for (var i = 0; i < $scope.rejectedItems.length; i++) {
                for (var j = 0; j < $scope.rejectedItems[i].Delivery_Line_Item__r.length; j++) {
                  var elementget = $scope.rejectedItems[i].Delivery_Line_Item__r[j];
                  elementget['checkBool'] = false;

                }
              }
                deferred.resolve('');
              console.log('responseGetDeliveryafter:', $scope.rejectedItems);
            }, function (error) {
              console.log('responseGetDelivery_error:', error);
              AppUtilService.hideLoading();
            });
          return deferred.promise;
        };
        //备件接口
        $scope.getNewWorkDetailServiceList = function () {
          ForceClientService.getForceClient().apexrest($scope.getNewWorkDetailService + orderDetailsId, 'GET', {}, null,
            function (responseNewWorkDetailService) {
              AppUtilService.hideLoading();
              console.log('getNewWorkDetailService:', responseNewWorkDetailService);
              $scope.generateOrdersItems = responseNewWorkDetailService;
            }, function (error) {
              console.log('getNewWorkDetailService_error:', error);
              AppUtilService.hideLoading();
            });
        };

        $scope.checkAllBoxRefund = function () {
          var ele = $('#selectRefundAll');
          if (ele.prop('checked')) {
            $('input.refundcheckbox').each(function (index, element) {
              $(this).prop('checked', true);
            });

          } else {
            $('input.refundcheckbox').each(function (index, element) {
              $(this).prop('checked', false);
            });
          }
        };

        $scope.popupRefundContext = function (reitems) {
          var setButtons = [];
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
          // 自定义弹窗
          myPopup = $ionicPopup.show({
            title: '<div><span>退件原因:' + item.Return_Reason__c + '</span></div>' +
                   '<div><span>备注:' + item.Diff_Reason__c + '</span></div>',
            scope: $scope,
            buttons: setButtons
          });
          myPopup.then(function (res) {
            console.log('Tapped!', res);
          });
        };

        /**
         * 切换已选派工人员
         * @param index
         */
        $scope.changeWorkerTab = function (index) {
          if (index === '1') {
            $('#selectWorker_Tab_1').addClass('selectTruck_Tab_Active');
            $('#selectWorker_Tab_2').removeClass('selectTruck_Tab_Active');

            $('#selectWorker_result').css('display', 'block');
            $('#selectWorker_checked').css('display', 'none');
          } else if (index === '2') {
            $('#selectWorker_Tab_1').removeClass('selectTruck_Tab_Active');
            $('#selectWorker_Tab_2').addClass('selectTruck_Tab_Active');

            $('#selectWorker_result').css('display', 'none');
            $('#selectWorker_checked').css('display', 'block');
          }
        };

        /**
         * 搜索派工人员
         * @param keyWords
         */
        $scope.getWorkers = function (keyWords) {

          if (keyWords == null || keyWords == '') {
            $scope.workers = localWorkers;
            setTimeout(function () {
              for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
                $('input.ckbox_woker_searchresult_item').each(function (index, element) {
                  if ($(element).attr('data-recordid') == $scope.selectWorkersArr[i].label) {
                    $(this).prop('checked', true);
                  }
                });
              }
            }, 300);

          } else {
            var tempWorkers = $scope.workers;
            $scope.workers = [];
            for (var i = 0; i < tempWorkers.length; i++) {
              if (tempWorkers[i].value.trim().toLowerCase().indexOf(keyWords.toLowerCase()) > -1) {
                $scope.workers.push(tempWorkers[i]);
              }
            }
          }
        };

        /**
         *  选择派工人员 搜索结果 点击全选
         */
        $scope.checkAllWorkersResult = function () {
          let ele = $('#ckbox_worker_searchresult_all');

          console.log('checkAllSearchResults:::', ele.prop('checked'));
          if (ele.prop('checked')) {
            $('input.ckbox_woker_searchresult_item').each(function (index, element) {
              $(this).prop('checked', true);
            });

            angular.forEach($scope.workers, function (searchResult) {
              let existFlag = false;
              angular.forEach($scope.selectWorkersArr, function (selected) {
                if (searchResult.label == selected.label) {
                  existFlag = true;
                }
              });
              if (!existFlag) {
                $scope.selectWorkersArr.push(searchResult);
                $scope.updateWorkerString();
              }
            });
          } else {
            $('input.ckbox_woker_searchresult_item').each(function (index, element) {
              console.log('666:::', element.checked);
              element.checked = false;
            });

            let arr_temp = [];
            angular.forEach($scope.selectWorkersArr, function (selected) {
              let existFlag = false;
              angular.forEach($scope.workers, function (searchResult) {
                if (searchResult.label == selected.label) {
                  existFlag = true;
                }
              });
              if (!existFlag) {
                arr_temp.push(selected);
              }
            });
            $scope.selectWorkersArr = arr_temp;
            $scope.updateWorkerString();
          }
        };

        /**
         * 派工人员页选中单个派工人员
         * @param obj
         */
        $scope.checkCurrentSelectWorker = function (ele) {
          let element = $('input.ckbox_woker_searchresult_item[data-recordid*=\'' + ele.label + '\']');
          console.log('checkSearchResults::', element);

          if (element != null && element.length > 0) {
            if (element[0].checked) {
              let existFlag = false;
              for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
                if (ele.label == $scope.selectWorkersArr[i].label) {
                  existFlag = true;
                }
              }
              if (!existFlag) {
                $scope.selectWorkersArr.push(ele);
                $scope.updateWorkerString();
              }
            } else {
              let temp = [];
              for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
                if (ele.label != $scope.selectWorkersArr[i].label) {
                  temp.push($scope.selectWorkersArr[i]);
                }
              }
              $scope.selectWorkersArr = temp;
              $scope.updateWorkerString();
            }
          } else {
            console.log('checkSearchResults::error');
          }
        };

        /**
         * 派工人员页删除所有派工人员
         */
        $scope.deleteAllWorkersResult = function () {
          $('input.ckbox_woker_searchresult_item').each(function (index, element) {
            element.checked = false;
          });
          document.getElementById('ckbox_worker_searchresult_all').checked = false;

          $scope.selectWorkersArr = [];
          $scope.updateWorkerString();
        };
        /**
         *派工人员页删除单个派工人员
         * @param obj
         */
        $scope.deleteCurrentSelectWorker = function (ele) {
          let new_temp = [];

          for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
            if (ele.label != $scope.selectWorkersArr[i].label) {
              new_temp.push($scope.selectWorkersArr[i]);
            }
          }

          $('input.ckbox_woker_searchresult_item').each(function (index, element) {
            if ($(element).attr('data-recordid') == ele.label && element.checked) {
              element.checked = false;
            }
          });
          document.getElementById('ckbox_worker_searchresult_all').checked = false;

          $scope.selectWorkersArr = new_temp;
          $scope.updateWorkerString();

        };

        $scope.updateWorkerString = function () {
          let new_temp = '';

          for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
            new_temp = new_temp + $scope.selectWorkersArr[i].value + ';';
          }
          $scope.selectWorkersStr = new_temp;
        };
        var addMore = false;
        $scope.addMoreTruck = function () {
          addMore = true;
          document.getElementById('workDetailTotal').style.display = 'none';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'block';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'none';
          $scope.selectedTruckItemsMore = [];
          angular.forEach($scope.allTruckItems, function (singleTruckItem) {
            $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
              if ($(element).attr('data-recordid') == singleTruckItem.Id) {
                $(this).prop('checked', true);
                for (var i = 0; i < $scope.contentTruckItemsMore.length; i++) {
                  if (singleTruckItem.Id == $scope.contentTruckItemsMore[i].Id) {
                    $scope.selectedTruckItemsMore.push($scope.contentTruckItemsMore[i]);
                  }
                }
              }
            });

          });
        };
        var lsTrucks = [];
        var lsTrucks2 = [];
        /**
         * hide truck page
         */
        $scope.hideTruckAddPage = function () {
          document.getElementById('workDetailTotal').style.display = 'block';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'none';
          truckItems = [];
          lsTrucks = [];
          lsTrucks2 = [];
          $scope.allTruckItems = [];
          for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
            for (var j = 0; j < initTrucks.length; j++) {
              if ($scope.selectedTruckItemsMore[i].Id == initTrucks[j].Id) {
                lsTrucks.push(initTrucks[j]);
              }
            }

          }
          angular.forEach($scope.selectedTruckItemsMore, function (currentItem) {
            lsTrucks2.push(currentItem);
          });
          for (var a = 0; a < lsTrucks2.length; a++) {
            for (var b = 0; b < lsTrucks.length; b++) {
              if (lsTrucks2[a].Id == lsTrucks[b].Id) {
                lsTrucks2.splice(a, 1);
              }
            }
          }
          $scope.initTrucks(lsTrucks, initChildOrders);
          for (var i = 0; i < lsTrucks2.length; i++) {
            truckItems.push(
              {
                Id: lsTrucks2[i].Id!=undefined && lsTrucks2[i].Id!=null ? lsTrucks2[i].Id : null,
                truckItemNum: lsTrucks2[i].Name!=undefined && lsTrucks2[i].Name!=null ?lsTrucks2[i].Name:null,
                Operation_Hour__c: lsTrucks2[i].Operation_Hour__c!=undefined && lsTrucks2[i].Operation_Hour__c!=null ? lsTrucks2[i].Operation_Hour__c: 0,
                Equipement__c:lsTrucks2[i].Equipement__c!=undefined && lsTrucks2[i].Equipement__c!=null ? lsTrucks2[i].Equipement__c:null,
                Maintenance_Key__c: lsTrucks2[i].Maintenance_Key__c!=undefined && lsTrucks2[i].Maintenance_Key__c!=null ? lsTrucks2[i].Maintenance_Key__c:null,
                chooseCheckBox: false,
                Model__c: lsTrucks2[i].Model__c!=undefined && lsTrucks2[i].Model__c!=null ? lsTrucks2[i].Model__c:null,
                New_Operation_Hour__c: 0,
                Service_Suggestion__c: '',
                isShow: false
              }
            );
          }

          $scope.allTruckItems = truckItems;
          // truckIds = [];
          // for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
          //     $scope.allTruckItems.push(
          //         {
          //             Id: $scope.selectedTruckItemsMore[i].Id,
          //             truckItemNum: $scope.selectedTruckItemsMore[i].Name,
          //             Operation_Hour__c: 0,
          //             Maintenance_Key__c: $scope.selectedTruckItemsMore[i].Maintenance_Key__c,
          //             chooseCheckBox: false,
          //             Model__c:$scope.selectedTruckItemsMore[i].Model__c,
          //             New_Operation_Hour__c: 0,
          //             Service_Suggestion__c: '',
          //             isShow: false
          //         }
          //     );
          //
          // }

          // $scope.allTruckItems = truckItems;

          $scope.SelectedTruckNum = $scope.allTruckItems.length;
          if ($scope.allTruckItems.length > 0) {
            $scope.getMainLevelsAndDesc($scope.allTruckItems[0]).then(function (res) {
                return  $scope.initChidOrderInfo($scope.allTruckItems[0], initChildOrders);
            });
          }

        };

        //保养级别
        $scope.getMainLevelsAndDesc = function (obj) {
          let deferred = $q.defer();
          $scope.serviceLevels = [];
          $scope.serviceNames = [];
          if (obj.Maintenance_Key__c!=undefined&&obj.Maintenance_Key__c!=null) {
              SQuoteService.getMaintenanceLevelsAndDescriptionsInfo(obj.Maintenance_Key__c,
                  Number(localStorage.onoffline)).then(function callBack(response) {
                  console.log('getMainLevelsAndDesc', response);
                  $scope.serviceLevels.push("");
                  if (response.levels!=undefined && response.levels!=null && response.levels.length > 0) {
                      for (let i = 0; i < response.levels.length; i++) {
                          $scope.serviceLevels.push(response.levels[i]);
                      }
                      setTimeout(function () {
                          deferred.resolve("");
                      },200);
                  }else{
                      deferred.resolve("");
                  }
              }, function error(msg) {
                  $ionicPopup.alert({
                      title: msg.responseText
                  });
                  return false;
              });
          }else{
              deferred.resolve("");
          }
          return deferred.promise;
        };

        /**
         * 工单详情页添加添加车体号功能
         */
        $scope.getTrucksMore = function (keyWord) {
          AppUtilService.showLoading();
          $scope.getTrucksMoreStep1(keyWord).then(function () {
              AppUtilService.hideLoading();
              return $scope.getTrucksMoreStep2();
          });
        };


        $scope.getTrucksMoreStep1=function(keyWord){
            let deferred =$q.defer();
            $scope.contentTruckItemsMore = [];
            HomeService.searchTruckFleets(keyWord, $scope.localAccId, '150', doOnline).then(function success(response) {
                console.log(response);
                AppUtilService.hideLoading();
                let trucks = [];
                if (typeof (response) == 'string') {
                    $ionicPopup.alert({
                        title: response
                    });
                    return false;
                }
                if (response != null && response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        trucks.push(response[index]);
                    }
                    $scope.contentTruckItemsMore = trucks;
                    deferred.resolve('');
                }
                // else {
                //     $ionicPopup.alert({
                //         title: '结果',
                //         template: '没有数据'
                //     });
                //     return false;
                // }
            }, function error(msg) {
                console.log(msg);
                AppUtilService.hideLoading();
                $ionicPopup.alert({
                    title: msg.responseText
                });
                return false;
            });
            return  deferred.promise;
        };

        $scope.getTrucksMoreStep2=function(){
            for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                $('input.ckbox_truck_searchresult_item').each(function (index, element) {
                    if ($(element).attr('data-recordid') == $scope.selectedTruckItemsMore[i].Id) {
                        $(this).prop('checked', true);
                    }
                });
            }

            angular.forEach($scope.allTruckItems, function (singleTruckItem) {
                $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                    if ($(element).attr('data-recordid') == singleTruckItem.Id) {
                        $(this).prop('checked', true);
                    }
                });
            });
        };

        $scope.changeAddTruckTab = function (index) {
          if (index === '1') {
            $('#addTruck_Tab_1').addClass('selectTruck_Tab_Active');
            $('#addTruck_Tab_2').removeClass('selectTruck_Tab_Active');

            $('#addTruck_result').css('display', 'block');
            $('#addTruck_checked').css('display', 'none');
          } else if (index === '2') {
            $('#addTruck_Tab_1').removeClass('selectTruck_Tab_Active');
            $('#addTruck_Tab_2').addClass('selectTruck_Tab_Active');

            $('#addTruck_result').css('display', 'none');
            $('#addTruck_checked').css('display', 'block');
          }
        };

        $scope.checkAllAddSearchResults = function () {
          let ele = $('#ckbox_truck_add_searchresult_all');
          var serviceType =  $('#select_service_type option:selected').val();
          if (serviceType==="Maintenance"){
              if (ele.prop('checked')) {
                  $scope.selectedTruckItemsMore = [];
                  let mk = '';
                  let infoIds = [];
                  if ($scope.contentTruckItemsMore.length > 0) {
                      mk = $scope.contentTruckItemsMore[0].Maintenance_Key__c;
                      for (var i = 0; i < $scope.contentTruckItemsMore.length; i++) {
                          if (mk == $scope.contentTruckItemsMore[i].Maintenance_Key__c) {
                              $scope.selectedTruckItemsMore.push($scope.contentTruckItemsMore[i]);
                              infoIds.push(i);
                          }
                      }

                      $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                          $(this).prop('checked', false);
                      });

                      angular.forEach(infoIds, function (infoId) {
                          $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                              if (!element.checked && infoId == index) {
                                  $(this).prop('checked', true);
                              }
                          });
                      });
                      if ($scope.contentTruckItemsMore.length > 0 && $scope.selectedTruckItemsMore.length
                          < $scope.contentTruckItemsMore.length) {
                          $ionicPopup.alert({
                              title: '保养只能选择同保养策略的车'
                          });
                          return;
                      }

                  }
              } else {

                  $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                      console.log('666:::', element.checked);
                      element.checked = false;
                  });

                  let arr_temp = [];
                  angular.forEach($scope.selectedTruckItemsMore, function (selected) {
                      let existFlag = false;
                      angular.forEach($scope.contentTruckItemsMore, function (searchResult) {
                          if (searchResult.Id == selected.Id) {
                              existFlag = true;
                          }
                      });
                      if (!existFlag) {
                          arr_temp.push(selected);
                      }
                  });
                  $scope.selectedTruckItemsMore = arr_temp;
              }
          }else if(serviceType==="Repair"){
              if (ele.prop('checked')) {
                  $scope.selectedTruckItemsMore = [];
                  if ($scope.contentTruckItemsMore.length > 0) {
                      $scope.selectedTruckItemsMore.push($scope.contentTruckItemsMore[0]);
                  }
                  $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                      if (index==0){
                          $(this).prop('checked', true);
                      }else{
                          $(this).prop('checked', false);
                      }
                  });

              }else{
                  $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                      console.log('666:::', element.checked);
                      element.checked = false;
                  });

                  let arr_temp = [];
                  angular.forEach($scope.selectedTruckItemsMore, function (selected) {
                      let existFlag = false;
                      angular.forEach($scope.contentTruckItemsMore, function (searchResult) {
                          if (searchResult.Id == selected.Id) {
                              existFlag = true;
                          }
                      });
                      if (!existFlag) {
                          arr_temp.push(selected);
                      }
                  });
                  $scope.selectedTruckItemsMore = arr_temp;
              }
          }else{
              if (ele.prop('checked')) {
                  $scope.selectedTruckItemsMore = [];
                  if ($scope.contentTruckItemsMore.length > 0) {
                      for (var i = 0; i < $scope.contentTruckItemsMore.length; i++) {
                          $scope.selectedTruckItemsMore.push($scope.contentTruckItemsMore[i]);
                      }

                      $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                          $(this).prop('checked', true);
                      });
                  }
              }else{
                  $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                      console.log('666:::', element.checked);
                      element.checked = false;
                  });

                  let arr_temp = [];
                  angular.forEach($scope.selectedTruckItemsMore, function (selected) {
                      let existFlag = false;
                      angular.forEach($scope.contentTruckItemsMore, function (searchResult) {
                          if (searchResult.Id == selected.Id) {
                              existFlag = true;
                          }
                      });
                      if (!existFlag) {
                          arr_temp.push(selected);
                      }
                  });
                  $scope.selectedTruckItemsMore = arr_temp;
              }
          }
        };

        $scope.checkAddSearchResults = function (ele) {
          var serviceType =  $('#select_service_type option:selected').val();
          let element = $('input.ckbox_truck_add_searchresult_item[data-recordid*=\'' + ele.Id + '\']');
          console.log('checkSearchResults::', element);
          if (serviceType==="Maintenance"){
              if (element != null && element.length > 0) {
                  if (element[0].checked) {
                      let existFlag = false;
                      for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                          if (ele.Id == $scope.selectedTruckItemsMore[i].Id) {
                              existFlag = true;
                          }
                      }
                      if (!existFlag) {
                          if ($scope.selectedTruckItemsMore.length > 0) {
                              let mk = $scope.selectedTruckItemsMore[0].Maintenance_Key__c;
                              if (mk == ele.Maintenance_Key__c) {
                                  $scope.selectedTruckItemsMore.push(ele);
                              } else {
                                  element[0].checked = false;
                                  $ionicPopup.alert({
                                      title: '保养只能选择同保养策略的车'
                                  });
                                  return;
                              }
                          } else {
                              $scope.selectedTruckItemsMore.push(ele);
                          }

                      }
                  } else {
                      let temp = [];
                      for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                          if (ele.Id != $scope.selectedTruckItemsMore[i].Id) {
                              temp.push($scope.selectedTruckItemsMore[i]);
                          }
                      }
                      $scope.selectedTruckItemsMore = temp;
                  }
              } else {
                  console.log('checkSearchResults::error');
              }
          }else if (serviceType==="Repair"){
            if (element!=null&&element.length>0){
                if (element[0].checked){
                    $('input.ckbox_truck_add_searchresult_item').each(function (index, cElement) {
                        if ($(cElement).attr("data-recordid")==ele.Id){
                            cElement.checked = true;
                        }else{
                            cElement.checked = false;
                        }
                    });
                    $scope.selectedTruckItemsMore=[];
                    $scope.selectedTruckItemsMore.push(ele);
                }else{
                    let temp = [];
                    for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                        if (ele.Id != $scope.selectedTruckItemsMore[i].Id) {
                            temp.push($scope.selectedTruckItemsMore[i]);
                        }
                    }
                    $scope.selectedTruckItemsMore = temp;
                }
            }
          }else {
              if (element!=null&&element.length>0){
                  if (element[0].checked){
                      $scope.selectedTruckItemsMore.push(ele);
                  }else{
                      let temp = [];
                      for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                          if (ele.Id != $scope.selectedTruckItemsMore[i].Id) {
                              temp.push($scope.selectedTruckItemsMore[i]);
                          }
                      }
                      $scope.selectedTruckItemsMore = temp;
                  }
              }
          }
        };
        $scope.delAllAddSelectedItem = function () {
          $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
            element.checked = false;
          });
          document.getElementById('ckbox_truck_add_searchresult_all').checked = false;
          $scope.selectedTruckItemsMore = [];
        };

        $scope.delSelectedAddItem = function (ele) {
          //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
          let new_temp = [];

          for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
            if (ele.Id != $scope.selectedTruckItemsMore[i].Id) {
              new_temp.push($scope.selectedTruckItemsMore[i]);
            }
          }

          $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
            if ($(element).attr('data-recordid') == ele.Id && element.checked) {
              element.checked = false;
            }
          });
          document.getElementById('ckbox_truck_add_searchresult_all').checked = false;
          $scope.selectedTruckItemsMore = new_temp;
        };

        $scope.hideWorkPrintPage = function () {
          if ($scope.openPrint) {
            window.history.back();
            // $state.go("app.home");
          } else {
            document.getElementById('workDetailTotal').style.display = 'block';
            document.getElementById('truckConfigPage').style.display = 'none';
            document.getElementById('workDetailPart').style.display = 'none';
            document.getElementById('selectTruckAddPage').style.display = 'none';
            document.getElementById('selectWorkersPage').style.display = 'none';
            document.getElementById('workPrintPage').style.display = 'none';
          }
        };

        $scope.printWorkList = function () {
              AppUtilService.showLoading();
              $scope.checkBleStatus().then(function () {
                  return $scope.getBlueToothDevices();
              }).then(function (result) {
                  return $scope.connectBlueToothDevice(result);
              }).then(function () {
                  return $scope.printTicket();
              });
        };

        $scope.checkBleStatus=function(){
            let deferred =$q.defer();
            PrintPlugin.checkBlueTooth(null, function (result) {
                console.log(result);
                $log.info(result);
                if (result.status == 0) {
                    deferred.resolve('');
                }
            }, function error() {
                AppUtilService.hideLoading();
                $ionicPopup.alert({
                    title: '请确保设置中开启蓝牙功能'
                });
                return false;
            });
            return deferred.promise;
        };
        var printDevices=[];
        $scope.getBlueToothDevices=function(){
            let deferred =$q.defer();
            PrintPlugin.getBlueToothDevices(null, function (result) {
                console.log(result);
                if (result.length < 1) {
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: '请先在蓝牙中配对好设备'
                    });
                    return false;
                } else {
                    printDevices=[];
                    angular.forEach(result,function (singleRes) {
                        if (singleRes.toLowerCase().indexOf("ult113b")>-1){
                            printDevices.push(singleRes);
                        }
                    });
                    deferred.resolve(printDevices);
                }
            }, function error() {
                AppUtilService.hideLoading();
                $ionicPopup.alert({
                    title: '请先在设置中连接蓝牙设备'
                });
                return false;
            });
            return deferred.promise;
        };

        $scope.connectBlueToothDevice=function(result){
            let deferred =$q.defer();
            if(result.length>0){
                var arr = result[0].split('-');
                PrintPlugin.connectBlueToothDevice(arr[1], function callBack(res) {
                    console.log(res);
                    $log.info(res);
                    if (res.status == 0) {
                        deferred.resolve('');
                    } else {
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title: '连接蓝牙设备失败'
                        });
                        return false;
                    }
                }, function error(obj) {
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: obj.message
                    });
                    return false;
                });
            }else{
                $ionicPopup.alert({
                    title: ''
                });
            }
            return deferred.promise;
        };

        $scope.printTicket=function(){
            var workItemsTotal = [];
            for (var i = 0; i < $scope.localWorkItems.length; i++) {
                workItemsTotal.push({
                    ownerName: $scope.localWorkItems[i].ownerName,
                    dame: $scope.localWorkItems[i].dame,
                    departureTime: $scope.localWorkItems[i].departureTime,
                    arriveTime: $scope.localWorkItems[i].arriveTime,
                    leaveTime: $scope.localWorkItems[i].leaveTime,
                    miles: $scope.localWorkItems[i].workMiles
                });
            }
            var callStr = $('#call_str').val().trim();
            PrintPlugin.printTicket(
                {
                    customerName: customerNameValue,//customerName  客户民称
                    customerAccount: customerAccountValue+$scope.shipToSapNumber,//customerAccount 客户号
                    customerAddress: customerAddressValue,//customerAddress  客户地址
                    workSingleNumber: $scope.mobileName+$scope.serviceOrderSapNumber,//workSingleNumber 工作单号
                    TruckModel: truckNumber,//TruckModel //叉车型号
                    //workHour: $scope.workHourShow,//workHour //工作时长
                    workTimeTotal: workItemsTotal,
                    goodsTotal: $scope.goodsList,
                    listContent: '',//listContent  配件费参见发货清单
                    demandForRequire: callStr,//demandForRequire  报修需求
                    workContent: $scope.printWorkContent,//workContent  工作信息
                    resultAndSuggestions: $('#serviceSuggest').val(),//resultAndSuggestions  结果及建议
                    responsibleEngineer: ownerName,//responsibleEngineer  责任人
                    printPart2Check: $("#printPart2").prop("checked"),
                    printPart3Check: $("#printPart3").prop("checked"),
                    engineerImg: $scope.engineerImgStr != '././img/images/will_add_Img.png'
                        ? $scope.engineerImgStr.replace(/data:image\/jpeg;base64,/, '') : '',
                    busyImg: $scope.busyImgStr != '././img/images/will_add_Img.png' ? $scope.busyImgStr.replace(
                        /data:image\/jpeg;base64,/, '') : ''
                }
                , function callBack(response) {
                    console.log(response);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: '出票成功'
                    });
                }, function error(obj) {
                    console.log(obj);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: obj.message
                    });
                });
        };



        /**
         * 获取工程师签名
         */
        $scope.getEnginnerImg = function () {
          var Signature = cordova.require('nl.codeyellow.signature.Signature');
          Signature.getSignature(
            function (imgData) {
              if (!imgData) return;
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');
              canvas.width = imgData.width;
              canvas.height = imgData.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.putImageData(imgData, 0, 0);
              $scope.engineerImgStr = canvas.toDataURL('image/jpeg');
              console.log($scope.engineerImgStr);
            }, function (msg) {
              alert('Could not obtain a signature due to an error: ' + msg);
            });
        };

        /**
         * 获取客户签名
         */
        $scope.getBusinessImg = function () {
          var Signature = cordova.require('nl.codeyellow.signature.Signature');
          Signature.getSignature(
            function (imgData) {
              if (!imgData) return;
              var canvas = document.createElement('canvas');
              var ctx = canvas.getContext('2d');
              canvas.width = imgData.width;
              canvas.height = imgData.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.putImageData(imgData, 0, 0);
              $scope.busyImgStr = canvas.toDataURL('image/jpeg');
              console.log($scope.busyImgStr);
            }, function (msg) {
              alert('Could not obtain a signature due to an error: ' + msg);
            });
        };

        /**
         * 图片 byte[]转base64 数据
         */

        $scope.arrayBufferToBase64 = function (buffer) {
          var binary = '';
          var bytes = new Uint8Array(buffer);
          var len = bytes.byteLength;
          for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        };

        $scope.transformArrayBufferToBase64 = function (buffer) {
          var binary = '';
          var bytes = new Uint8Array(buffer);
          for (var len = bytes.byteLength, i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return window.btoa(binary);
        };

        $scope.isSuccess = function (strValue) {
          let objRegExp = /^[a-zA-Z0-9]{18}$/;
          return objRegExp.test(strValue);
        }
        /**
         * 工单转报价
         */
        $scope.goNewOfferFittings = function () {

          // for (var i = 0; i < $scope.allTruckItems.length; i++) {
          //     $scope.allTruckItems[i].Name = $scope.allTruckItems[i].truckItemNum;
          //     $scope.allTruckItems[i].Truck_Fleet__c = $scope.allTruckItems[i].truckItemNum;
          //     $scope.allTruckItems[i].Work_Time__c = $scope.allTruckItems[i].Operation_Hour__c;
          //
          // }
          // $state.go('app.newOfferFittings',
          //     {
          //         SendAllUser: $scope.allTruckItems,
          //         SendSoupEntryId: orderAccountId,
          //         OrderTruckItem: $scope.selectedTruckFitItems
          //     });
          AppUtilService.showLoading();
          console.log('responseConvertOrderToQuoteUrl:', $scope.convertOrderToQuoteUrl + orderDetailsId);

          ForceClientService.getForceClient().apexrest($scope.convertOrderToQuoteUrl + orderDetailsId, 'PUT', {}, null,
            function (responseConvertOrderToQuote) {
              AppUtilService.hideLoading();
              console.log('responseConvertOrderToQuote:', responseConvertOrderToQuote);
              if ($scope.isSuccess(responseConvertOrderToQuote)) {
                $state.go('app.priceDetail', {overviewId: responseConvertOrderToQuote, orderPageJump: true});

              } else {
                $ionicPopup.alert({
                  title: responseConvertOrderToQuote
                });
              }

            }, function (error) {
              console.log('responseConvertOrderToQuote_error:', error);
              AppUtilService.hideLoading();
              $ionicPopup.alert({
                title: '转换失败'
              });
              return false;
            });
        };

        <!--导入常用配件-->
        $scope.getCommonPart = function () {
          AppUtilService.showLoading();
          $scope.contentTruckParts = [];
          //常用配件
          ForceClientService.getForceClient().apexrest(
            $scope.getPersonalPartListService + oCurrentUser.Id,
            'GET',
            {},
            null,
            function callBack(res) {
              AppUtilService.hideLoading();
              _.each(res, function (item) {
                _.each(item.partList, function (partItem) {
                  partItem.isClick = false;
                });
              });
              $scope.contentTruckParts = res;
              console.log(res);
            },
            function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg.responseText);
            }
          );
        };

        $scope.toggleGroup = function (group) {
          group.show = !group.show;
          // console.log("toggleGroup:", group);
        };

        $scope.isGroupShown = function (group) {
          // console.log("isGroupShown:", group);
          return group.show;
        };

        //******************常用配件勾选框************************ */
        $scope.checkAllSearchResultsCommonPart = function () {

          var clicks = [];
          _.each($scope.contentTruckParts, function (item) {
            var isSelect = _.every(item.partList, 'isClick', true);
            clicks.push({'isSele': isSelect});
          });
          var hhhh = _.every(clicks, 'isSele', true);
          if (_.every(clicks, 'isSele', true)) {

            _.each($scope.contentTruckParts, function (item) {
              _.each(item.partList, function (partItem) {
                partItem.isClick = false;
              });
            });

          } else {

            _.each($scope.contentTruckParts, function (item) {
              _.each(item.partList, function (partItem) {
                partItem.isClick = true;
              });
            });
          }
        };

        $scope.checkSearchResultsCommonPart = function (litems) {
          _.each($scope.contentTruckParts, function (item) {
            _.each(item.partList, function (partItem) {
              if (_.isEqual(partItem, litems)) {
                if (partItem.isClick === true) {
                  _.assign(partItem, {isClick: false});
                } else {
                  _.assign(partItem, {isClick: true});
                }
              }
            });
          });
        };

        $scope.isTruckPartSelected = function (partItem) {
          if (_.isEmpty(partItem)) {
            return false;
          }
          return partItem.isClick;
        };

        $scope.isAllSelected = function () {
          if (_.isEmpty($scope.contentTruckParts)) {
            return false;
          }
          var clicks = [];
          _.each($scope.contentTruckParts, function (item) {
            var isSelect = _.every(item.partList, 'isClick', true);
            clicks.push({'isSele': isSelect});
          });
          var hhhh = _.every(clicks, 'isSele', true);
          return _.every(clicks, 'isSele', true);
        };

        <!--导入常用配件-->
        $scope.setCommonPartList = function () {
          $scope.closeSelectPage();
          AppUtilService.showLoading();
          var truckItems = $scope.contentTruckParts.map(function (parts) {
            return _.filter(parts.partList, function (truckPart) {
              return truckPart.isClick;
            });
          });
          console.log('truckItems', truckItems);

          let parts_number__cList = [];
          let partsQuantitys = [];
          angular.forEach(truckItems, function (forEachItem) {
            angular.forEach(forEachItem, function (forEachItemTwo) {
              parts_number__cList.push(forEachItemTwo.Part_Number__c);
              partsQuantitys.push(1);//默认库存
            });

          });

          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c+'&Rate__c='+$scope.Rate__c+'&Pricing_Date__c='+$scope.Pricing_Date__c;

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();

              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                $scope.selectedTruckFitItems.push(responsePartsRelatedsList[0]);
              }

              $scope.getTrucksWithSubstitution();
            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();

            });

        };

        <!--常用配件筛选-->
        $scope.changeTruckTabWithCP = function (index) {
          console.log('changeTruckTabWithCP:::', $('#selectTruckCP_result'));
          if (index === '1') {
            $('#selectTruckCP_Tab_1').addClass('selectTruckCP_Tab_Active');
            $('#selectTruckCP_Tab_2').removeClass('selectTruckCP_Tab_Active');

            $('#selectTruckCP_result').css('display', 'block');
            $('#selectTruckCP_checked').css('display', 'none');
          } else if (index === '2') {
            $('#selectTruckCP_Tab_1').removeClass('selectTruckCP_Tab_Active');
            $('#selectTruckCP_Tab_2').addClass('selectTruckCP_Tab_Active');

            $('#selectTruckCP_result').css('display', 'none');
            $('#selectTruckCP_checked').css('display', 'block');
          }
        };

        $scope.getTrucksWithKey = function (keyWord) {

          AppUtilService.showLoading();
          $scope.contentTruckItems = [];
          //常用配件
          ForceClientService.getForceClient().apexrest(
            $scope.getPartsWithKeyWord + oCurrentUser.Id + '&parentKeyWord=' + keyWord,
            'GET',
            {},
            null,
            function callBack(res) {
              AppUtilService.hideLoading();

              _.each(res, function (partItem) {
                partItem.isClick = false;
              });

              $scope.contentTruckItems = res;
              console.log(res);
            },
            function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg.responseText);
            }
          );

        };

        $scope.contentSelectTruckItems = function () {
          return _.filter($scope.contentTruckItems, function (truckPart) {
            return truckPart.isClick;
          });
        };

        $scope.isSearchAllSelected = function () {
          if (_.isEmpty($scope.contentTruckItems)) {
            return false;
          }
          var isSelect = _.every($scope.contentTruckItems, 'isClick', true);
          return isSelect;
        };

        $scope.isSearchTruckPartSelected = function (partItem) {
          if (_.isEmpty(partItem)) {
            return false;
          }
          return partItem.isClick;
        };

        $scope.checkAllSearchPart = function () {

          if (_.every($scope.contentTruckItems, 'isClick', true)) {

            _.each($scope.contentTruckItems, function (partItem) {
              partItem.isClick = false;
            });

          } else {

            _.each($scope.contentTruckItems, function (partItem) {
              partItem.isClick = true;
            });
          }
        };

        $scope.checkSearchPartItem = function (ele) {
          _.each($scope.contentTruckItems, function (partItem) {
            if (_.isEqual(partItem, ele)) {
              if (partItem.isClick === true) {
                _.assign(partItem, {isClick: false});
              } else {
                _.assign(partItem, {isClick: true});
              }
            }
          });
        };

        $scope.delSelectedPrat = function (ele) {
          _.each($scope.contentTruckItems, function (partItem) {
            if (_.isEqual(partItem, ele)) {
              _.assign(partItem, {isClick: false});
            }
          });
        };

        $scope.delAllSelectedPrat = function (ele) {
          _.each($scope.contentTruckItems, function (partItem) {
            partItem.isClick = false;
          });
        };

        $scope.saveSelectPageWithCP = function () {
          var truckItems = _.filter($scope.contentTruckItems, function (truckPart) {
            return truckPart.isClick;
          });

          if (truckItems.length > 0) {

            $('#selectCommonPart').css('display', 'block');
            $('#selectCommonPartWithKey').css('display', 'none');
            $('#selectLSG').css('display', 'none');
            $('#selectTruckFit').css('display', 'none');

            $scope.contentTruckParts = truckItems;

          } else {
            $ionicPopup.alert({
              title: '请选择配件分类'
            });
          }

        };

        $scope.closeSelectPageWithCP = function () {
          $('#selectCommonPart').css('display', 'block');
          $('#selectCommonPartWithKey').css('display', 'none');
          $('#selectLSG').css('display', 'none');
          $('#selectTruckFit').css('display', 'none');
        };

        /**
         * choose cancel dismiss modal
         */
        $scope.dismissServiceModal = function () {
          $('.mask_div').css('display', 'none');
          $('.maintain_popup').css('display', 'none');
          $('.maintain_checkbox').each(function (index, element) {
            if ($(element).prop('checked')) {
              $(element).prop('checked', false);
            }
          });
        };

        /**
         * choose save dismiss modal
         */
        var localMJobItemIds = [];
          var localWorkContent ="";
          var localWorkContent2 ="";
        $scope.confirmServiceModal = function () {
          let deferred = $q.defer();
            localWorkContent ="";
            localWorkContent2 ="";
          $('.mask_div').css('display', 'none');
          $('.maintain_popup').css('display', 'none');
          $('.maintain_checkbox').each(function (index, element) {
            if ($(element).prop('checked') && $(element).attr("id")!="") {
              localMJobItemIds.push($(element).attr("id"));
                localWorkContent +=$(element).next().text()+"\n";
                localWorkContent2+="<p>"+$(element).next().text()+"</p>";
            }
          });
            //$scope.workContent=workContent;
            // $scope.workContentShow=workContent;

            deferred.resolve("");
            return deferred.promise;
        };

        $scope.showModal = function () {
          let derferred = $q.defer();
          if ($scope.mainTanceChioces!=null && $scope.mainTanceChioces.length>0){
              $('.mask_div').css('display', 'block');
              $('.maintain_popup').css('display', 'block');
              derferred.resolve("");
          }
          return derferred.promise;
        };

        $scope.singleTruckFleetConfig = null;
        $scope.singleTruckFleetSuper = null;
        $scope.goTruckConfig = function (truckId) {
          document.getElementById('workDetailTotal').style.display = 'none';
          document.getElementById('truckConfigPage').style.display = 'block';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'none';
          AppUtilService.showLoading();
          ForceClientService.getForceClient().apexrest(
            '/TruckFleetService?truckId=' + truckId,
            'GET',
            null,
            {}, function callBack(res) {
              AppUtilService.hideLoading();
              console.log(res);
              //设备编号
              if (res.hasOwnProperty('Truck Fleet')) {
                $scope.singleTruckFleetConfig = res['Truck Fleet'];
              }
              //设备特性
              if (res.hasOwnProperty('Sales Config')) {
                $scope.singleTruckFleetSuper = res['Sales Config'];
              }
            }, function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg.responseText);
            });
        };

        $scope.hideTruckConfigPage = function () {
          document.getElementById('workDetailTotal').style.display = 'block';
          document.getElementById('truckConfigPage').style.display = 'none';
          document.getElementById('workDetailPart').style.display = 'none';
          document.getElementById('selectTruckAddPage').style.display = 'none';
          document.getElementById('selectWorkersPage').style.display = 'none';
          document.getElementById('workPrintPage').style.display = 'none';
        };

        $scope.changeServiceType = function(){
            // $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
            //     element.checked = false;
            // });
            // document.getElementById('ckbox_truck_add_searchresult_all').checked = false;
            //
            // var serviceType =  $('#select_service_type option:selected').val();
            // if (serviceType==="Maintenance"){
            //     if ($scope.selectedTruckItemsMore.length>0){
            //         let mk = $scope.selectedTruckItemsMore[0].Maintenance_Key__c;
            //         for(var i =0;i<$scope.selectedTruckItemsMore.length;i++){
            //             if($scope.selectedTruckItemsMore[i].Maintenance_Key__c!=mk){
            //                 $scope.selectedTruckItemsMore.splice(i,1);
            //                 i--;
            //             }
            //         }
            //     }
            // }else if (serviceType==="Repair"){
            //     if ($scope.selectedTruckItemsMore.length>0){
            //         var aa = $scope.selectedTruckItemsMore[0];
            //         $scope.selectedTruckItemsMore=[];
            //         $scope.selectedTruckItemsMore.push(aa);
            //     }
            // }
            // $scope.hideTruckAddPage();

            var serviceType =  $('#select_service_type option:selected').val();
            if (serviceType==="Maintenance"){
                $('#select_care_type').find('option[value = ""]').attr('selected', true);
            }else{
                localWorkContent="";
                localWorkContent2="";
                localMJobItemIds=[];
            }

        };

        $scope.changeCareType = function () {
            var careType=$('#select_care_type option:selected').val();
            if (careType==initLevel){
                initmjiInfos=initmjiInfosSecond;
            }else{
                initmjiInfos=[];
            }
            localMJobItemIds=[];
            $scope.changeCareTypeStep1().then(function (res) {
                if (res=="1"){
                    return  $scope.changeCareTypeStep2();
                }else{
                    localWorkContent="";
                    localWorkContent2="";
                }
            }).then(function (res) {
                return $scope.showModal();
            });
        };
        $scope.changeCareTypeStep1=function () {
            let deferred =$q.defer();
            var careType=$('#select_care_type option:selected').val();
            $scope.mainTanceChioces = [];
            if (careType == null) {
                return;
            }
            if ($scope.allTruckItems != null && $scope.allTruckItems.length > 0) {
                AppUtilService.showLoading();
                ForceClientService.getForceClient().apexrest(
                    $scope.getMaintanceChoiceUrl + $scope.allTruckItems[0].Model__c + '&level=' + careType,
                    'GET',
                    null,
                    {},
                    function callBack(res) {
                        console.log(res);
                        AppUtilService.hideLoading();
                        if (res != null && res.length > 0) {
                            if (res[0].status!=undefined&&res[0].status!=null&&res[0].status.toLowerCase()=="fail"){
                                $ionicPopup.alert({
                                    title:res[0].message
                                });
                                return;
                            }
                            for (var i = 0; i < res.length; i++) {
                                $scope.mainTanceChioces.push({
                                    Id: res[i].Id,
                                    Name: res[i].CH
                                });
                            }
                            setTimeout(function () {
                                deferred.resolve("1");
                            },200);
                        }else{
                            deferred.resolve("2");
                        }
                        // else{
                        //     $ionicPopup.alert({
                        //         title:"没有数据"
                        //     });
                        // }
                    }, function error(msg) {
                        console.log(msg);
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                            title: msg.responseText
                        });
                        return;
                    }
                );
            }else{
                deferred.resolve("2");
            }
            return deferred.promise;
        };
        $scope.changeCareTypeStep2=function () {

            // $scope.printWorkContent="";
            // $("#workContentShowBox")[0].innerHTML="";
            // $("#workContentShowBox").append("<p>"+$("#workContentStr").val()+"</p>");
            // $scope.printWorkContent+=$("#workContentStr").val()+"\n";
            let deferred = $q.defer();
                if (initmjiInfos != null && initmjiInfos.length > 0&&$('.maintain_checkbox')!=null&&$('.maintain_checkbox').length>0) {
                    //     $('.maintain_checkbox').each(function (index, element) {
                    //         angular.forEach(initmjiInfos, function (mjiInfo) {
                    //         if ($(element).attr("id") == mjiInfo.Id) {
                    //             $(element).prop("checked", true);
                    //         }
                    //     });
                    // });
                    for(var i =0;i<$('.maintain_checkbox').length;i++){
                        for (var j =0;j<initmjiInfos.length;j++){
                            if ($('.maintain_checkbox')[i].id == initmjiInfos[j].Id) {
                                // $("#workContentShowBox").append("<p>"+initmjiInfos[j].Job_Item_Description_CH__c+"</p>");
                                // $scope.printWorkContent+=initmjiInfos[j].Job_Item_Description_CH__c+"\n";
                                $('.maintain_checkbox')[i].checked=true;
                            }
                        }

                    }

                }else{
                    for(var i =0;i<$('.maintain_checkbox').length;i++){
                        $('.maintain_checkbox')[i].checked=true;
                    }
                }
            deferred.resolve("");
            return deferred.promise;
        };
      });
})();
