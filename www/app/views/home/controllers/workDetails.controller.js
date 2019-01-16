angular.module('oinio.workDetailsControllers', [])
  .controller('workDetailsController',
    function ($scope, $rootScope, $filter, $state, $log, $ionicPopup, $stateParams, ConnectionMonitor,
              LocalCacheService, HomeService, AppUtilService, SOrderService, ForceClientService, SQuoteService) {

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
          goTime               = null,
          truckIds             = [],
          initChildOrders      = [],
          initTrucks           = [],
          orderAccountId       = null,
          orderBelong=true,
          selectTypeIndex      = 0, //作业类型默认选择第一个
          enableArrival        = true,
          oCurrentUser         = LocalCacheService.get('currentUser') || {};
      vm.isOnline = null;

      $scope.checkNinePices = false;

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
      $scope.workers = [];//全部派工人员
      $scope.selectWorkersArr = [];//已选派工人员
      $scope.selectWorkersStr = '';//已选派工人员组成字符串
      $scope.searchWorkersText = '';
      $scope.updateDataStatusUrl = '/WorkDetailService?action=updateStatus';
      $scope.getMaintanceChoiceUrl='/NewWorkDetailService?model=';
      $scope.HasTruckNum = 0;
      $scope.SelectedTruckNum = 0;
      $scope.workTypes = [];
      $scope.carServices = [];
      $scope.showFooter = true;
      $scope.bfObjs = [];
      $scope.afObjs = [];
      $scope.mainTanceChioces=[];
      $scope.imgUris = [
        {
            imageId:'',
          imageBody: '././img/images/will_add_Img.png',
          // imageName: new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
        }
      ];
      //Maintain before
      $scope.imgUrisBefore = [
        {
            imageId:'',
          imageBody: '././img/images/will_add_Img.png',
          // imageName: 'bfth_'+new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
        }
      ];
      //Maintain after
      $scope.imgUrisAfter = [
        {
            imageId:'',
          imageBody: '././img/images/will_add_Img.png',
          // imageName: 'afth_'+new Date().format('yyyyMMddhhmmss/')+' '
            imageName: ''
        }
      ];

      $scope.selectedTruckItemsMore = [];
      $scope.arrivalPostUrl = '/WorkDetailService?action=arrival&sooId=';
      $scope.leavePostUrl = '/WorkDetailService?action=leave&sooId=';
      $scope.updateDataStatusUrl = '/WorkDetailService?action=updateStatus';
      $scope.departureUrl = '/WorkDetailService?action=departure&sooId=';
      $scope.searchAddTruckText = '';

      $scope.engineerImgStr = '';
      $scope.busyImgStr = '';

      $scope.getOrderTypeUri = '/NewWorkDetailService?serviceOrderViewId=';
      $scope.getPersonalPartListService = '/PersonalPartListService?action=getParts&userId=';
      $scope.getPartsWithKeyWord = '/PersonalPartListService?action=getPartsWithKeyWord&userId=';
      /**
       * 打印预览页面显示
       */

      $scope.customerNameValueShow = '';   //客户名称
      $scope.customerAccountValueShow = '';//客户号
      $scope.customerAddressValueShow = ''; //客户地址
      $scope.truckTypesValueShow = '';//叉车型号
      $scope.ownerNameShow = '';//负责工程师
      $scope.workHourShow = '';//工作小时
      $scope.callStrShow = '';//报修需求
      $scope.workContentShow = '';//工作信息
      $scope.suggestionShoW = '';//结果及建议

      $scope.localWorkItems = [];
      $scope.workTimes = [];//工作时间列表

      $scope.maintainType = false;
      $scope.mcb = false;
      $scope.serviceLevels = [];
      $scope.serviceNames = [];
      $scope.showOrderBelong =true;
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

        userInfoId = $stateParams.SendInfo;//原先工单数据的本地Id 现改为在线Id
        Account_Ship_to__c = $stateParams.AccountShipToC; //原工单
        workDescription = $stateParams.workDescription;
        goOffTimeFromPrefix = $stateParams.goOffTime;
        allowEdit = $stateParams.isNewWorkList;
        orderDetailsId = $stateParams.workOrderId;
        $scope.showFooter = $stateParams.isNewWorkList;
        enableArrival = $stateParams.enableArrivalBtn;
        orderAccountId = $stateParams.accountId;
        orderBelong  = $stateParams.orderBelong;
        $scope.showOrderBelong = orderBelong;
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
          if (orderBelong){
              $('#sidProgressBar').css('width', '25%');
          }else{
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

        //before
        $scope.bfObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'bf_'+new Date().format('yyyyMMddhhmmss/')+'*整车'
          });
        $scope.bfObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'bf_'+new Date().format('yyyyMMddhhmmss/')+'*车体号'
          });
        $scope.bfObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'bf_'+new Date().format('yyyyMMddhhmmss/')+'*小时数'
          });
        $scope.bfObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'bf_'+new Date().format('yyyyMMddhhmmss/')+'*维修部位'
          });

        //after
        $scope.afObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'af_'+new Date().format('yyyyMMddhhmmss/')+'*整车'
          });
        $scope.afObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'af_'+new Date().format('yyyyMMddhhmmss/')+'*维修部位'
          });
        $scope.afObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'af_'+new Date().format('yyyyMMddhhmmss/')+'*更换旧件'
          });
        $scope.afObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'af_'+new Date().format('yyyyMMddhhmmss/')+'*维修现场'
          });
        $scope.afObjs.push(
          {
              imageId:'',
            imageBody: '././img/images/will_add_Img.png',
            imageName: 'af_'+new Date().format('yyyyMMddhhmmss/')+'*服务车外观及后备箱'
          });
      });

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
        ForceClientService.getForceClient()
          .apexrest(
            $scope.getInitDataUri + '/' + orderDetailsId + '/' + oCurrentUser.Id,
            'GET',
            {}, null, function success(res) {
              console.log('getInitDataUri', res);
              $scope.initSoResult(res.soResult);
              //$scope.initPartNumers(res.partNumers);
              $scope.initPhotoData(res.images);
              $scope.initAssignUserData(res.assignUser);
              $scope.initSavedUserData(res.savedUser, res.assignUser);
              $scope.SelectedTruckNum = res.truckModels.length;
              $scope.initTrucks(res.truckModels);
              initTrucks = res.truckModels;
              initChildOrders = res.childOrders;
              if (initTrucks.length > 0) {
                $scope.getMainLevelsAndDesc(initTrucks[0], initChildOrders);
              }
              $scope.allTruckItems = truckItems;
              $scope.initWorkItems(res.workItems, res.soResult.On_Order__c);
              $scope.initSignature(res.sigEngineerImage, res.sigAcctImage);
              //交货列表
              $scope.getRefundList();
              //*********读取配件*************** */
              $scope.getPartListForRead();
            },
            function error(msg) {
              AppUtilService.hideLoading();
              console.log(msg);
            }).then(function () {
          // if (allowEdit){
          //     $scope.showModal();
          // }else{
          //     $scope.dismissModal();
          // }
        });

        // SOrderService.getPrintDetails(userInfoId).then(function success(result) {
        //     $log.info(result);
        //     console.log("orderDetailsId:",result.Id);
        //     orderDetailsId = result.Id;
        //     customerNameValue = result.Account_Ship_to__r.Name != null ? result.Account_Ship_to__r.Name : "";
        //     customerAccountValue = result.Account_Ship_to__r._soupEntryId != null ?
        // result.Account_Ship_to__r._soupEntryId : ""; customerAddressValue = result.Account_Ship_to__r.Address__c !=
        // null ? result.Account_Ship_to__r.Address__c : ""; if (result.truckModels != null &&
        // result.truckModels.length > 0) { for (var i = 0; i < result.truckModels.length; i++) { truckNumber +=
        // result.truckModels[i] + ";"; } } ownerName = result.Service_Order_Owner__r.Name != null ?
        // result.Service_Order_Owner__r.Name : ""; //获取图片 ForceClientService.getForceClient() .apexrest(
        // $scope.getInitPicUri + orderDetailsId +'/' +oCurrentUser.Id, 'GET', {  },null,function success(res) {
        // console.log(res); //初始化 已上传图片 var photoes=res.Photo; if (photoes!=undefined||photoes!=null){ if
        // (photoes.length>0){ //删除默认的图片  第一张 $scope.imgUris.splice(0, 1); for (var i=0;i<photoes.length;i++){
        // $scope.imgUris.push("data:image/jpeg;base64,"+photoes[i]); } //添加默认图片
        // $scope.imgUris.push("././img/images/will_add_Img.png"); }  } //初始化所有派工人员 var workersStrArr = res.assignUser; if(workersStrArr!=undefined || workersStrArr!=null){ for (var i=0;i<workersStrArr.length;i++){ var singleArr  = workersStrArr[i].split(','); $scope.workers.push({label:singleArr[0],value:singleArr[1]}); } localWorkers = $scope.workers; } //初始化已选派工人员 var savedUsers =res.savedUser; if(savedUsers!=undefined || savedUsers != null){ if (savedUsers.length>0){ for (var i=0;i<savedUsers.length;i++){ for(var j=0;j<workersStrArr.length;j++){ if (savedUsers[i]==workersStrArr[j].label){ $scope.workers.push(workersStrArr[j]); }else{ $scope.workers.push({label:savedUsers[i],value:""}); } } } } }  }, function error(msg) { console.log(msg); });  //*********读取配件*************** */ $scope.getPartListForRead(); return SOrderService.getOrdersSelectedTruck(userInfoId); }).then(function success(result) { $scope.SelectedTruckNum = 0; if (result.length > 0) { for (var i = 0; i < result.length; i++) { if (result[i].Truck_Serial_Number__r != undefined) { $scope.SelectedTruckNum = Number($scope.SelectedTruckNum) + 1; truckItems.push( { Id: result[i].Truck_Serial_Number__r.Id, truckItemNum: result[i].Truck_Serial_Number__r.Name, Operation_Hour__c: 0, Service_Suggestion__c: "", isShow: false } ); truckItemsSecond.push( { Id: result[i].Truck_Serial_Number__r.Id, Operation_Hour__c: 0, Service_Suggestion__c: "", } ); } } $scope.allTruckItems = truckItems; } console.log(result); $log.info(result); }).catch(function error(msg) { $log.error(msg); console.log(msg); });

        /**
         * 初始化
         */
        // SOrderService.getDetails(userInfoId).then(function success(result) {
        //     if (result != null) {
        //         console.log("getDetails:",result);
        //         localSoupEntryId = result._soupEntryId;
        //         if (result.Mobile_Offline_Name__c == null) {
        //             SOrderService.getOfflineName(userInfoId).then(function success(response) {
        //                 $scope.mobileName = response;
        //             }, function error(error) {
        //                 $scope.mobileName = "";
        //                 $log.error(error);
        //             });
        //         } else {
        //             $scope.mobileName = result.Mobile_Offline_Name__c;
        //         }
        //         var workType = result.Work_Order_Type__c;
        //         if (workType != null||workType!=undefined) {
        //             $("#select_work_type").find("option[value = workType]").attr("selected", true);
        //         }
        //         $scope.workContent = result.Description__c != null ? result.Description__c : "";
        //         if (workDescription != null) {
        //             $scope.callPhoneContent = workDescription;
        //         } else {
        //             $scope.callPhoneContent = result.Subject__c != null ? result.Subject__c : "";
        //         }
        //         $scope.suggestStr = result.Service_Suggestion__c != null ? result.Service_Suggestion__c : "";
        //     }
        //
        // }, function error(error) {
        //     $log.error(error);
        // })
        // .then(function () {
        //     return SOrderService.getWorkItemsForOverview(userInfoId).then(function (result) {
        //         console.log(result);
        //     }, function (error) {
        //         console.log(error);
        //         $log.error(error);
        //     })
        // })
        // .then(function () {
        //     HomeService.getTrucksForParentOrderSid(userInfoId).then(function (res) {
        //         $scope.HasTruckNum = res != null ? res.length : 0;
        //     }, function (error) {
        //         $log.error('Error ' + error);
        //     })
        // });

      });

      $scope.initSoResult = function (soResult) {
        if (soResult != undefined && soResult != null) {
          $scope.mobileName = soResult.Name != undefined ? soResult.Name : '';
          //客户名称：
          customerNameValue = soResult.Account_Ship_to__r.Name != undefined ? soResult.Account_Ship_to__r.Name : '';
          //客户号：
          customerAccountValue = soResult.Account_Ship_to__r.Id != undefined ? soResult.Account_Ship_to__r.Id : '';
          //客户地址：
          customerAddressValue =
            soResult.Account_Ship_to__r.Address__c != undefined ? soResult.Account_Ship_to__r.Address__c : '';
          //责任人：
          ownerName = soResult.Service_Order_Owner__r.Name != undefined ? soResult.Service_Order_Owner__r.Name : '';
          $scope.callPhoneContent = soResult.Description__c != undefined ? soResult.Description__c : '';
          $scope.suggestStr = soResult.Service_Suggestion__c != undefined ? soResult.Service_Suggestion__c : '';
          $scope.workContent = soResult.Subject__c != undefined ? soResult.Subject__c : '';
          if (soResult.Work_Order_Type__c != undefined) {
            $('#select_work_type').find('option[value = ' + soResult.Work_Order_Type__c + ']').attr('selected', true);
          }
          if (soResult.Service_Order_Sub_Type__c != undefined) {
            try {
              $('#select_service_type').find('option[value = ' + soResult.Service_Order_Sub_Type__c + ']').attr(
                'selected', true);
            } catch (e) {
              $('#select_service_type').find('option[value = \'Maintenance\']').attr('selected', true);
            }
          }
        }
      };

      $scope.errorFaults=[];
      $scope.initPartNumers =function(partNumers){
          $scope.errorFaults=[];
        if (partNumers.length>0){
            for (var i =0;i<partNumers.length;i++){
                $scope.errorFaults.push(partNumers[i]);
            }
        }
      };

      /**
       *  初始化保养级别
       */
      $scope.initChidOrderInfo = function (childOrders) {
        if (childOrders.length > 0) {
          var serviceLevel = childOrders[0].Maintenance_Level__c;
          $('#select_care_type').find('option[value = ' + serviceLevel + ']').attr('selected', true);
        }
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
              $scope.imgUrisBefore.splice(0,1);
              $scope.imgUrisAfter.splice(0,1);
              for (var i =0;i<photoes.length;i++){
                if (photoes[i].imageName.indexOf('bf_')>-1){
                    for(var j =0;j<$scope.bfObjs.length;j++){
                        if(photoes[i].imageName.split('/')[1]=== $scope.bfObjs[j].imageName.split('/')[1]){
                            $scope.bfObjs[j].imageId=photoes[i].imageId;
                            $scope.bfObjs[j].imageBody = 'data:image/jpeg;base64,'+photoes[i].imageBody;
                        }
                    }
                }else if (photoes[i].imageName.indexOf('af_')>-1) {
                    for(var j =0;j<$scope.afObjs.length;j++){
                        if(photoes[i].imageName.split('/')[1]=== $scope.afObjs[j].imageName.split('/')[1]){
                            $scope.afObjs[j].imageId=photoes[i].imageId;
                            $scope.afObjs[j].imageBody = 'data:image/jpeg;base64,'+photoes[i].imageBody;
                        }
                    }
                }else if(photoes[i].imageName.indexOf('bfth_')>-1){
                    $scope.imgUrisBefore.push(
                        {
                            imageId: photoes[i].imageId,
                            imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                            imageName:   photoes[i].imageName
                        }
                    );
                }else if (photoes[i].imageName.indexOf('afth_')>-1){
                    $scope.imgUrisAfter.push(
                        {
                            imageId: photoes[i].imageId,
                            imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                            imageName:   photoes[i].imageName
                        }
                    );
                }else{
                    $scope.imgUris.push(
                            {
                                imageId: photoes[i].imageId,
                                imageBody: 'data:image/jpeg;base64,' + photoes[i].imageBody,
                                imageName:   photoes[i].imageName
                            }
                        );
                }
            }
              if (allowEdit){
                  //添加默认图片
                  $scope.imgUris.push(
                      {
                          imageId:'',
                          imageBody: '././img/images/will_add_Img.png',
                          // imageName: new Date().format('yyyyMMddhhmmss/')+''
                          imageName: ''
                      }
                  );

                  $scope.imgUrisBefore.push({
                      imageId:'',
                      imageBody: '././img/images/will_add_Img.png',
                      // imageName: 'bfth_'+new Date().format('yyyyMMddhhmmss/')+' '
                      imageName: ''
                  });

                  $scope.imgUrisAfter.push({
                      imageId:'',
                      imageBody: '././img/images/will_add_Img.png',
                      // imageName: 'afth_'+new Date().format('yyyyMMddhhmmss/')+' '
                      imageName: ''
                  });

              }
          }

        }
      };

      $scope.initAssignUserData = function (workersStrArr) {
        if (workersStrArr != undefined && workersStrArr != null) {
          for (var i = 0; i < workersStrArr.length; i++) {
            var singleArr = workersStrArr[i].split(',');
            $scope.workers.push({label: singleArr[0], value: singleArr[1]});
          }
          localWorkers = $scope.workers;
        }
      };

      $scope.initSavedUserData = function (savedUsers, workersStrArr) {
        if (savedUsers != undefined && savedUsers != null) {
          if (savedUsers.length > 0) {
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

      $scope.initTrucks = function (trucks) {
        truckItems = [];
        //truckItemsSecond=[];
        for (var i = 0; i < trucks.length; i++) {
          truckNumber += trucks[i].Name + ';';
          truckItems.push(
            {
              Id: trucks[i].Id,
              truckItemNum: trucks[i].Name,
              Operation_Hour__c: 0,
              Maintenance_Key__c: trucks[i].Maintenance_Key__c != undefined ? trucks[i].Maintenance_Key__c : null,
              Service_Suggestion__c: '',
              chooseCheckBox: false,
              New_Operation_Hour__c: 0,
              isShow: false
            }
          );
          // truckItemsSecond.push(
          //     {
          //         Id:  trucks[i].Id,
          //         Operation_Hour__c: 0,
          //         Service_Suggestion__c: "",
          //     }
          // );
        }
      };

      $scope.initSignature = function (uri1, uri2) {
        $scope.engineerImgStr = 'data:image/jpeg;base64,' + uri1;
        $scope.busyImgStr = 'data:image/jpeg;base64,' + uri2;
      };

      $scope.initWorkItems = function (workItems, onOrder) {
        console.log('workItems', workItems);
        if (workItems.length > 0) {
          for (var i = 0; i < workItems.length; i++) {

            if (workItems[i].Arrival_Time__c != undefined && onOrder) {
                if (workItems[i].Leave_Time__c != undefined && onOrder){
                    continue;
                }else{
                    for (var j = 0; j < 3; j++) {
                        $('ol li:eq(' + j + ')').addClass('slds-is-active');
                    }
                    $('#departureBtn').css('pointer-events', 'none');
                    $('#departureBtn').addClass('textCompleted');
                    $('#arriveBtn').css('pointer-events', 'none');
                    $('#arriveBtn').addClass('textCompleted');
                    if (orderBelong){
                        $('#sidProgressBar').css('width', '50%');
                    }else{
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
              if (orderBelong){
                  $('#sidProgressBar').css('width', '25%');
              }else{
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
          }
        }

        for (var i = 0; i < workItems.length; i++) {
          $scope.workTimes.push({
            name: workItems[i].CreatedBy.Name != undefined ? workItems[i].CreatedBy.Name : '',
            departureTime: workItems[i].Departure_Time__c != undefined && workItems[i].Departure_Time__c != null
              ? workItems[i].Departure_Time__c.substring(0, 19).replace(/T/g, ' ') : '',
            leaveTime: workItems[i].Leave_Time__c != undefined && workItems[i].Leave_Time__c != null
              ? workItems[i].Leave_Time__c.substring(0, 19).replace(/T/g, ' ') : '',
          });
          $scope.localWorkItems.push(
            {
              ownerName: ownerName.substring(0,4),
              dame: workItems[i].Departure_Time__c != undefined ? new Date(workItems[i].Departure_Time__c).format('yyyy/MM/dd') : '',
              departureTime: workItems[i].Departure_Time__c != undefined ? new Date(workItems[i].Departure_Time__c).format('hh:mm:ss') : '',
              arriveTime: workItems[i].Arrival_Time__c != undefined ? new Date(workItems[i].Arrival_Time__c).format('hh:mm:ss') : '',
              leaveTime: workItems[i].Leave_Time__c != undefined ? new Date(workItems[i].Leave_Time__c).format('hh:mm:ss') : '',
              workMiles: ''
            }
          );
        }

          if (orderBelong){
              $('.workListDetails_bodyer').css('height','calc(100vh - 120px)');
              $('.textBtn').css('width','25%');
          }else{
              $('.workListDetails_bodyer').css('height', 'calc(100vh)');
              $('.textBtn').css('width','33.3%');
              $('.next_Footer').css('bottom','0px');
              if ($("#leave").hasClass("textCompleted")){
                    $("#sidProgressBar").css('width','99%');
              }else if ($("#arriveBtn").hasClass("textCompleted")){
                    $("#sidProgressBar").css('width','66%');
              }else if ($("#departureBtn").hasClass("textCompleted")){
                    $("#sidProgressBar").css('width','33%');
              }else{
                    $("#sidProgressBar").css('width','0%');
              }
          }

      };

      /**
       * 获取图片
       * 1.拍照
       * 2.从相册取
       */
      $scope.getPhoto = function ($event, imgs,prefix) {
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
                          imageId:'',
                        imageBody: 'data:image/jpeg;base64,' + imgUri,
                        imageName: prefix+new Date().format('yyyyMMddhhmmss/')+' '
                      });
                      imgs.push({
                          imageId:'',
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
                      for (var i = 0; i < imgs.length; i++) {
                        if (imgs[i].imageBody == '././img/images/will_add_Img.png' || imgs[i].imageBody == imgUri) {
                          imgs.splice(i, 1);
                          i--;
                        }
                      }
                      imgs.push(
                        {
                            imageId:'',
                          imageBody: 'data:image/jpeg;base64,' + imgUri,
                          imageName: prefix+new Date().format('yyyyMMddhhmmss/')+' '
                        });
                      imgs.push({
                          imageId:'',
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

      /**
       * 点击离开按钮
       * @param $event
       */
      $scope.doLeave = function () {
        if (goOffTimeFromPrefix == null) {
          $ionicPopup.alert({
            title: '请先选择到达'
          });
          return;
        }

        if (arriveTime == null) {
          var numArr1 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
          var numArr2 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15',
                         '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31',
                         '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47',
                         '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'];
          var mobileSelect3 = new MobileSelect({
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
            callback: function (indexArr, data) {
              $('#leave').text('离开');
              ah = parseInt(data[0].substring(6, 8));
              am = parseInt(data[2].substring(6, 8));
              //checkHours();
              leaveTime = new Date();
              var min = checkMinutes(leaveTime, am);
              if (min.index == 1) {
                arriveTime = new Date(
                  (leaveTime.getFullYear() + '-' + (leaveTime.getMonth() + 1) + '-' + leaveTime.getDate() + ' '
                   + (leaveTime.getHours() - ah) + ':' + min.mm + ':' + leaveTime.getSeconds()).replace(/-/, '-'));
              } else {
                arriveTime = new Date(
                  (leaveTime.getFullYear() + '-' + (leaveTime.getMonth() + 1) + '-' + leaveTime.getDate() + ' '
                   + (leaveTime.getHours() - ah - 1) + ':' + min.mm + ':' + leaveTime.getSeconds()).replace(/-/, '-'));
              }
              AppUtilService.showLoading();
              ForceClientService.getForceClient().apexrest(
                $scope.leavePostUrl + orderDetailsId + '&arrivalTime=' + arriveTime.format('yyyy-MM-dd hh:mm:ss')
                + '&leaveTime=' + leaveTime.format('yyyy-MM-dd hh:mm:ss') + '&userId=' + oCurrentUser.Id,
                'POST',
                {},
                null,
                function callBack(res) {
                  console.log(res);
                  AppUtilService.hideLoading();
                  if (res.status.toLowerCase() == 'success') {
                    if (orderBelong){
                        $('#sidProgressBar').css('width', '75%');
                    }else{
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

                }, function error(msg) {
                  AppUtilService.hideLoading();
                  console.log(msg);
                  $ionicPopup.alert({
                    title: '记录到达/离开时间失败',
                    template: msg
                  });
                  return false;
                }
              );
            }
          });
          mobileSelect3.show();
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
                AppUtilService.showLoading();
                ForceClientService.getForceClient().apexrest(
                  $scope.leavePostUrl + orderDetailsId + '&arrivalTime=' + arriveTime.format('yyyy-MM-dd hh:mm:ss')
                  + '&leaveTime=' + leaveTime.format('yyyy-MM-dd hh:mm:ss') + '&userId=' + oCurrentUser.Id,
                  'POST',
                  {},
                  null,
                  function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if (res.status.toLowerCase() == 'success') {
                      //$event.target.style.backgroundColor = "#00FF7F";
                      $('#leave').addClass('textCompleted');
                      for (var i = 0; i <= 3; i++) {
                        $('ol li:eq(' + i + ')').addClass('slds-is-active');
                      }
                      if (orderBelong){
                          $('#sidProgressBar').css('width', '75%');
                      }else{
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

                  }, function error(msg) {
                    AppUtilService.hideLoading();
                    console.log(msg);
                    $ionicPopup.alert({
                      title: '记录到达/离开时间失败',
                      template: msg
                    });
                    return false;
                  }
                );
              }
            }],
          });
        }
      };

      /**
       * 删除当前图片
       */
      $scope.deleteCurrentImg = function (imgUri,imgUris) {
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
                for (var i = 0; i <imgUris.length; i++) {
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
        if (document.getElementById('describInfDiv').style.display == 'none') {
          document.getElementById('describInfDiv').style.display = '';//显示
        } else {
          document.getElementById('describInfDiv').style.display = 'none';//隐藏
        }

        if (!allowEdit) {
          $('input.workDetailCustomeHourclas').prop('disabled', 'disabled');
        }
      };
      /**
       * 取消按钮
       */
      $scope.goBack = function () {
        // window.history.back();
        $state.go('app.home');
      };

      /**
       * 新建工单页面跳转工单详情页  点击出发
       */
      $scope.doDeparture = function () {
        var departureTime = new Date();
        goOffTimeFromPrefix = departureTime;
        AppUtilService.showLoading();
        ForceClientService.getForceClient().apexrest(
          $scope.updateDataStatusUrl + '&sooId=' + orderDetailsId + '&status=Not Completed',
          'POST',
          {},
          null, function callBack(res) {
            if (res.status.toLowerCase() == 'success') {
              ForceClientService.getForceClient().apexrest(
                $scope.departureUrl + orderDetailsId + '&departureTime=' + departureTime.format('yyyy-MM-dd hh:mm:ss')
                + '&userId=' + oCurrentUser.Id,
                'POST',
                {},
                null, function callBack(res) {
                  AppUtilService.hideLoading();
                  if (res.status.toLowerCase() == 'success') {
                    for (var i = 0; i < 2; i++) {
                      $('ol li:eq(' + i + ')').addClass('slds-is-active');
                    }
                    $('#departureBtn').css('pointer-events', 'none');
                    $('#departureBtn').addClass('textCompleted');
                    if (orderBelong){
                        $('#sidProgressBar').css('width', '25%');
                    }else{
                        $('#sidProgressBar').css('width', '33%');
                    }
                  } else {
                    $ionicPopup.alert({
                      title: res.message
                    });
                    return;
                  }
                }, function error(msg) {
                  AppUtilService.hideLoading();
                  console.log(msg);
                  $ionicPopup.alert({
                    title: msg
                  });
                  return;
                }
              );
            }
          }, function error(msg) {
            AppUtilService.hideLoading();
            console.log(msg);
            $ionicPopup.alert({
              title: msg
            });
            return;
          });
      };

      /**
       * 点击到达获取到达时间
       * @param $event
       * @returns {boolean}
       */
      $scope.getArrivalTime = function () {

        if (arriveTime != null) {
          return false;
        } else {
          arriveTime = new Date();
          if (goOffTimeFromPrefix == null) {
            var numArr1 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
            var numArr2 = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14',
                           '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
                           '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44',
                           '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
                           '60'];
            var mobileSelect3 = new MobileSelect({
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
              callback: function (indexArr, data) {
                $('#arriveBtn').text('到达');
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

                navigator.geolocation.getCurrentPosition(function success(position) {
                  localLatitude = position.coords.latitude;
                  localLongitude = position.coords.longitude;
                  AppUtilService.showLoading();
                  ForceClientService.getForceClient().apexrest(
                    $scope.updateDataStatusUrl + '&sooId=' + orderDetailsId + '&status=Not Completed',
                    'POST',
                    {},
                    null, function callBack(res) {
                      console.log(res);
                      if (res.status.toLowerCase() == 'success') {
                        ForceClientService.getForceClient().apexrest(
                          $scope.departureUrl + orderDetailsId + '&departureTime=' + goOffTimeFromPrefix.format(
                          'yyyy-MM-dd hh:mm:ss') + '&userId=' + oCurrentUser.Id,
                          'POST',
                          {},
                          null,
                          function callBack(res) {
                            AppUtilService.hideLoading();
                            console.log(res);
                            if (res.status.toLowerCase() == 'success') {
                              for (var i = 0; i < 2; i++) {
                                $('ol li:eq(' + i + ')').addClass('slds-is-active');
                              }
                              $('#departureBtn').css('pointer-events', 'none');
                              $('#departureBtn').addClass('textCompleted');
                              if (orderBelong){
                                  $('#sidProgressBar').css('width', '25%');
                              }else{
                                  $('#sidProgressBar').css('width', '33%');
                              }
                              ForceClientService.getForceClient().apexrest(
                                $scope.arrivalPostUrl + orderDetailsId + '&arrivalTime=' + arriveTime.format(
                                'yyyy-MM-dd hh:mm:ss') + '&userId=' + oCurrentUser.Id,
                                'POST',
                                {},
                                null,
                                function callBack(res) {
                                  AppUtilService.hideLoading();
                                  console.log(res);
                                  if (res.status.toLowerCase() == 'success') {
                                    //$event.target.style.backgroundColor = "#00FF7F";
                                    if (orderBelong){
                                        $('#sidProgressBar').css('width', '50%');
                                    }else{
                                        $('#sidProgressBar').css('width', '66%');
                                    }
                                    for (var i = 0; i < 3; i++) {
                                      $('ol li:eq(' + i + ')').addClass('slds-is-active');
                                    }
                                    $('#arriveBtn').css('pointer-events', 'none');
                                    $('#arriveBtn').addClass('textCompleted');
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
                                    template: msg
                                  });
                                  return false;
                                }
                              );
                            } else {
                              $ionicPopup.alert({
                                title: '记录出发时间失败',
                                template: res.message
                              });
                              return false;
                            }
                          },
                          function error(msg) {
                            AppUtilService.hideLoading();
                            console.log(msg);
                            $ionicPopup.alert({
                              title: '记录出发时间失败',
                              template: msg
                            });
                            return false;
                          }
                        );
                      } else {
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                          title: '更新工单状态失败',
                          template: res.message
                        });
                        return false;
                      }
                    }, function error(msg) {
                      AppUtilService.hideLoading();
                      console.log(msg);
                      $ionicPopup.alert({
                        title: '更新工单状态失败',
                        template: msg
                      });
                      return false;
                    }
                  );

                }, function error(msg) {
                  console.log(msg);
                  $ionicPopup.alert({
                    title: '获取定位失败',
                    template: msg
                  });
                  return false;
                });
              }
            });
            mobileSelect3.show();
          } else {
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
              $scope.arrivalPostUrl + orderDetailsId + '&arrivalTime=' + arriveTime.format('yyyy-MM-dd hh:mm:ss')
              + '&userId=' + oCurrentUser.Id,
              'POST',
              {},
              null,
              function callBack(res) {
                console.log(res);
                AppUtilService.hideLoading();
                if (res.status.toLowerCase() == 'success') {
                  //$event.target.style.backgroundColor = "#00FF7F";
                  if (orderBelong){
                      $('#sidProgressBar').css('width', '50%');
                  }else{
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
              }, function error(msg) {
                AppUtilService.hideLoading();
                console.log(msg);
                $ionicPopup.alert({
                  title: '记录到达时间失败',
                  template: msg
                });
                arriveTime = null;
                return false;
              }
            );

          }
        }

        // $ionicPopup.show({
        //     title: '是否确定到达？',
        //     buttons: [{
        //         text: '取消',
        //         onTap: function () {
        //
        //         }
        //     }, {
        //         text: '确定',
        //         onTap: function () {
        //             navigator.geolocation.getCurrentPosition(function success(position) {
        //                 localLatitude=position.coords.latitude;
        //                 localLongitude=position.coords.longitude;
        //                 ForceClientService.getForceClient().apexrest(
        //                     $scope.arrivalPostUrl+orderDetailsId+"&arrivalTime="+arriveTime.format("yyyy-MM-dd
        // hh:mm:ss"), 'POST', {}, null, function callBack(res) { console.log(res); if
        // (res.status.toLowerCase()=="success"){ $event.target.style.backgroundColor = "#00FF7F"; }else{
        // $ionicPopup.alert({ title:"记录到达时间失败" }); return false; } },function error(msg) { console.log(msg);
        // $ionicPopup.alert({ title:"记录到达时间失败" }); return false; } ); },function error(msg) { console.log(msg);
        // $ionicPopup.alert({ title:"获取定位失败" }); return false; }); } }], });
      };

      $scope.goodsList=[];
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
        $scope.workHourShow = '';//工作小时
        $scope.callStrShow = $('#call_str').val().trim();//报修需求
        $scope.workContentShow = $('#workContentStr').val();//工作信息
        $scope.suggestionShoW = $('#serviceSuggest').val();//结果及建议

          $scope.goodsList=[];
          for(var i = 0;i<$scope.rejectedItems.length;i++){
              var items = $scope.rejectedItems[i].Delivery_Line_Item__r;
              for (var j=0;j<items.length;j++){
                  $scope.goodsList.push({
                      SAP_Delivery_Order_Line_Item__c:items[j].SAP_Delivery_Order_Line_Item__c,
                      Service_Material__rparts_number__c:items[j].Service_Material__rparts_number__c,
                      Service_Material__rName:items[j].Service_Material__rName.substring(0,4),
                      Quantity__c:items[j].Quantity__c,
                      Used_Quantity__c:items[j].Used_Quantity__c
                  });
              }
          }
      };
      /**
       * 签单
       * @param $event
       */
      $scope.signBill = function () {
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
                      ForceClientService.getForceClient().apexrest(
                        $scope.updateDataStatusUrl + '&sooId=' + orderDetailsId + '&status=Field Work Done',
                        'POST',
                        {},
                        null, function callBack(res) {
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
                            template: msg
                          });
                          return false;
                        }
                      );
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
            console.log(msg);
          });
      };

      $scope.goSave = function () {
        AppUtilService.showLoading();
        localUris = [];

        //是否点击checkbox
        if ($scope.checkNinePices) {
          for (var i = 0; i < $scope.bfObjs.length; i++) {
            var aa = Object.assign({}, $scope.bfObjs[i]);
                if (aa.imageBody != '././img/images/will_add_Img.png') {
                        aa.imageBody = aa.imageBody.slice(23);
                    localUris.push(aa);
                }
          }

          for (var i = 0; i < $scope.afObjs.length; i++) {
              var bb =Object.assign({}, $scope.afObjs[i]);
                  if (bb.imageBody != '././img/images/will_add_Img.png') {
                          bb.imageBody = bb.imageBody.slice(23);
                      localUris.push(bb);
                  }
          }

          //维修前固定图片后增加的
          for (var i = 0; i < $scope.imgUrisBefore.length; i++) {
              var cc = Object.assign({}, $scope.imgUrisBefore[i]);
                if (cc.imageBody != '././img/images/will_add_Img.png') {
                        cc.imageBody = cc.imageBody.slice(23);
                    localUris.push(cc);
                }
          }
          //维修后固定图片后增加的
          for (var i = 0; i < $scope.imgUrisAfter.length; i++) {
                var dd =Object.assign({}, $scope.imgUrisAfter[i]);
                  if (dd.imageBody != '././img/images/will_add_Img.png') {
                      dd.imageBody = dd.imageBody.slice(23);
                      localUris.push(dd);
                  }
          }
        } else {
          //未勾选
          for (var i = 0; i < $scope.imgUris.length; i++) {
                  if ($scope.imgUris[i].imageBody != '././img/images/will_add_Img.png') {
                      let aa =Object.assign({}, $scope.imgUris[i]);
                      aa.imageBody = $scope.imgUris[i].imageBody.slice(23);
                      localUris.push(aa);
                  }
          }
          console.log(localUris);
        }


        localUris.push({
            imageId:'',
            imageName:'工程师签名-'+new Date().format('yyyyMMddhhmmss'),
            imageBody:$scope.engineerImgStr != 'data:image/jpeg;base64,undefined' ? $scope.engineerImgStr.replace(/data:image\/jpeg;base64,/, '') : ''
        });

          localUris.push({
              imageId:'',
              imageName:'客户签名-'+new Date().format('yyyyMMddhhmmss'),
              imageBody: $scope.busyImgStr != 'data:image/jpeg;base64,undefined' ? $scope.busyImgStr.replace(/data:image\/jpeg;base64,/, '') : ''
          });

        var orderObj = [{
          'Id': orderDetailsId,
          'Mobile_Offline_Name__c': $scope.mobileName,
          'Work_Order_Type__c': $('#select_work_type option:selected').val(),
          'Description__c': $('#call_str').val(),
          'Service_Suggestion__c': $('#serviceSuggest').val(),
          'Subject__c': $('#workContentStr').val(),
          'Service_Order_Sub_Type__c': $('#select_service_type option:selected').val(),
          //'Fault_Part_Code__c':$('#select_error_faults option:selected').val()
        }];

        var selectUserIds = [];
        for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
          selectUserIds.push($scope.selectWorkersArr[i].label);
        }

        /**
         * 修改离线为在线提交
         */
        // SOrderService.workDetailSaveButton(order, $scope.allTruckItems, $('#workContentStr').val(), localUris,
        // arriveTime, leaveTime, startTime, finishTime).then(function success(result) { console.log(result);
        // //*********保存配件************* */ $scope.regroupPartListForSave(); //********************** */  }, function
        // error(error) { $log.error(error); });

        truckItemsSecond = [];
        for (var i = 0; i < $scope.allTruckItems.length; i++) {
          truckItemsSecond.push({
            Truck_Serial_Number__c: $scope.allTruckItems[i].Id,
            Operation_Hour__c: Number($scope.allTruckItems[i].Operation_Hour__c),
            Service_Suggestion__c: $scope.allTruckItems[i].Service_Suggestion__c,
            New_Operation_Hour__c: Number($scope.allTruckItems[i].New_Operation_Hour__c),
            Maintenance_Level__c: $('#select_care_type option:selected').val(),
            //Measure_Date__c:new Date()
          });
        }
        var newTrucks = [];
        for (var i = 0; i < truckIds.length; i++) {
          for (var j = 0; j < truckItemsSecond.length; j++) {
            if (truckIds[i] == truckItemsSecond[j].Truck_Serial_Number__c) {
              newTrucks.push(truckItemsSecond[j]);
            }
          }
        }

        /**
         * 在线保存工单详情页的数据
         */
        ForceClientService.getForceClient()
          .apexrest(
            $scope.postDataToRemote,
            'POST',
            JSON.stringify({
              'order': orderObj,
              'childOrders': truckItemsSecond,
              'images': localUris,
              'assignUsers': selectUserIds,
              'str_suggestion': $('#serviceSuggest').val().trim(),
              'truckOrders': newTrucks
              // 'sigAcctImages': $scope.busyImgStr != 'data:image/jpeg;base64,undefined' ? $scope.busyImgStr.replace(
              //       /data:image\/jpeg;base64,/, '') : '',
              // 'sigEngineerImages': $scope.engineerImgStr != 'data:image/jpeg;base64,undefined'
              //   ? $scope.engineerImgStr.replace(/data:image\/jpeg;base64,/, '') : ''
            }), null, function success(res) {
              AppUtilService.hideLoading();
              console.log(res);
              if (res.status.toLowerCase() != 'fail') {
                //*********保存配件************* */
                $scope.regroupPartListForSave();
              } else {
                $ionicPopup.alert({
                  title: '保存数据失败',
                  template: res.message
                });
                return false;
              }

            },
            function error(msg) {
              console.log(msg);
              AppUtilService.hideLoading();
              $ionicPopup.alert({
                title: '保存数据失败',
                template: msg
              });
              return false;
            });
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

      //***************************** */初始化配件模块*********************************
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
        if ($scope.contentTruckFitItems.length == 0 && $scope.searchTruckText != null && $scope.searchTruckText != "") {
          var onePartOriginals = {};
          var priceCondition = {};
          onePartOriginals['quantity'] = '';//数量
          onePartOriginals['priceCondition'] = priceCondition['price'];//公布价
          onePartOriginals['View_Integrity__c'] = '';//预留
          onePartOriginals['parts_number__c'] = $scope.searchTruckText;//物料信息
          onePartOriginals['Name'] = $scope.searchTruckText;//Name
          onePartOriginals['materialId'] = $scope.searchTruckText;//物料号
          onePartOriginals['edit'] = true;
          onePartOriginals['type'] = '';//配件类型
          $scope.selectedTruckFitItems.push(onePartOriginals);
          $scope.searchTruckText = '';
        }
      };
      //搜索配件
      $scope.getTrucks = function (keyWord) {
        AppUtilService.showLoading();
        $scope.contentTruckFitItems = [];
        console.log('getTrucks::', keyWord);
        let parts_number__cList = [];
        let partsQuantitys = [];
        var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord;
        ForceClientService.getForceClient().apexrest(getPartsRelatedsKeyWordUrl, 'GET', {}, null, function (response) {
          console.log('searchPartssUrl:', response);
          for (let index = 0; index < response.results.length; index++) {
            let element = response.results[index];
            parts_number__cList.push(element.parts_number__c);
            partsQuantitys.push(1);//默认库存
          }
          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c;
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
              $scope.selectedTruckFitItems.remove(element);
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
              $scope.selectedTruckFitItems.remove(element);
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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c;
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
                if (oldItem.materialId ==newItem.materialId){
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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c;
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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c;
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
          // onePartOriginals['View_Integrity__c'] = element.View_Integrity__c;//预留
          onePartOriginals['Service_Material__c'] = element.Id;//Service_Material__c
          onePartOriginals['Material_Number__c'] = element.parts_number__c;//物料号
          onePartOriginals['Parts_Type__c'] = element.type;//配件类型
          onePartOriginals['Reserved__c'] = part_InputForListChecked[i];//预留
          onePartOriginals['Service_Order_Overview__c'] = orderDetailsId;//工单ID
          if (element.Procurement_Information__c!=null) {
            onePartOriginals['Procurement_Information__c'] = element.Procurement_Information__c;//外协
          }else {
            regroupPartList.push(onePartOriginals);
          }
        }

        console.log('regroupPartList:', regroupPartList);
        var savePartsUrlVar = $scope.savePartsUrl + orderDetailsId + '&materialSumJSON=' + JSON.stringify(
          regroupPartList);
        console.log('savePartsUrl:', savePartsUrlVar);

        ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'PUT', {}, null, function (responseSaveParts) {
          AppUtilService.hideLoading();
          console.log('responseSaveParts:', responseSaveParts);

          //添加点击保存更改工单状态
          if (responseSaveParts.ServiceOrderMaterialSums) { //舒哥接口特例，只要有ServiceOrderMaterialSums就是成功
            $state.go('app.home');
            $rootScope.getSomeData();
          } else {
            $ionicPopup.alert({
              title: '保存失败'
            });
            return false;
          }
        }, function (error) {
          console.log('responseSaveParts_error:', error);
          AppUtilService.hideLoading();
          $ionicPopup.alert({
            title: '保存失败'
          });
          return false;
        });

      };

      $scope.getPartListForRead = function () {
        $scope.getPartsForReadUrl1 = $scope.getPartsForReadUrl + orderDetailsId;
        console.log('getServiceOrderMaterialSumsURL:', $scope.getPartsForReadUrl1);

        ForceClientService.getForceClient().apexrest($scope.getPartsForReadUrl1, 'PUT', {}, null,
          function (responseGetParts) {
            console.log('$scope.getServiceOrderMaterialSums:responseGetParts', responseGetParts);

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
              if (responseGetParts[i].Procurement_Information__c!=null) {
                element['Procurement_Information__c'] = responseGetParts[i].Procurement_Information__c;//外协
              }
              var priceCondition = {};
              priceCondition['price'] = responseGetParts[i].Gross_Price__c;
              element['priceCondition'] = priceCondition;//公布价
              element['Reserved__c'] = responseGetParts[i].Reserved__c;
              element['quantity'] = responseGetParts[i].Quantity__c;
              $scope.selectedTruckFitItems.push(element);
            }
            console.log('$scope.getServiceOrderMaterialSums:',  $scope.selectedTruckFitItems);

            window.setTimeout(function () {
              $('input.partCheckbox').each(function (index, element) {
                if ($scope.selectedTruckFitItems[index].Reserved__c=="true"){
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
        document.getElementById('workDetailTotal').style.display = 'block';//隐藏
        document.getElementById('workDetailPart').style.display = 'none';//隐藏
      };

      $scope.hidePartPagewithSave = function () {
        document.getElementById('workDetailTotal').style.display = 'block';//隐藏
        document.getElementById('workDetailPart').style.display = 'none';//隐藏
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
      };

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
          if (element.Procurement_Information__c!=null) {
            onePartOriginals['Procurement_Information__c'] = element.Procurement_Information__c;//外协
          }else {
            regroupPartList.push(onePartOriginals);

          }
        }
        // _.each(regroupPartList,function (elementP) {
        //   if (elementP.Procurement_Information__c!=null) {
        //     regroupPartList.remove(elementP);
        //     // setTimeout(function () {
        //     // }, 50);
        //   }
        // });
        console.log('regroupPartList:', regroupPartList);
        var savePartsUrlVar = $scope.savePartsUrl + orderDetailsId + '&materialSumJSON=' + JSON.stringify(
          regroupPartList);
        console.log('savePartsUrl:', savePartsUrlVar);

        ForceClientService.getForceClient().apexrest(savePartsUrlVar, 'PUT', {}, null, function (responseSaveParts) {
          AppUtilService.hideLoading();
          console.log('responseSaveParts:', responseSaveParts);
          $state.go('app.generateOrders', {workOrderId: orderDetailsId, accountId: $stateParams.accountId});//跳转备件页面

        }, function (error) {
          console.log('responseSaveParts_error:', error);
          AppUtilService.hideLoading();
          $ionicPopup.alert({
            title: '保存失败'
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
            console.log('responseGetDeliveryafter:', $scope.rejectedItems);
          }, function (error) {
            console.log('responseGetDelivery_error:', error);
            AppUtilService.hideLoading();
          });
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

      $scope.addMoreTruck = function () {
        document.getElementById('workDetailTotal').style.display = 'none';
        document.getElementById('truckConfigPage').style.display = 'none';
        document.getElementById('workDetailPart').style.display = 'none';
        document.getElementById('selectTruckAddPage').style.display = 'block';
        document.getElementById('selectWorkersPage').style.display = 'none';
        document.getElementById('workPrintPage').style.display = 'none';
      };

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
        $scope.allTruckItems = [];
        $scope.initTrucks(initTrucks);
        truckIds = [];
        for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
          truckItems.push(
            {
              Id: $scope.selectedTruckItemsMore[i].Id,
              truckItemNum: $scope.selectedTruckItemsMore[i].Name,
              Operation_Hour__c: 0,
              Maintenance_Key__c: $scope.selectedTruckItemsMore[i].Maintenance_Key__c,
              chooseCheckBox: false,
              New_Operation_Hour__c: 0,
              Service_Suggestion__c: '',
              isShow: false
            }
          );
          // truckItemsSecond.push(
          //     {
          //         Id:  $scope.selectedTruckItemsMore[i].Id,
          //         Operation_Hour__c: 0,
          //         Service_Suggestion__c: "",
          //     }
          // );
          truckIds.push($scope.selectedTruckItemsMore[i].Id);
        }

        $scope.allTruckItems = truckItems;

        $scope.SelectedTruckNum = $scope.allTruckItems.length;
        if ($scope.allTruckItems.length > 0) {
          $scope.getMainLevelsAndDesc($scope.allTruckItems[0], initChildOrders);
        }

        // var beforeAddMoreTrucks = truckItems;
        // $scope.allTruckItems=[];
        // var beforeAddMoreTrucksSecond = truckItemsSecond;
        // truckItemsSecond=[];
        // truckItems=[];
        // setTimeout(function () {
        //     for (var i = 0;i<$scope.selectedTruckItemsMore.length;i++){
        //         truckItems.push(
        //             {
        //                 Id: $scope.selectedTruckItemsMore[i].Id,
        //                 truckItemNum: $scope.selectedTruckItemsMore[i].Name,
        //                 Operation_Hour__c: 0,
        //                 Service_Suggestion__c: "",
        //                 isShow: false
        //             }
        //         );
        //         truckItemsSecond.push(
        //             {
        //                 Id:  $scope.selectedTruckItemsMore[i].Id,
        //                 Operation_Hour__c: 0,
        //                 Service_Suggestion__c: "",
        //             }
        //         );
        //     }
        // },500);
        //
        // $scope.allTruckItems = truckItems;
        // for (var i =0;i<truckItems.length;i++){
        //     truckIds.push(truckItems[i].Id);
        // }
        // for(var i=0;i<beforeAddMoreTrucks.length;i++){
        // $scope.allTruckItems.push(beforeAddMoreTrucks[i]);
        // }
        // for (var i=0;i<beforeAddMoreTrucksSecond.length;i++){
        //     truckItemsSecond.push(beforeAddMoreTrucksSecond[i]);
        // }
        // $scope.SelectedTruckNum=$scope.allTruckItems.length;

      };

      //保养级别
      $scope.getMainLevelsAndDesc = function (obj, childOrders) {
        $scope.serviceLevels = [];
        $scope.serviceNames = [];
        if (!obj.Maintenance_Key__c) {
          return;
        }
        SQuoteService.getMaintenanceLevelsAndDescriptionsInfo(obj.Maintenance_Key__c, true).then(function (response) {
          console.log('getMainLevelsAndDesc', response);
          if (!response.levels) {
            return;
          }
          if (response.levels.length > 0) {
            $scope.serviceLevels = response.levels;
          }
          setTimeout(function () {
            if ($scope.serviceLevels.length > 0) {
              $scope.initChidOrderInfo(childOrders);
            }
          }, 200);
          // if (response.levels.length > 0 && response.names!=null){
          //     for (var i =0;i<$scope.serviceLevels.length ;i++ ){
          //         $scope.serviceNames.push(response.names[$scope.serviceLevels[i]]);
          //     }
          // }
        }, function (error) {
          $log.error('HomeService.searchTrucks Error ' + error);
        }).finally(function () {
          //AppUtilService.hideLoading();
        });
      };

      /**
       * 工单详情页添加添加车体号功能
       */
      $scope.getTrucksMore = function (keyWord) {
        $scope.contentTruckItemsMore = [];
        //AppUtilService.showLoading();
        HomeService.searchTruckFleets(keyWord, '', '20', doOnline).then(function success(response) {
          //AppUtilService.hideLoading();
          console.log(response);
          let trucks = [];
          if (typeof (response) == 'string') {
            $ionicPopup.alert({
              title: '结果',
              template: '没有数据'
            });
            return false;
          }
          if (response != null && response.length > 0) {
            for (let index = 0; index < response.length; index++) {
              trucks.push(response[index]);
            }
            $scope.contentTruckItemsMore = trucks;

            setTimeout(function () {
              for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
                $('input.ckbox_truck_searchresult_item').each(function (index, element) {
                  if ($(element).attr('data-recordid') == $scope.selectedTruckItemsMore[i].Id) {
                    $(this).prop('checked', true);
                  }
                });
              }
            }, 300);

            console.log('getTrucks', trucks);
          } else {
            $ionicPopup.alert({
              title: '结果',
              template: '没有数据'
            });
            return false;
          }
        }, function error(msg) {
          //AppUtilService.hideLoading();
          $ionicPopup.alert({
            title: '结果',
            template: '没有数据'
          });
          console.log(msg);
          return false;
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
        if (ele.prop('checked')) {
          $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
            $(this).prop('checked', true);
          });

          angular.forEach($scope.contentTruckItemsMore, function (searchResult) {
            let existFlag = false;
            angular.forEach($scope.selectedTruckItemsMore, function (selected) {
              if (searchResult.Id == selected.Id) {
                existFlag = true;
              }
            });
            if (!existFlag) {
              $scope.selectedTruckItemsMore.push(searchResult);
            }
          });
          let mk = '';
          if ($scope.selectedTruckItemsMore.length > 0) {
            mk = $scope.selectedTruckItemsMore[0].Maintenance_Key__c;
            for (var i = 0; i < $scope.selectedTruckItemsMore.length; i++) {
              if (mk != $scope.selectedTruckItemsMore[i].Maintenance_Key__c) {
                $scope.selectedTruckItemsMore.splice(i, 1);
              }
              ele.prop('checked', false);
              $('input.ckbox_truck_add_searchresult_item').each(function (index, element) {
                if (i == index) {
                  $(this).prop('checked', false);
                }
              });
              $ionicPopup.alert({
                title: '保养只能选择同保养策略的车'
              });
              return;
            }
          } else {

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
      };

      $scope.checkAddSearchResults = function (ele) {
        let element = $('input.ckbox_truck_add_searchresult_item[data-recordid*=\'' + ele.Id + '\']');
        console.log('checkSearchResults::', element);

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
        document.getElementById('workDetailTotal').style.display = 'block';
        document.getElementById('truckConfigPage').style.display = 'none';
        document.getElementById('workDetailPart').style.display = 'none';
        document.getElementById('selectTruckAddPage').style.display = 'none';
        document.getElementById('selectWorkersPage').style.display = 'none';
        document.getElementById('workPrintPage').style.display = 'none';
      };


      $scope.printWorkList = function () {
        var callStr = $('#call_str').val().trim();
        AppUtilService.showLoading();
        PrintPlugin.checkBlueTooth(null, function (result) {
          console.log(result);
          $log.info(result);
          if (result.status == 0) {
            PrintPlugin.getBlueToothDevices(null, function (result) {
              console.log(result);
              if (result.length < 1) {
                AppUtilService.hideLoading();
                $ionicPopup.alert({
                  title: '请先在蓝牙中配对好设备'
                });
                return false;
              } else {
                var arr = result[0].split('-');
                PrintPlugin.connectBlueToothDevice(arr[1], function (res) {
                  console.log(res);
                  $log.info(res);
                  if (res.status == 0) {
                    var workItemsTotal = [];
                    for (var i = 0; i < $scope.localWorkItems.length; i++) {
                      workItemsTotal.push({
                        ownerName: $scope.localWorkItems[i].ownerName,
                        dame:$scope.localWorkItems[i].dame,
                        departureTime: $scope.localWorkItems[i].departureTime,
                        arriveTime: $scope.localWorkItems[i].arriveTime,
                        leaveTime: $scope.localWorkItems[i].leaveTime,
                        miles: $scope.localWorkItems[i].workMiles
                      });
                    }

                    PrintPlugin.printTicket(
                      {
                          customerName: customerNameValue,//customerName  客户民称
                          customerAccount: customerAccountValue,//customerAccount 客户号
                          customerAddress: customerAddressValue,//customerAddress  客户地址
                          workSingleNumber: $scope.mobileName,//workSingleNumber 工作单号
                          TruckModel: truckNumber,//TruckModel //叉车型号
                          workHour: '  ' + h + '小时' + m + '分钟',//workHour //工作时长
                          workTimeTotal: workItemsTotal,
                          goodsTotal: $scope.goodsList,
                          listContent: '',//listContent  配件费参见发货清单
                          demandForRequire: '   ' + callStr,//demandForRequire  报修需求
                          workContent: $('#workContentStr').val(),//workContent  工作信息
                          resultAndSuggestions: $('#serviceSuggest').val(),//resultAndSuggestions  结果及建议
                          responsibleEngineer: ownerName,//responsibleEngineer  责任人
                          printPart2Check: $("#printPart2").prop("checked"),
                          printPart3Check: $("#printPart3").prop("checked"),
                          engineerImg:$scope.engineerImgStr != 'data:image/jpeg;base64,undefined' ? $scope.engineerImgStr.replace(/data:image\/jpeg;base64,/, '') : null,
                          busyImg:$scope.busyImgStr != 'data:image/jpeg;base64,undefined' ? $scope.busyImgStr.replace(/data:image\/jpeg;base64,/, null) : ''
                      }
                      , function (response) {
                        console.log(response);
                        $log.info(response);
                        AppUtilService.hideLoading();
                        $scope.hideWorkPrintPage();
                        $ionicPopup.alert({
                          title: '出票成功'
                        });
                        // $('#printBtn').css('pointer-events', 'none');
                        // $('#printBtn').addClass('textCompleted');
                        // $('ol li:eq(3)').addClass('slds-is-active');
                        // $('#sidProgressBar').css('width', '75%');
                        //$event.target.style.backgroundColor = "#00FF7F";
                      }, function (error) {
                        console.log(error);
                        $log.error(error);
                        AppUtilService.hideLoading();
                        $ionicPopup.alert({
                          title: '连接蓝牙设备失败'
                        });
                        return false;
                      });
                  } else {
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                      title: '连接蓝牙设备失败'
                    });
                    return false;
                  }
                }, function (error) {
                  AppUtilService.hideLoading();
                  $ionicPopup.alert({
                    title: '连接蓝牙设备失败'
                  });
                  return false;
                });
              }
            }, function (error) {
              AppUtilService.hideLoading();
              $ionicPopup.alert({
                title: '请先在设置中连接蓝牙设备'
              });
              return false;
            });
          }
        }, function (error) {
          AppUtilService.hideLoading();
          $ionicPopup.alert({
            title: '请确保设置中开启蓝牙功能'
          });
          return false;
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

      /**
       * 工单转报价
       */
      $scope.goNewOfferFittings = function () {

        var truckItemsPost = [];
        for (var i = 0; i < $scope.allTruckItems.length; i++) {
          $scope.allTruckItems[i].Name = $scope.allTruckItems[i].truckItemNum;
          $scope.allTruckItems[i].Truck_Fleet__c = $scope.allTruckItems[i].truckItemNum;
          $scope.allTruckItems[i].Work_Time__c = $scope.allTruckItems[i].Operation_Hour__c;

        }
        $state.go('app.newOfferFittings',
          {
            SendAllUser: $scope.allTruckItems,
            SendSoupEntryId: orderAccountId,
            OrderTruckItem: $scope.selectedTruckFitItems
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
            console.log(msg);
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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + Account_Ship_to__c;

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
            console.log(msg);
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
        $scope.dismissModal();
      };

      /**
       * choose save dismiss modal
       */
      $scope.confirmServiceModal = function () {
        $scope.dismissModal();
      };

      /**
       * hide modal
       */
      $scope.dismissModal = function () {
        $('.mask_div').css('display', 'none');
        $('.maintain_popup').css('display', 'none');
      };
      $scope.showModal = function () {
        $('.mask_div').css('display', 'block');
        $('.maintain_popup').css('display', 'block');
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
            console.log(msg);
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

        $scope.changeServiceType = function () {
            var index = $('option:selected', '#select_service_type').index();
            switch (index) {
                case 0:
                    $('.mask_div').css('display', 'block');
                    $('.maintain_popup').css('display', 'block');
                    $('#mainTainCheck').css('display', 'none');
                    $('#causeReson').css('display', 'none');
                    break;
                case 1:
                    $('.mask_div').css('display', 'none');
                    $('.maintain_popup').css('display', 'none');
                    $('#mainTainCheck').css('display', 'block');
                    break;
                case 2:
                    $('.mask_div').css('display', 'none');
                    $('.maintain_popup').css('display', 'none');
                    $('#mainTainCheck').css('display', 'none');
                    $('#causeReson').css('display', 'none');
                    break;
            }
        };

        $scope.changeWorkType =function (itemWorkType) {
            $scope.mainTanceChioces=[];
            if (itemWorkType.indexOf('Z80')>-1 || itemWorkType.indexOf('Z81')>-1 || itemWorkType.indexOf('Z82')>-1 || itemWorkType.indexOf('Z83')>-1){
                $('#mainTainCheck').prop("checked",true);
                $('#causeReson').css('display', 'block');
            }
            var careType = $('#select_care_type option:selected').val();
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.getMaintanceChoiceUrl+'E16C'+'&level='+careType,
                'GET',
                null,
                {},
                function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if(res[0].status!=undefined && res[0].status.toLowerCase()=="fail"){
                        $ionicPopup.alert({
                            title: res[0].message
                        });
                        return;
                    }else{
                        for (var i =0;i<res.length;i++){
                            $scope.mainTanceChioces.push(res[i].CH);
                        }
                    }
                },function error(msg) {
                    console.log(msg);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: msg
                    });
                    return;
                }
            );

        };

        $scope.changeCareType=function (careType) {
            var workType = $('#select_work_type option:selected').val();
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.getMaintanceChoiceUrl+workType+'&level='+careType,
                'GET',
                null,
                {},
                function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if(res[0].status!=undefined && res[0].status.toLowerCase()=="fail"){
                        $ionicPopup.alert({
                            title: res[0].message
                        });
                        return;
                    }else{
                        for (var i =0;i<res.length;i++){
                            $scope.mainTanceChioces.push(res[i].CH);
                        }
                    }
                },function error(msg) {
                    console.log(msg);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title: msg
                    });
                    return;
                }
            );
        };


    });

