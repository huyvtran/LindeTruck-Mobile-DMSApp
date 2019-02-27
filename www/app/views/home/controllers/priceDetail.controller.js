angular.module('oinio.PriceDetailController', [])
  .controller('PriceDetailController',
    function ($scope, $rootScope, $ionicPopup, $ionicHistory, $filter, $log, $state, $stateParams, Service1Service,
              ForceClientService, AppUtilService, LocalCacheService) {

      var oCurrentUser = LocalCacheService.get('currentUser') || {};

      $scope.contentTruckFitItems = [];//配件
      $scope.selectedTruckFitItems = [];
      $scope.contentTruckParts = [];
      $scope.contentTruckItems = [];
      $scope.serviceFeeList = [];
      $scope.quoteLabourOriginalsList = [];
      $scope.labourQuoteList = [];
      $scope.searchTruckPartText = '';
      $scope.priceConditionPriceAll = 0;
      $scope.serviceFeeListP3 = 0;
      $scope.serviceFeeListP4 = 0;
      $scope.priceDetail = {};
      $scope.basicInfo = {};
      $scope.serviceQuotes = {};
      $scope.proceTrucksList = [];
      $scope.contentLSGs = [];//LSG
      $scope.paramUrl1 = '/Parts/7990110000/' + $stateParams.SendSoupEntryId;
      $scope.paramUrl2 = '/Parts/7990110003/' + $stateParams.SendSoupEntryId;
      $scope.getMaintenanceKeyLevelPartssBy2Url = '/MaintenanceKeyLevelParts?names=';
      $scope.paramSaveUrl = '/ServiceQuoteOverview?';
      $scope.paramApprovalsUrl = '/v38.0/process/approvals';
      $scope.paramExeclUrl = '/excel/';
      $scope.searchPartssUrl = '/Partss?keyword=';
      $scope.partsRelatedsUrl = '/PartsRelateds?partsNumbers=';
      $scope.partLSGServer = '/LSGServer';
      $scope.getPersonalPartListService = '/PersonalPartListService?action=getParts&userId=';
      $scope.getPartsWithKeyWord = '/PersonalPartListService?action=getPartsWithKeyWord&userId=';
      $scope.queryDetail = '/ServiceQuoteOverview/';
      $scope.convertQuoteToOrder = '/ServiceQuoteOverviewService?type=convertQuoteToOrder&serviceQuoteOverviewId=';

      $scope.get = function () {
        AppUtilService.showLoading();
        //人工
        ForceClientService.getForceClient().apexrest($scope.paramUrl1, 'GET', {}, null, function (response) {
          console.log('success:', response);
          let responseItem = response.priceCondition;
          $scope.manMadePrice1 = responseItem.price;
          $scope.discountPrice1 = responseItem.discount;
          manMadeNo1Id = response.Id;
          manMadeNo1Name = response.parts_description__c;

        }, function (error) {
          console.log('error:', error);
        });

        //交通
        ForceClientService.getForceClient().apexrest($scope.paramUrl2, 'GET', {}, null, function (response) {
          console.log('success:', response);
          AppUtilService.hideLoading();
          let responseItem = response.priceCondition;
          $scope.manMadePrice2 = responseItem.price;
          $scope.discountPrice2 = responseItem.discount;
          manMadeNo2Id = response.Id;
          manMadeNo2Name = response.parts_description__c;
        }, function (error) {
          console.log('error:', error);
          AppUtilService.hideLoading();
        });

        //获得车辆保养级别对应的配件
        if ($stateParams.SendAllUser.length == 0) { //如果没有选择车辆的处理
          var serviceQuotesNull = {};
          serviceQuotesNull['Truck_Fleet__c'] = null;
          $stateParams.SendAllUser.push(serviceQuotesNull);
        } else {
          $scope.getByPart();
        }

        //获得工单转报价对应的配件
        if ($stateParams.OrderTruckItem) {
          if ($stateParams.OrderTruckItem.length == 0) { //如果没有选择车辆的处理
            var serviceQuotesNull = {};
            serviceQuotesNull['Truck_Fleet__c'] = null;
            $stateParams.SendAllUser.push(serviceQuotesNull);
          } else {
            $scope.selectedTruckFitItems = $stateParams.OrderTruckItem;
            $scope.getTrucksWithSubstitution();
          }
        }

      };

      $scope.getByPart = function () {
        //保养级别带出的配件信息
        var nameList = [];
        var maintenanceLevelList = [];

        angular.forEach($stateParams.SendAllUser, function (truckItem) {
          if (truckItem.Maintenance_Level__c) {
            nameList.push(truckItem.levelNames[truckItem.Maintenance_Level__c]);
            maintenanceLevelList.push(truckItem.Maintenance_Level__c);
          }
        });
        if (maintenanceLevelList.length == 0) {
          return;
        }
        var maintenanceKeyLevelPartssBy2Url = $scope.getMaintenanceKeyLevelPartssBy2Url + JSON.stringify(nameList)
                                              + '&maintenanceLevels=' + JSON.stringify(maintenanceLevelList);
        ForceClientService.getForceClient().apexrest(maintenanceKeyLevelPartssBy2Url, 'GET', {}, null,
          function (response) {
            console.log('getMaintenanceKeyLevelPartssBy2:', response);
            let parts_number__cList = [];
            let partsQuantitys = [];
            angular.forEach(response, function (truckItem) {
              parts_number__cList.push(truckItem.Part_Number__c);
              partsQuantitys.push(1);//默认库存
            });

            var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                      + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;

            ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
              function (responsePartsRelateds) {
                for (let i = 0; i < responsePartsRelateds.length; i++) {
                  var partsItem = {};
                  var responsePartsRelatedsList = responsePartsRelateds[i];
                  var truckFitItem = responsePartsRelatedsList[0];

                  partsItem.Name = truckFitItem.Name;
                  partsItem.parts_number__c = truckFitItem.parts_number__c;
                  if (truckFitItem.priceCondition) {
                    partsItem.Gross_Amount__c = truckFitItem.priceCondition.price;
                    partsItem.Discount__c = (truckFitItem.priceCondition.discount + 100) / 100;
                  } else {
                    partsItem.Gross_Amount__c = '0';
                    partsItem.Discount__c = '0';
                  }
                  partsItem.type = truckFitItem.type;
                  partsItem.Quantity__c = '';
                  partsItem.Net_Price__c = '';
                  partsItem.Net_Amount__c = '';
                  partsItem.SPN_Price__c = '';

                  $scope.selectedTruckFitItems.push(partsItem);
                }

                $scope.getTrucksWithSubstitution();
              }, function (error) {
                console.log('error:', error);
              });

          }, function (error) {
            console.log('error:', error);
          });

      };

      <!--导入工单转配件-->
      $scope.sendOrderPartList = function () {
        AppUtilService.showLoading();
        console.log('$stateParams.OrderTruckItem', $stateParams.OrderTruckItem);
        let parts_number__cList = [];
        let partsQuantitys = [];
        angular.forEach($stateParams.OrderTruckItem, function (forEachItem) {
          parts_number__cList.push(forEachItem.Part_Number__c);
          partsQuantitys.push(1);//默认库存
        });

        var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;

        ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
          function (responsePartsRelateds) {
            AppUtilService.hideLoading();

            for (let i = 0; i < responsePartsRelateds.length; i++) {
              var partsItem = {};
              var responsePartsRelatedsList = responsePartsRelateds[i];
              var truckFitItem = responsePartsRelatedsList[0];

              partsItem.Name = truckFitItem.Name;
              partsItem.parts_number__c = truckFitItem.parts_number__c;
              if (truckFitItem.priceCondition) {
                partsItem.Gross_Amount__c = truckFitItem.priceCondition.price;
                partsItem.Discount__c = (truckFitItem.priceCondition.discount + 100) / 100;
              } else {
                partsItem.Gross_Amount__c = '0';
                partsItem.Discount__c = '0';

              }
              partsItem.type = truckFitItem.type;
              partsItem.Quantity__c = '';
              partsItem.Net_Price__c = '';
              partsItem.Net_Amount__c = '';
              partsItem.SPN_Price__c = '';

              $scope.selectedTruckFitItems.push(partsItem);
              // var responsePartsRelatedsList = responsePartsRelateds[i];
              // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[0]);
            }

            $scope.getTrucksWithSubstitution();
          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();

          });

      };

      $scope.toDisplayImportDiv = function () {
        document.getElementById('btn_modify_Div').style.display = 'none';//隐藏

        if (document.getElementById('btn_import_Div').style.display == 'none') {
          document.getElementById('btn_import_Div').style.display = '';//显示

        } else {
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏
        }
      };
      $scope.toDisplayModifyDiv = function () {
        document.getElementById('btn_import_Div').style.display = 'none';//隐藏

        if (document.getElementById('btn_modify_Div').style.display == 'none') {
          document.getElementById('btn_modify_Div').style.display = '';//显示

        } else {
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
        }
      };
      $scope.$on('$ionicView.beforeEnter', function () {
        document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
        document.getElementById('btn_import_Div').style.display = 'none';//隐藏

        AppUtilService.showLoading();

        ForceClientService.getForceClient().apexrest($scope.queryDetail + $stateParams.overviewId, 'GET', {}, null,
          function (response) {
            console.log('success:', response);
            $scope.proceTrucksList = response.Service_Quote__r ? response.Service_Quote__r : [];
            $scope.basicInfo = response;
            $scope.selectedTruckFitItems = _.filter(response.quoteLabourOriginals, function (partItem) {
              return partItem.Material_Type__c == 'Part';
            });
            $scope.serviceQuotes = response.Service_Quote__r ? response.Service_Quote__r : [];
            _.each($scope.selectedTruckFitItems, function (partItem) {
              partItem.type = 'common';
              partItem.Discount__c = (partItem.Discount__c + 100) / 100;
              partItem.parts_number__c = partItem.Material_Number__c;

            });
            $scope.labourQuoteList = _.filter(response.quoteLabourOriginals, function (partItem) {
              return partItem.Material_Type__c == 'Labour';
            });
            _.each($scope.labourQuoteList, function (partItem) {
              partItem.Discount__c = (partItem.Discount__c + 100) / 100;
            });
            $scope.priceDetail = response;

            AppUtilService.hideLoading();

            $scope.sum();

            $scope.calculatePriceConditionPriceAll();
          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();
          });

      });
      $scope.$on('$ionicView.enter', function () {
        console.log('接受点击事件');
        document.addEventListener('click', newHandle);//初始化弹框
        // $scope.get();

      });

      $scope.$on('$ionicView.beforeLeave', function () {
        console.log('移除点击事件');
        document.removeEventListener('click', newHandle);
      });

      var newHandle = function (e) {
        console.log('e.target', e.target);
        console.log('document.getElementById(btn_modify_Btn)', document.getElementById('btn_modify_Btn'));
        if (e.target === document.getElementById('btn_modify_Btn')) {
          $scope.toDisplayModifyDiv();
        } else {
          if (document.getElementById('btn_modify_Div') && document.getElementById('btn_modify_Div').style) {
            document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          }
        }
        if (e.target === document.getElementById('btn_import_Btn')) {
          $scope.toDisplayImportDiv();
        } else {
          if (document.getElementById('btn_import_Div') && document.getElementById('btn_import_Div').style) {
            document.getElementById('btn_import_Div').style.display = 'none';//隐藏
          }
        }
      };

      $scope.toDisBothModifyDiv = function () {
        document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
        document.getElementById('btn_import_Div').style.display = 'none';//隐藏

      };
      $scope.goBack = function () {

        if ($stateParams.orderPageJump) {
          $ionicHistory.goBack();
        } else {
          window.history.back();
        }

      };

      $scope.openSelectPage = function (ele) {
        $scope.toDisBothModifyDiv();
        if (ele === 'selectLSG') {
          $('#selectLSG').css('display', 'block');
          $('#selectTruckFit').css('display', 'none');
          $('#selectCommonPart').css('display', 'none');
          $('#selectCommonPartWithKey').css('display', 'none');
          $scope.getLSG();
        } else if (ele === 'selectCommonPart') {
          $('#selectCommonPart').css('display', 'block');
          $('#selectTruckFit').css('display', 'none');
          $('#selectLSG').css('display', 'none');
          $('#selectCommonPartWithKey').css('display', 'none');
          $scope.getCommonPart();
          // $scope.getLSG();
        } else if (ele === 'addDele') {
          $('#selectCommonPart').css('display', 'none');
          $('#selectTruckFit').css('display', 'block');
          $('#selectLSG').css('display', 'none');
          $('#selectCommonPartWithKey').css('display', 'none');

        } else if (ele === 'addDeleCP') {
          $('#selectCommonPart').css('display', 'none');
          $('#selectCommonPartWithKey').css('display', 'block');
          $('#selectLSG').css('display', 'none');
          $('#selectTruckFit').css('display', 'none');
        }

        $('div.workListDetails_bodyer').animate({
          opacity: '0.6'
        }, 'slow', 'swing', function () {
          $('div.workListDetails_bodyer').hide();
          $('div.newWorkList_truckSelect').animate({
            opacity: '1'
          }, 'normal').show();
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
      $scope.closeSelectPageWithCP = function () {
        $('#selectCommonPart').css('display', 'block');
        $('#selectCommonPartWithKey').css('display', 'none');
        $('#selectLSG').css('display', 'none');
        $('#selectTruckFit').css('display', 'none');
      };
      /**
       *删除数组指定下标或指定对象
       */
      // Array.prototype.remove = function (obj) {
      //   for (var i = 0; i < this.length; i++) {
      //     var temp = this[i];
      //     if (!isNaN(obj)) {
      //       temp = i;
      //     }
      //     if (temp == obj) {
      //       for (var j = i; j < this.length; j++) {
      //         this[j] = this[j + 1];
      //       }
      //       this.length = this.length - 1;
      //     }
      //   }
      // };
      $scope.addDelePartConfirmBtn = function () {//配件添加删除搜索页面 确定按钮
        $scope.closeSelectPage();
        $scope.getTrucksWithSubstitution();
        // if ($scope.contentTruckFitItems.length == 0 && $scope.searchTruckText != null && $scope.searchTruckText != '') {
        //   var onePartOriginals = {};
        //   var priceCondition = {};
        //   onePartOriginals['quantity'] = '';//数量
        //   onePartOriginals['priceCondition'] = priceCondition['price'];//公布价
        //   onePartOriginals['Reserved__c'] = '';//预留
        //   onePartOriginals['parts_number__c'] = $scope.searchTruckText;//物料信息
        //   onePartOriginals['Name'] = $scope.searchTruckText;//Name
        //   onePartOriginals['materialId'] = $scope.searchTruckText;//物料号
        //   onePartOriginals['saveId'] = '';//物料号
        //   onePartOriginals['type'] = '';//配件类型
        //   $scope.selectedTruckFitItems.push(onePartOriginals);
        //   $scope.searchTruckText = '';
        // }
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
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;
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
        setTimeout(function () {
          $scope.calculatePriceConditionPriceAll();
        }, 500);
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
        setTimeout(function () {
          $scope.calculatePriceConditionPriceAll();
        }, 500);
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
          forOrdParts.push(element);
        }
        var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;
        console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

        var truckFitByItems = angular.copy($scope.selectedTruckFitItems);

        console.log('truckFitItems', truckFitByItems);

        $scope.selectedTruckFitItems = [];// 清空列表
        ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
          function (responsePartsRelateds) {
            AppUtilService.hideLoading();
            console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);

            console.log('truckFitItems', truckFitByItems);

            $scope.selectedTruckFitItems = _.filter(truckFitByItems, function (partItem) {
              return partItem.type == 'common';
            });

            for (let i = 0; i < responsePartsRelateds.length; i++) {
              var responsePartsRelatedsList = responsePartsRelateds[i];
              for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                // responsePartsRelatedsList[j]["itemNO"] = j;

                console.log('truckFitItems', truckFitByItems);

                // if (responsePartsRelatedsList[j].type == 'common') {
                //   // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                //
                //   var partsItem = {};
                //   // var responsePartsRelatedsList = responsePartsRelateds[i];
                //   var truckFitItem = responsePartsRelatedsList[j];
                //
                //   partsItem.Name = truckFitItem.parts_number__c;
                //   partsItem.parts_number__c = truckFitItem.parts_number__c;
                //   if (truckFitItem.priceCondition) {
                //     partsItem.Gross_Amount__c = truckFitItem.priceCondition.price;
                //   } else {
                //     partsItem.Gross_Amount__c = '0';
                //   }
                //   partsItem.type = truckFitItem.type;
                //   partsItem.Quantity__c = truckFitItem.quantity;
                //   partsItem.Discount__c = truckFitItem.priceCondition && truckFitItem.priceCondition.discount;
                //   partsItem.Net_Price__c = truckFitItem.priceCondition &&
                // truckFitItem.priceCondition.favourablePrice; partsItem.Net_Amount__c = ''; partsItem.SPN_Price__c =
                // truckFitItem.priceCondition && truckFitItem.priceCondition.spnPrice; partsItem.estimatedDeliveryDate
                // = truckFitItem.inventory && truckFitItem.inventory.estimatedDeliveryDate;
                // $scope.selectedTruckFitItems.push(partsItem);  }

                if (responsePartsRelatedsList[j].type == 'economical') {
                  // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  var partsItem = {};
                  // var responsePartsRelatedsList = responsePartsRelateds[i];
                  var truckFitItem = responsePartsRelatedsList[j];

                  partsItem.Name = truckFitItem.parts_number__c;
                  partsItem.parts_number__c = truckFitItem.parts_number__c;
                  if (truckFitItem.priceCondition) {
                    partsItem.Gross_Price__c = truckFitItem.priceCondition.price;
                  } else {
                    partsItem.Gross_Price__c = '0';
                  }
                  partsItem.type = truckFitItem.type;
                  partsItem.Quantity__c = truckFitItem.quantity;
                  partsItem.Discount__c =
                    truckFitItem.priceCondition && (truckFitItem.priceCondition.discount + 100) / 100;
                  partsItem.Net_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.favourablePrice;
                  partsItem.Net_Amount__c = '';
                  partsItem.SPN_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.spnPrice;
                  partsItem.estimatedDeliveryDate =
                    truckFitItem.inventory && truckFitItem.inventory.estimatedDeliveryDate;

                  $scope.selectedTruckFitItems.push(partsItem);
                }
                if (responsePartsRelatedsList[j].type == 'substitution') {
                  // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  var partsItem = {};
                  // var responsePartsRelatedsList = responsePartsRelateds[i];
                  var truckFitItem = responsePartsRelatedsList[j];

                  partsItem.Name = truckFitItem.parts_number__c;
                  partsItem.parts_number__c = truckFitItem.parts_number__c;
                  if (truckFitItem.priceCondition) {
                    partsItem.Gross_Price__c = truckFitItem.priceCondition.price;
                  } else {
                    partsItem.Gross_Price__c = '0';
                  }
                  partsItem.type = truckFitItem.type;
                  partsItem.Quantity__c = truckFitItem.quantity;
                  partsItem.Discount__c =
                    truckFitItem.priceCondition && (truckFitItem.priceCondition.discount + 100) / 100;
                  partsItem.Net_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.favourablePrice;
                  partsItem.Net_Amount__c = '';
                  partsItem.SPN_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.spnPrice;
                  partsItem.estimatedDeliveryDate =
                    truckFitItem.inventory && truckFitItem.inventory.estimatedDeliveryDate;

                  $scope.selectedTruckFitItems.push(partsItem);
                }
              }
            }
            // _.each(forOrdParts, function (oldItem) { //替换已经编辑过的配件
            //   _.each($scope.selectedTruckFitItems, function (newItem) { //替换已经编辑过的配件
            //     if (oldItem.materialId == newItem.materialId){
            //       _.merge(newItem, oldItem);
            //     }
            //   });
            // });

            $scope.calculatePriceConditionPriceAll();
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
        for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
          if ($scope.selectedTruckFitItems[i].type == 'common') {
            parts_number__cList.push($scope.selectedTruckFitItems[i].parts_number__c);
            partsQuantitys.push(1);//默认库存
          }
        }
        var truckFitItems = angular.copy($scope.selectedTruckFitItems);

        console.log('truckFitItems', truckFitItems);

        $scope.selectedTruckFitItems = [];
        var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;
        console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

        ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
          function (responsePartsRelateds) {
            AppUtilService.hideLoading();
            console.log('truckFitItems', truckFitItems);

            $scope.selectedTruckFitItems = _.filter(truckFitItems, function (partItem) {
              return partItem.type == 'common';
            });

            for (let i = 0; i < responsePartsRelateds.length; i++) {
              var responsePartsRelatedsList = responsePartsRelateds[i];
              for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                // responsePartsRelatedsList[j]["itemNO"] = j;
                // if (responsePartsRelatedsList[j].type == 'common') {
                //   // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                //   var partsItem = {};
                //   // var responsePartsRelatedsList = responsePartsRelateds[i];
                //   var truckFitItem = responsePartsRelatedsList[j];
                //
                //   partsItem.Name = truckFitItem.parts_number__c;
                //   partsItem.parts_number__c = truckFitItem.parts_number__c;
                //   if (truckFitItem.priceCondition) {
                //     partsItem.Gross_Amount__c = truckFitItem.priceCondition.price;
                //   } else {
                //     partsItem.Gross_Amount__c = '0';
                //   }
                //   partsItem.type = truckFitItem.type;
                //   partsItem.Quantity__c = truckFitItem.quantity;
                //   partsItem.Discount__c = truckFitItem.priceCondition && truckFitItem.priceCondition.discount;
                //   partsItem.Net_Price__c = truckFitItem.priceCondition &&
                // truckFitItem.priceCondition.favourablePrice; partsItem.Net_Amount__c = ''; partsItem.SPN_Price__c =
                // truckFitItem.priceCondition && truckFitItem.priceCondition.spnPrice; partsItem.estimatedDeliveryDate
                // = truckFitItem.inventory && truckFitItem.inventory.estimatedDeliveryDate;
                // $scope.selectedTruckFitItems.push(partsItem); }

                if (responsePartsRelatedsList[j].type == 'substitution') {
                  // $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  var partsItem = {};
                  // var responsePartsRelatedsList = responsePartsRelateds[i];
                  var truckFitItem = responsePartsRelatedsList[j];

                  partsItem.Name = truckFitItem.Name;
                  partsItem.parts_number__c = truckFitItem.parts_number__c;
                  if (truckFitItem.priceCondition) {
                    partsItem.Gross_Price__c = truckFitItem.priceCondition.price;
                  } else {
                    partsItem.Gross_Price__c = '';
                  }
                  partsItem.type = truckFitItem.type;
                  partsItem.Quantity__c = truckFitItem.quantity;
                  partsItem.Discount__c =
                    truckFitItem.priceCondition && (truckFitItem.priceCondition.discount + 100) / 100;
                  partsItem.Net_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.favourablePrice;
                  partsItem.Net_Amount__c = '';
                  partsItem.SPN_Price__c = truckFitItem.priceCondition && truckFitItem.priceCondition.spnPrice;
                  partsItem.estimatedDeliveryDate =
                    truckFitItem.inventory && truckFitItem.inventory.estimatedDeliveryDate;

                  $scope.selectedTruckFitItems.push(partsItem);
                }
              }
            }
            $scope.calculatePriceConditionPriceAll();
          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();

          });

      };
      $scope.calculatePriceConditionPriceAll = function () {
        //计算合计
        $scope.priceConditionPriceAll = 0;
        for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
          $scope.priceConditionPriceAll =
            Number($scope.selectedTruckFitItems[i].Discount__c) * Number($scope.selectedTruckFitItems[i].Gross_Price__c)
            * Number($scope.selectedTruckFitItems[i].Quantity__c) + $scope.priceConditionPriceAll;
        }
        console.log('calculatePriceConditionPriceAll:', $scope.priceConditionPriceAll);
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
      //经济件 替代件 常规件
      $scope.isquoted_Table = function (type) {
        //   console.log("type:", type);
        var returnType = 'sv_Td';
        if (type === 'economical') {
          returnType = 'sv_Td green_type';
        } else if (type === 'substitution') {
          returnType = 'sv_Td blue_type';
        } else if (type === 'common') {
          returnType = 'sv_Td';
        }
        return returnType;
      };
      $scope.changeTruckTab = function (index) {
        console.log('changeTruckTab:::', $('#selectTruckFit_result'));
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
      $scope.checkSearchResults = function (ele) {
        let element = $('input.ckbox_truck_searchresult_itemFit[data-recordid*=\'' + ele.Id + '\']');
        console.log('checkSearchResults::', element);

        var partsItem = {};
        if (element != null && element.length > 0) {
          if (element[0].checked) {
            let existFlag = false;
            for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
              if (ele.Id == $scope.selectedTruckFitItems[i].Id) {
                existFlag = true;
              }
            }
            if (!existFlag) {

              partsItem.Name = ele.Name;
              partsItem.parts_number__c = ele.parts_number__c;
              if (ele.priceCondition) {
                partsItem.Gross_Price__c = ele.priceCondition.price;
              } else {
                partsItem.Gross_Price__c = '';
              }
              partsItem.type = ele.type;
              partsItem.Quantity__c = ele.quantity;
              partsItem.Discount__c = ele.priceCondition && (ele.priceCondition.discount + 100) / 100;
              partsItem.Net_Price__c = ele.priceCondition && ele.priceCondition.favourablePrice;
              partsItem.Net_Amount__c = '';
              partsItem.SPN_Price__c = ele.priceCondition && ele.priceCondition.spnPrice;
              partsItem.estimatedDeliveryDate = ele.inventory && ele.inventory.estimatedDeliveryDate;

              $scope.selectedTruckFitItems.push(partsItem);
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

      $scope.toAddSVView = function () {
        var serviceFeeName = $('#serviceFeeName').val();
        if (serviceFeeName == '') {
          var ionPop = $ionicPopup.alert({
            title: '请填写劳务项目'
          });
          return;
        }
        $scope.serviceFeeList.push(serviceFeeName);
        $('#serviceFeeName').val('');
      };
      Array.prototype.baoremove = function (dx) {
        if (isNaN(dx) || dx > this.length) { return false; }
        this.splice(dx, 1);
      };

      $scope.toDelSVView = function (index) {
        $scope.serviceFeeList.baoremove(index);
        $('input.sv_InputForListSpecial').each(function (indexSub, element) {
          if (indexSub == index) {
            element.value = 0;
          }
        });

        $scope.sum();

      };

      $scope.sum = function (obj) {
        $scope.serviceFeeListP3 = 0;
        // $('input.sv_Input_Net_Amount').each(function (index, element) {
        //   $scope.serviceFeeListP3 = Number(element.value) +Number($scope.serviceFeeListP3);
        // });
        $('input.sv_InputForListSpecial').each(function (index, element) {
          $scope.serviceFeeListP3 = Number(element.value) + Number($scope.serviceFeeListP3);
        });

        $scope.serviceFeeListP3 = _.isNaN($scope.serviceFeeListP3) ? 0 : $scope.serviceFeeListP3;
        $scope.serviceFeeListP4 = 0;
        _.forEach($scope.labourQuoteList, function (item) {
          $scope.serviceFeeListP4 = Number(item.Quantity__c) * Number(item.Net_Price__c) + $scope.serviceFeeListP4;
        });

      };

      //组装劳务费 配件列表
      $scope.addLabourOriginalsList = function (obj) {
        // var oneLabourOriginals1 = {};
        // oneLabourOriginals1['Service_Quote__c'] = manMadeNo1Id;
        // oneLabourOriginals1['Name'] = manMadeNo1Name;
        // oneLabourOriginals1['Gross_Amount__c'] = $scope.manMadePrice1;
        // oneLabourOriginals1['Quantity__c'] = $scope.manMadeNo1;
        // oneLabourOriginals1['Discount__c'] = $scope.discountPrice1;
        // oneLabourOriginals1['Material_Type__c'] = 'Labour';
        // oneLabourOriginals1['Material_Number__c'] = '7990110000';
        // // oneLabourOriginals1["Net_Amount__c"] = $scope.discountPrice1; //优惠总价
        // $scope.quoteLabourOriginalsList.push(oneLabourOriginals1);
        // var oneLabourOriginals2 = {};
        // oneLabourOriginals2['Service_Quote__c'] = manMadeNo2Id;
        // oneLabourOriginals2['Name'] = manMadeNo2Name;
        // oneLabourOriginals1['Gross_Amount__c'] = $scope.manMadePrice2;
        // oneLabourOriginals2['Quantity__c'] = $scope.manMadeNo2;
        // oneLabourOriginals2['Discount__c'] = $scope.discountPrice2;
        // oneLabourOriginals2['Material_Type__c'] = 'Labour';
        // oneLabourOriginals2['Material_Number__c'] = '7990110003';
        // $scope.quoteLabourOriginalsList.push(oneLabourOriginals2);
        // var serviceQuotes = [];//车辆
        // var quoteLabourOriginals = [];//劳务费
        // for (let index = 0; index < $stateParams.SendAllUser.length; index++) {
        //   const element = $stateParams.SendAllUser[index];
        //   delete element.levels;
        //   delete element.descriptions;
        //   delete element.Id;
        //   delete element.Name;
        // }

        $scope.quoteLabourOriginalsList = [];

        var sv_Input_PriceList = [];//单价
        var sv_Input_NumberList = [];//数量
        var sv_Input_DiscountList = [];//折扣
        var sv_Input_Amount = [];//总价
        var sv_Input_Net_Amount = [];//总价

        $('input.sv_Input_Price').each(function (index, element) {
          sv_Input_PriceList.push(element.value);
        });
        $('input.sv_Input_Number').each(function (index, element) {
          sv_Input_NumberList.push(element.value);
        });
        $('input.sv_Input_Discount').each(function (index, element) {
          sv_Input_DiscountList.push(element.value);
        });
        $('input.sv_Input_Amount').each(function (index, element) {
          sv_Input_Amount.push(element.value);
        });
        $('input.sv_Input_Net_Amount').each(function (index, element) {
          sv_Input_Net_Amount.push(element.value);
        });

        for (let index = 0; index < $scope.labourQuoteList.length; index++) {
          var oneLabourOriginals3 = angular.copy($scope.labourQuoteList[index]);
          console.log('$scope.labourQuoteList', $scope.labourQuoteList[index]);
          oneLabourOriginals3['Gross_Price__c'] = sv_Input_PriceList[index];
          oneLabourOriginals3['Gross_Amount__c'] =
            Number(sv_Input_PriceList[index]) * Number(sv_Input_NumberList[index]);
          oneLabourOriginals3['Net_Amount__c'] = sv_Input_Net_Amount[index];
          oneLabourOriginals3['Net_Price__c'] =
            Number(sv_Input_PriceList[index]) * Number(sv_Input_DiscountList[index]);
          oneLabourOriginals3['Quantity__c'] = sv_Input_NumberList[index];
          oneLabourOriginals3['Discount__c'] = (Number(sv_Input_DiscountList[index]) * 100) - 100;
          oneLabourOriginals3['Line_Item__c'] = index;
          $scope.quoteLabourOriginalsList.push(oneLabourOriginals3);
        }
        var sv_InputForListPrice = [];//单价
        var sv_InputForListNo = [];//数量
        var sv_InputForListDiscount = [];//折扣
        var sv_InputForListSpecial = [];//优惠总价
        $('input.sv_InputForListPrice').each(function (index, element) {
          sv_InputForListPrice.push(element.value);
          // console.log('sv_InputForListPrice:::',element.value+"  index"+index);
        });
        $('input.sv_InputForListNo').each(function (index, element) {
          sv_InputForListNo.push(element.value);
          // console.log('sv_InputForListNo:::',element.value+"  index"+index);
        });
        $('input.sv_InputForListDiscount').each(function (index, element) {
          sv_InputForListDiscount.push(element.value);
          // console.log('sv_InputForListDiscount:::',element.value+"  index"+index);
        });
        $('input.sv_InputForListSpecial').each(function (index, element) {
          sv_InputForListSpecial.push(element.value);
          // console.log('sv_InputForListSpecial:::',element.value+"  index"+index);
        });

        for (let index = 0; index < $scope.serviceFeeList.length; index++) {
          var oneLabourOriginals3 = {};
          oneLabourOriginals3['Name'] = $scope.serviceFeeList[index];
          oneLabourOriginals3['Gross_Price__c'] = sv_InputForListPrice[index];
          oneLabourOriginals3['Quantity__c'] = sv_InputForListNo[index];
          oneLabourOriginals3['Discount__c'] = (Number(sv_InputForListDiscount[index]) * 100) - 100;
          oneLabourOriginals3['Net_Amount__c'] =
            _.isNaN(sv_InputForListSpecial[index]) ? sv_InputForListSpecial[index] : '0';
          oneLabourOriginals3['Net_Price__c'] =
            Number(sv_InputForListPrice[index]) * Number(sv_InputForListDiscount[index]);
          oneLabourOriginals3['Material_Type__c'] = 'Labour';
          oneLabourOriginals3['Line_Item__c'] = $scope.labourQuoteList.length + index;
          oneLabourOriginals3['Material_Number__c'] = $scope.labourQuoteList.length + index;
          $scope.quoteLabourOriginalsList.push(oneLabourOriginals3);
        }

        //配件
        var part_InputForListPrice = [];//优惠单价
        var part_InputForListNo = [];//数量
        var part_InputForListDiscount = [];//折扣
        var part_InputForListChecked = [];//预留状态
        var part_InputForListSpecialList = [];//总价

        $('input.part_InputForListPrice').each(function (index, element) {
          part_InputForListPrice.push(element.value);
          // console.log('sv_InputForListPrice:::',element.value+"  index"+index);
        });
        $('input.part_InputForListNo').each(function (index, element) {
          part_InputForListNo.push(element.value);
          // console.log('sv_InputForListNo:::',element.value+"  index"+index);
        });
        $('input.part_InputForListDiscount').each(function (index, element) {
          part_InputForListDiscount.push(element.value);
          // console.log('sv_InputForListDiscount:::',element.value+"  index"+index);
        });
        $('input.part_InputForListSpecial').each(function (index, element) {
          part_InputForListSpecialList.push(element.value);
        });
        $('input.ckbox_part').each(function (index, element) {
          part_InputForListChecked.push(element.checked);
        });
        for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {

          var oneLabourOriginals4 = {};
          var selectedTruckFitItemsIndex = $scope.selectedTruckFitItems[index];
          oneLabourOriginals4['Name'] = selectedTruckFitItemsIndex.Name;
          if (selectedTruckFitItemsIndex.Id) {
            oneLabourOriginals4['Id'] = selectedTruckFitItemsIndex.Id;
          }

          oneLabourOriginals4['Line_Item__c'] = index + 100;
          oneLabourOriginals4['Material_Number__c'] = selectedTruckFitItemsIndex.parts_number__c;
          oneLabourOriginals4['Gross_Price__c'] = selectedTruckFitItemsIndex.Gross_Price__c;
          oneLabourOriginals4['Gross_Amount__c'] =
            selectedTruckFitItemsIndex.Gross_Price__c * selectedTruckFitItemsIndex.Quantity__c;
          oneLabourOriginals4['Quantity__c'] = selectedTruckFitItemsIndex.Quantity__c;
          oneLabourOriginals4['Net_Price__c'] = part_InputForListPrice[index];//优惠单价
          oneLabourOriginals4['Discount__c'] = (Number(part_InputForListDiscount[index]) * 100) - 100;
          oneLabourOriginals4['Reserved__c'] = part_InputForListChecked[index];//预留
          oneLabourOriginals4['Net_Amount__c'] = part_InputForListSpecialList[index];//优惠总价
          oneLabourOriginals4['Material_Type__c'] = 'Part';
          $scope.quoteLabourOriginalsList.push(oneLabourOriginals4);
        }
      };
      //保存
      $scope.toSaveServiceQuoteOverview = function (payload) {
        AppUtilService.showLoading();
        $scope.addLabourOriginalsList();//组织劳务费数据
        var serviceQuoteOverview = {};
        serviceQuoteOverview['Ship_to__c'] = $scope.basicInfo.Ship_To__c;
        serviceQuoteOverview['Id'] = $scope.basicInfo.Id;

        let truckFitItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
          return part.Material_Type__c == 'Part';
        });
        let labourItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
          return part.Material_Type__c == 'Labour';
        });

        serviceQuoteOverview['Total_Gross__c'] = _.sum(_.map($scope.quoteLabourOriginalsList, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Total_Net__c'] = _.sum(_.map($scope.quoteLabourOriginalsList, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));
        serviceQuoteOverview['Part_Sub_Total_Gross__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Part_Discount__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Discount__c) ? 0 : Number(item.Discount__c);
        })) / truckFitItems.length;
        serviceQuoteOverview['Part_Sub_Total_Net__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));
        serviceQuoteOverview['Labour_Sub_Total_Gross__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Labour_Discount__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Discount__c) ? 0 : Number(item.Discount__c);
        })) / labourItems.length;
        serviceQuoteOverview['Labour_Sub_Total_Net__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));

        var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                      + '&serviceQuotes=' + JSON.stringify($scope.serviceQuotes) + '&quoteLabourOriginals='
                      + JSON.stringify($scope.quoteLabourOriginalsList);
        console.log('payload', payload);

        ForceClientService.getForceClient().apexrest(payload, 'PUT', {}, null, function (response) {
          AppUtilService.hideLoading();
          console.log('POST_success:', response);
          var ionPop = $ionicPopup.alert({
            title: '保存成功'
          });
          ionPop.then(function (res) {
            $scope.goBack();
          });
        }, function (error) {
          console.log('POST_error:', error);
          AppUtilService.hideLoading();
          var ionPop = $ionicPopup.alert({
            title: '保存失败'
          });
        });
      };

      //提交审核
      $scope.toSubmitCheckFunction = function (sendId) {
        var listForrequests = [];
        var payload1 = {};
        payload1['actionType'] = 'Submit';
        payload1['contextId'] = sendId;
        payload1['comments'] = 'comments';
        listForrequests.push(payload1);
        var requests = {};
        requests['requests'] = listForrequests;

        // path, callback, error, method, payload, headerParams
        ForceClientService.getForceClient().ajax($scope.paramApprovalsUrl, function (response) {
          AppUtilService.hideLoading();
          console.log('toSubmitCheckFunction_success:', response);
          var ionPop = $ionicPopup.alert({
            title: '提交成功'
          });
          ionPop.then(function (res) {
            $scope.goBack();
          });
        }, function (error) {
          console.log('toSubmitCheckFunction_error:', error);
          AppUtilService.hideLoading();
          var ionPop = $ionicPopup.alert({
            title: '提交失败'
          });
        }, 'POST', JSON.stringify(requests), null);
        console.log('toSubmitCheckFunction_payload', requests);

      };

      $scope.toSubmitCheck = function () {
        AppUtilService.showLoading();
        $scope.addLabourOriginalsList();//组织劳务费数据
        var serviceQuoteOverview = {};
        serviceQuoteOverview['Ship_to__c'] = $scope.basicInfo.Ship_To__c;
        serviceQuoteOverview['Id'] = $scope.basicInfo.Id;

        let truckFitItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
          return part.Material_Type__c == 'Part';
        });
        let labourItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
          return part.Material_Type__c == 'Labour';
        });

        serviceQuoteOverview['Total_Gross__c'] = _.sum(_.map($scope.quoteLabourOriginalsList, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Total_Net__c'] = _.sum(_.map($scope.quoteLabourOriginalsList, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));
        serviceQuoteOverview['Part_Sub_Total_Gross__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Part_Discount__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Discount__c) ? 0 : Number(item.Discount__c);
        })) / truckFitItems.length;
        serviceQuoteOverview['Part_Sub_Total_Net__c'] = _.sum(_.map(truckFitItems, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));
        serviceQuoteOverview['Labour_Sub_Total_Gross__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Gross_Amount__c) ? 0 : Number(item.Gross_Amount__c);
        }));
        serviceQuoteOverview['Labour_Discount__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Discount__c) ? 0 : Number(item.Discount__c);
        })) / labourItems.length;
        serviceQuoteOverview['Labour_Sub_Total_Net__c'] = _.sum(_.map(labourItems, function (item) {
          return _.isNaN(item.Net_Amount__c) ? 0 : Number(item.Net_Amount__c);
        }));

        var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                      + '&serviceQuotes=' + JSON.stringify($scope.serviceQuotes) + '&quoteLabourOriginals='
                      + JSON.stringify($scope.quoteLabourOriginalsList);
        console.log('payload', payload);

        ForceClientService.getForceClient().apexrest(payload, 'PUT', {}, null, function (response) {
          console.log('POST_success:', response);
          $scope.toSubmitCheckFunction(response.serviceQuoteOverview.Id);//提交审核接口

        }, function (error) {
          console.log('POST_error:', error);
          AppUtilService.hideLoading();
          var ionPop = $ionicPopup.alert({
            title: '保存失败'
          });
        });

      };

      $scope.toDownloadEexFile = function () {

        AppUtilService.showLoading();
        $scope.addLabourOriginalsList();//组织劳务费数据
        var serviceQuoteOverview = {};
        // serviceQuoteOverview['Ship_to__c'] = $stateParams.SendSoupEntryId;
        serviceQuoteOverview['Ship_to__c'] = $scope.basicInfo.Ship_To__c;
        serviceQuoteOverview['Id'] = $scope.basicInfo.Id;

        var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                      + '&serviceQuotes=' + JSON.stringify($scope.serviceQuotes) + '&quoteLabourOriginals='
                      + JSON.stringify($scope.quoteLabourOriginalsList);
        console.log('payload', payload);

        ForceClientService.getForceClient().apexrest(payload, 'PUT', {}, null, function (response) {
          console.log('POST_success:', response);
          //下载excel接口
          var serviceQuoteOverviewId = {};
          serviceQuoteOverviewId['serviceQuoteOverviewId'] = response.serviceQuoteOverview.Id;
          var excelTemplateCode = {};
          excelTemplateCode['excelTemplateCode'] = '1';
          // var payload = $scope.paramExeclUrl + serviceQuoteOverviewId + "/" + excelTemplateCode;
          var payload = $scope.paramExeclUrl + response.serviceQuoteOverview.Id + '/1';

          ForceClientService.getForceClient().apexrest(payload, 'GET', {}, null, function (response_exc) {
            console.log('Execl_success:', response_exc);
            $scope.toPrintDownLoad(response_exc.base64, response_exc.filename);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '保存成功'
            });
          }, function (error) {
            console.log('Execl_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '保存失败'
            });
          });

        }, function (error) {
          console.log('POST_error:', error);
          AppUtilService.hideLoading();
          var ionPop = $ionicPopup.alert({
            title: '保存失败'
          });
        });
      };

      function base64toBlob(base64Data, contentType) {
        contentType = contentType || '';
        let sliceSize = 1024;
        let byteCharacters = atob(base64Data);
        let bytesLength = byteCharacters.length;
        let slicesCount = Math.ceil(bytesLength / sliceSize);
        let byteArrays = new Array(slicesCount);
        for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
          let begin = sliceIndex * sliceSize;
          let end = Math.min(begin + sliceSize, bytesLength);

          let bytes = new Array(end - begin);
          for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
          }
          byteArrays[sliceIndex] = new Uint8Array(bytes);
        }
        return new Blob(byteArrays, {type: contentType});
      }

      //写入文件
      var writeFile = function (fileEntry, dataObj) {
        fileEntry.createWriter(function (fileWriter) {
          //写入结束
          fileWriter.onwriteend = function () {
            console.log('写入文件成功');
            //读取内容
            //  readFile(fileEntry);
          };
          fileWriter.onerror = function (e) {
            console.log('写入文件失败:' + e.toString());
          };
          // if (!dataObj) {
          //     dataObj = new Blob([dataObj], { type:
          // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, base64' }); }
          let blob = new Blob(
            [base64toBlob(dataObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')], {});

          fileWriter.write(blob);

        });
      };

      $scope.toPrintDownLoad = function (base64, filename) {

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 1024 * 1024, function (fs) {
          console.log('file system open:' + fs.name);
          console.info(fs);
          fs.root.getFile(filename, {
            create: true,
            exclusive: false
          }, function (fileEntity) {
            console.info(fileEntity);
            console.log('文件地址：' + fileEntity.toURL()); //file:///data/data/io.cordova.myapp84ea27/files/files/test1.txt
            writeFile(fileEntity, base64);
          });
        });
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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;
        console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);
        ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
          function (responsePartsRelateds) {
            AppUtilService.hideLoading();
            console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);
            var rebuildListForLSG = [];
            for (let i = 0; i < responsePartsRelateds.length; i++) {
              var responsePartsRelatedsList = responsePartsRelateds[i];
              for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                responsePartsRelatedsList[j]['itemNO'] = j;
                rebuildListForLSG.push(responsePartsRelatedsList[j]);
              }
            }

            for (let i = 0; i < rebuildListForLSG.length; i++) {
              if (rebuildListForLSG[i].priceCondition) {
                rebuildListForLSG[i].priceCondition.discount = -rebuildListForLSG[i].priceCondition.discount / 100;
              }
              $scope.selectedTruckFitItems.push(rebuildListForLSG[i]);
            }
            $scope.closeSelectPage();

          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();

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
                                  + JSON.stringify(partsQuantitys) + '&accountId=' + $scope.basicInfo.Ship_To__c;

        ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
          function (responsePartsRelateds) {
            AppUtilService.hideLoading();

            for (let i = 0; i < responsePartsRelateds.length; i++) {
              var partsItem = {};
              var responsePartsRelatedsList = responsePartsRelateds[i];
              var truckFitItem = responsePartsRelatedsList[0];

              partsItem.Name = truckFitItem.Name;
              partsItem.parts_number__c = truckFitItem.parts_number__c;
              if (truckFitItem.priceCondition) {
                partsItem.Gross_Price__c = truckFitItem.priceCondition.price;
                partsItem.Discount__c = -truckFitItem.priceCondition.discount / 100;
              } else {
                partsItem.Gross_Price__c = '0';
                partsItem.Discount__c = '0';
              }
              partsItem.type = truckFitItem.type;
              partsItem.Gross_Amount__c = '';
              partsItem.Quantity__c = '';
              partsItem.Net_Price__c = '';
              partsItem.Net_Amount__c = '';
              partsItem.SPN_Price__c = '';

              $scope.selectedTruckFitItems.push(partsItem);
            }

            $scope.getTrucksWithSubstitution();
          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();

          });

      };

      <!--常用配件筛选-->
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

      function isSuccess(strValue)  {
        var objRegExp =  /^[a-zA-Z0-9]{18}$/;
        return  objRegExp.test(strValue);
      }

      $scope.getStatusType = function (status) {
        if (status == 'Draft') {
          return '草稿';
        } else if (status == 'Waiting For Approval') {
          return '等待审批';
        } else if (status == 'Reject') {
          return '拒绝';
        } else if (status == 'Waiting For Customer') {
          return '等待客户确认';
        } else if (status == 'Win') {
          return '赢单';
        } else if (status == 'Lost') {
          return '丢单';
        } else if (status == 'Closed') {
          return '关闭';
        } else {
          return '等待审批';
        }
      };

      $scope.isReserve = function (item) {
        return Boolean(item.Reserved__c);
      };

      $scope.toDescribInfDiv = function () {
        if (document.getElementById('describInfDiv').style.display == 'none') {
          document.getElementById('describInfDiv').style.display = '';//显示
        } else {
          document.getElementById('describInfDiv').style.display = 'none';//隐藏
        }
      };
      $scope.goWorkDetails = function () {

        AppUtilService.showLoading();
        ForceClientService.getForceClient().apexrest(
          $scope.convertQuoteToOrder + $scope.basicInfo.Id,
          'PUT',
          {},
          null,
          function callBack(workOrderId) {
            AppUtilService.hideLoading();
            if (isSuccess(workOrderId)) {
              Service1Service.getOwnerForServiceOrder(workOrderId, true).then(
                function (res) {
                  console.log('getOwnerForServiceOrder::', res);
                  console.log('oCurrentUser::', oCurrentUser);
                  if (res.Service_Order_Owner__c === oCurrentUser.Id) {
                    $state.go('app.workDetails', {
                      SendInfo: workOrderId,
                      workDescription: null,
                      AccountShipToC: null,
                      workOrderId: workOrderId,
                      enableArrivalBtn: null,
                      goOffTime: null,
                      isNewWorkList: true,
                      accountId: null,
                      orderBelong: true
                    });
                  } else {
                    $state.go('app.workDetails', {
                      SendInfo: workOrderId,
                      workDescription: null,
                      AccountShipToC: null,
                      workOrderId: workOrderId,
                      enableArrivalBtn: null,
                      goOffTime: null,
                      isNewWorkList: true,
                      accountId: null,
                      orderBelong: true
                    });
                  }
                }, function (err) {
                  console.log('getOwnerForServiceOrder::', err);
                  $state.go('app.workDetails', {
                    SendInfo: workOrderId,
                    workDescription: null,
                    AccountShipToC: null,
                    workOrderId: workOrderId,
                    enableArrivalBtn: null,
                    goOffTime: null,
                    isNewWorkList: true,
                    accountId: null,
                    orderBelong: null
                  });
                });
            } else {
              $ionicPopup.alert({
                title:workOrderId
              });
            }
          }, function error(msg) {
            AppUtilService.hideLoading();
            console.log(msg);
            $ionicPopup.alert({
              title:msg.toString()
            });
          }
        );

      };

    });

