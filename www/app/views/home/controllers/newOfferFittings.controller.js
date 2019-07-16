(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('NewOfferFittingsController',
      function ($scope, $http, $ionicPopup, $stateParams, $ionicHistory, $state, AppUtilService, $rootScope,
                ForceClientService, LocalCacheService) {

        // var forceClient = ForceClientService.getForceClient();
        // console.log("forceClient", forceClient);
        var oCurrentUser = LocalCacheService.get('currentUser') || {};
        var replaceName = '\\"';
        $scope.contentTruckFitItems = [];//配件
        $scope.selectedTruckFitItems = [];
        $scope.contentTruckParts = [];
        $scope.contentTruckItems = [];
        $scope.serviceFeeList = [];
        $scope.quoteLabourOriginalsList = [];
        $scope.searchTruckPartText = '';
        $scope.manMadeNo1 = 0;
        $scope.manMadeNo2 = 0;
        $scope.manMadeNo3 = 0;
        $scope.unitPrice1 = 0;
        $scope.unitPrice2 = 0;
        $scope.unitPrice3 = 0;
        $scope.manMadePrice3 = 0;
        $scope.discountPrice3 = 0;
        $scope.priceConditionPriceAll = 0;
        $scope.serviceFeeListP3 = 0;
        var manMadeNo1Id;
        var manMadeNo2Id;
        var manMadeNo1Name;
        var manMadeNo2Name;
        $scope.contentLSGs = [];//LSG
        $scope.paramUrl1 = '/Parts?materialNumber=7990110000&accountId=' + $stateParams.SendSoupEntryId;
        $scope.paramUrl2 = '/Parts?materialNumber=7990110003&accountId=' + $stateParams.SendSoupEntryId;
        $scope.getMaintenanceKeyLevelPartssBy2Url = '/MaintenanceKeyLevelParts?names=';
        $scope.paramSaveUrl = '/ServiceQuoteOverview?';
        $scope.paramApprovalsUrl = '/v38.0/process/approvals';
        $scope.paramExeclUrl = '/excel/';
        $scope.searchPartssUrl = '/Partss?keyword=';
        $scope.partsRelatedsUrl = '/PartsRelateds?partsNumbers=';
        $scope.partLSGServer = '/LSGServer';
        $scope.getPersonalPartListService = '/PersonalPartListService?action=getParts&userId=';
        $scope.getPartsWithKeyWord = '/PersonalPartListService?action=getPartsWithKeyWord&userId=';

        $scope.get = function () {

          AppUtilService.showLoading();
          //人工
          ForceClientService.getForceClient().apexrest($scope.paramUrl1, 'GET', {}, null, function (response) {
            console.log('success:', response);

            let responseItem = response.priceCondition;
            if (responseItem) {
              $scope.manMadePrice1 = responseItem.price;
              $scope.discountPrice1 = (responseItem.discount + 100) / 100;
              $scope.unitPrice1 = $scope.manMadePrice1 * $scope.discountPrice1;
            }
            manMadeNo1Id = response.Id;
            manMadeNo1Name = response.Name;

            //交通
            ForceClientService.getForceClient().apexrest($scope.paramUrl2, 'GET', {}, null, function (response) {
              console.log('success:', response);
              AppUtilService.hideLoading();
              let responseItem = response.priceCondition;
              if (responseItem) {
                $scope.manMadePrice2 = responseItem.price;
                $scope.discountPrice2 = (responseItem.discount + 100) / 100;
                $scope.unitPrice2 = $scope.manMadePrice2 * $scope.discountPrice2;
              }
              manMadeNo2Id = response.Id;
              manMadeNo2Name = response.Name;

              //获得车辆保养级别对应的配件
              if ($stateParams.SendAllUser) {
                if ($stateParams.SendAllUser.length == 0) { //如果没有选择车辆的处理
                  var serviceQuotesNull = {};
                  serviceQuotesNull['Truck_Fleet__c'] = null;
                  $stateParams.SendAllUser.push(serviceQuotesNull);
                } else {
                  $scope.getByPart();
                }
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

        $scope.getByPart = function () {
          //保养级别带出的配件信息
          AppUtilService.showLoading();

          var nameList = [];
          var maintenanceLevelList = [];

          angular.forEach($stateParams.SendAllUser, function (truckItem) {
            if (truckItem.Maintenance_Level__c) {
              nameList.push(truckItem.levelNames[truckItem.Maintenance_Level__c]);
              maintenanceLevelList.push(truckItem.Maintenance_Level__c);
            }
            truckItem.levelNames = '';//清空levelNames字段防止接口报错
          });
          if (maintenanceLevelList.length == 0 || $stateParams.SendAllUser[0].Service_Type__c != 'Maintenance') {
            AppUtilService.hideLoading();
            return;
          }
          var maintenanceKeyLevelPartssBy2Url = $scope.getMaintenanceKeyLevelPartssBy2Url + JSON.stringify(nameList)
                                                + '&maintenanceLevels=' + JSON.stringify(maintenanceLevelList)
                                                + '&acctId=' + $stateParams.SendSoupEntryId;
          ForceClientService.getForceClient().apexrest(maintenanceKeyLevelPartssBy2Url, 'GET', {}, null,
            function (response) {
              console.log('getMaintenanceKeyLevelPartssBy2:', response);
              let parts_number__cList = [];
              let partsQuantitys = [];
              angular.forEach(response, function (truckItem) {
                parts_number__cList.push(truckItem.Part_Number__c);
                partsQuantitys.push(1);//默认库存
              });

              var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList)
                                        + '&partsQuantitys='
                                        + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;

              ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
                function (responsePartsRelateds) {
                  for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    if (responsePartsRelatedsList[0].priceCondition) {
                      responsePartsRelatedsList[0].priceCondition.discount =
                        (responsePartsRelatedsList[0].priceCondition.discount + 100) / 100;
                    }
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[0]);
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
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();

              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                if (responsePartsRelatedsList[0].priceCondition) {
                  responsePartsRelatedsList[0].priceCondition.discount =
                    (responsePartsRelatedsList[0].priceCondition.discount + 100) / 100;
                }
                $scope.selectedTruckFitItems.push(responsePartsRelatedsList[0]);
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
        $scope.isRentalInfo=false;
        $scope.$on('$ionicView.beforeEnter', function () {
          if($stateParams.Division__c==="30"){
              $scope.isRentalInfo=true;
          }
          document.getElementById('btn_modify_Div').style.display = 'none';//隐藏
          document.getElementById('btn_import_Div').style.display = 'none';//隐藏

        });
        $scope.$on('$ionicView.enter', function () {
          console.log('接受点击事件');
          document.addEventListener('click', newHandle);//初始化弹框
          $scope.get();

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
          $ionicHistory.goBack();
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

        $scope.addDelePartConfirmBtn = function () {//配件添加删除搜索页面 确定按钮
          $scope.closeSelectPage();
          $scope.getTrucksWithSubstitution();
          // if ($scope.contentTruckFitItems.length == 0 && $scope.searchTruckText != null && $scope.searchTruckText !=
          // "") { var onePartOriginals = {}; var priceCondition = {}; onePartOriginals['quantity'] = '';//数量
          // onePartOriginals['priceCondition'] = priceCondition['price'];//公布价 onePartOriginals['Reserved__c'] =
          // '';//预留 onePartOriginals['parts_number__c'] = $scope.searchTruckText;//物料信息 onePartOriginals['Name'] =
          // $scope.searchTruckText;//Name onePartOriginals['materialId'] = $scope.searchTruckText;//物料号
          // onePartOriginals['saveId'] = '';//物料号 onePartOriginals['type'] = '';//配件类型
          // $scope.selectedTruckFitItems.push(onePartOriginals); $scope.searchTruckText = ''; }
        };
        //搜索配件
        $scope.getTrucks = function (keyWord) {
          AppUtilService.showLoading();
          $scope.contentTruckFitItems = [];
          console.log('getTrucks::', keyWord);
          let parts_number__cList = [];
          let partsQuantitys = [];
          var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord + '&accId=' + $stateParams.SendSoupEntryId;
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
                                        + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;
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
            if (element.edit) {
              forOrdParts.push(element);
            }
          }
          var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;
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
                    if (responsePartsRelatedsList[j].priceCondition) {
                      responsePartsRelatedsList[j].priceCondition.discount =
                        (responsePartsRelatedsList[j].priceCondition.discount + 100) / 100;
                    }
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'economical') {
                    if (responsePartsRelatedsList[j].priceCondition) {
                      responsePartsRelatedsList[j].priceCondition.discount =
                        (responsePartsRelatedsList[j].priceCondition.discount + 100) / 100;
                    }
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'substitution') {
                    if (responsePartsRelatedsList[j].priceCondition) {
                      responsePartsRelatedsList[j].priceCondition.discount =
                        (responsePartsRelatedsList[j].priceCondition.discount + 100) / 100;
                    }
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  $scope.calculatePriceConditionPriceAll();
                }
              }

              _.each(forOrdParts, function (oldItem) { //替换已经编辑过的配件
                _.each($scope.selectedTruckFitItems, function (newItem) { //替换已经编辑过的配件
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
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;
          console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();
              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                  responsePartsRelatedsList[j]['edit'] = true;
                  if (responsePartsRelatedsList[j].type == 'common') {
                    if (responsePartsRelatedsList[j].priceCondition) {
                      responsePartsRelatedsList[j].priceCondition.discount =
                        (responsePartsRelatedsList[j].priceCondition.discount + 100) / 100;
                    }
                    //
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                  if (responsePartsRelatedsList[j].type == 'substitution') {
                    if (responsePartsRelatedsList[j].priceCondition) {
                      responsePartsRelatedsList[j].priceCondition.discount =
                        (responsePartsRelatedsList[j].priceCondition.discount + 100) / 100;
                    }
                    $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                  }
                }
              }
              $scope.calculatePriceConditionPriceAll();
            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();

            });

        };

        $scope.calculationPartDiscount = function (partItem) {
          if (partItem.priceCondition.price) {
            partItem.priceCondition.discount =
              Number(partItem.priceCondition.favourablePrice / partItem.priceCondition.price).toFixed(2);
          }
          $scope.calculatePriceConditionPriceAll();
        };

        $scope.calculationLabourDiscount1 = function (labourDiscount, labourPrice, labourUnitPrice) {
          $scope.discountPrice1 = labourUnitPrice / labourPrice;
        };

        $scope.calculationLabourDiscount2 = function (labourDiscount, labourPrice, labourUnitPrice) {
          $scope.discountPrice2 = labourUnitPrice / labourPrice;
        };

        $scope.calculationLabourDiscount3 = function (labourDiscount, labourPrice, labourUnitPrice) {
          $scope.discountPrice3 = labourUnitPrice / labourPrice;
        };

        $scope.calculatePriceConditionPriceAll = function (partItem) {
          //计算合计
          $scope.priceConditionPriceAll = 0;
          // for (let i = 0; i < $scope.selectedTruckFitItems.length; i++) {
          //   if ($scope.selectedTruckFitItems[i].priceCondition) {
          //     $scope.priceConditionPriceAll =
          //       Number($scope.selectedTruckFitItems[i].priceCondition.favourablePrice).toFixed(2) *
          //       Number($scope.selectedTruckFitItems[i].quantity)+ $scope.priceConditionPriceAll;
          //   }
          // }
          if (partItem) {
            partItem.priceCondition.favourablePrice =
              Number(partItem.priceCondition.discount * partItem.priceCondition.price).toFixed(2);
          }
          $scope.priceConditionPriceAll = _.sum(_.map($scope.selectedTruckFitItems, function (item) {
            if (item.priceCondition) {
              console.log('favourablePrice', item.priceCondition.favourablePrice, 'quantity', item.quantity);
              return (_.isNaN(item.priceCondition.favourablePrice) ? 0 : Number(item.priceCondition.favourablePrice))
                     * (_.isNaN(item.quantity) ? 0 : Number(item.quantity));
            }
          }));

          console.log('calculatePriceConditionPriceAll:', $scope.priceConditionPriceAll);
          $scope.priceConditionPriceAll = $scope.priceConditionPriceAll.toFixed(2);

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
          var returnType = 'sv_Td small_type';
          if (type === 'economical') {
            returnType = 'sv_Td green_type';
          } else if (type === 'substitution') {
            returnType = 'sv_Td blue_type';
          } else if (type === 'common') {
            returnType = 'sv_Td small_type';
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
          $('input.sv_InputForListSpecial').each(function (index, element) {
            $scope.serviceFeeListP3 = Number(element.value) + Number($scope.serviceFeeListP3);
          });
        };

        //组装劳务费 配件列表
        $scope.addLabourOriginalsList = function (obj) {
          $scope.quoteLabourOriginalsList = [];
          var oneLabourOriginals1 = {};
          oneLabourOriginals1['Service_Quote__c'] = manMadeNo1Id;
          oneLabourOriginals1['Name'] = encodeURIComponent(manMadeNo1Name.replace('"',replaceName));
          oneLabourOriginals1['Gross_Price__c'] = $scope.manMadePrice1;
          oneLabourOriginals1['Gross_Amount__c'] = Number($scope.manMadePrice1) * Number($scope.manMadeNo1);
          oneLabourOriginals1['Quantity__c'] = $scope.manMadeNo1;
          oneLabourOriginals1['Discount__c'] = (Number($scope.discountPrice1) * 100) - 100;
          oneLabourOriginals1['Net_Amount__c'] =
            Number($scope.discountPrice1) * Number($scope.manMadePrice1) * Number($scope.manMadeNo1);//优惠总价
          oneLabourOriginals1['Net_Price__c'] = Number($scope.discountPrice1) * Number($scope.manMadePrice1);
          oneLabourOriginals1['Line_Item__c'] = 1;
          oneLabourOriginals1['Material_Type__c'] = 'Labour';
          oneLabourOriginals1['Material_Number__c'] = '7990110000';
          // oneLabourOriginals1["Net_Amount__c"] = $scope.discountPrice1; //优惠总价
          $scope.quoteLabourOriginalsList.push(oneLabourOriginals1);
          var oneLabourOriginals2 = {};
          oneLabourOriginals2['Service_Quote__c'] = manMadeNo2Id;
          oneLabourOriginals2['Name'] = encodeURIComponent(manMadeNo2Name.replace('"',replaceName));
          oneLabourOriginals2['Gross_Price__c'] = $scope.manMadePrice2;
          oneLabourOriginals2['Gross_Amount__c'] = Number($scope.manMadePrice2) * Number($scope.manMadeNo2);
          oneLabourOriginals2['Quantity__c'] = $scope.manMadeNo2;
          oneLabourOriginals2['Discount__c'] = (Number($scope.discountPrice2) * 100) - 100;
          oneLabourOriginals2['Net_Amount__c'] =
            Number($scope.discountPrice2) * Number($scope.manMadePrice2) * Number($scope.manMadeNo2);//优惠总价
          oneLabourOriginals2['Net_Price__c'] = Number($scope.discountPrice2) * Number($scope.manMadePrice2);
          oneLabourOriginals2['Line_Item__c'] = 2;
          oneLabourOriginals2['Material_Type__c'] = 'Labour';
          oneLabourOriginals2['Material_Number__c'] = '7990110003';
          $scope.quoteLabourOriginalsList.push(oneLabourOriginals2);
          // var serviceQuotes = [];//车辆
          // var quoteLabourOriginals = [];//劳务费
          for (let index = 0; index < $stateParams.SendAllUser.length; index++) {
            const element = $stateParams.SendAllUser[index];
            delete element.levels;
            delete element.descriptions;
            delete element.Id;
            delete element.Name;
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
            oneLabourOriginals3['Name'] = encodeURIComponent($scope.serviceFeeList[index].replace('"',replaceName));
            oneLabourOriginals3['Gross_Amount__c'] =
              Number(sv_InputForListPrice[index]) * Number(sv_InputForListNo[index]);//总价
            oneLabourOriginals3['Gross_Price__c'] = sv_InputForListPrice[index];//单价
            oneLabourOriginals3['Quantity__c'] = sv_InputForListNo[index];//数量
            oneLabourOriginals3['Discount__c'] = (Number(sv_InputForListDiscount[index]) * 100) - 100;//折扣
            oneLabourOriginals3['Net_Price__c'] =
              Number(sv_InputForListDiscount[index]) * Number(sv_InputForListPrice[index]);//优惠单价
            oneLabourOriginals3['Net_Amount__c'] = sv_InputForListSpecial[index];//优惠总价
            oneLabourOriginals3['Line_Item__c'] = index + 3;
            oneLabourOriginals3['Material_Number__c'] = index + 3;
            oneLabourOriginals3['Material_Type__c'] = 'Labour';
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals3);

          }

          //配件
          var part_InputForListPrice = [];//优惠单价 ？
          var part_InputForListNo = [];//数量
          var part_InputForListDiscount = [];//折扣
          var part_InputForListChecked = [];//预留状态

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
          $('input.ckbox_part').each(function (index, element) {
            part_InputForListChecked.push(element.checked);
          });
          for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
            var oneLabourOriginals4 = {};
            var selectedTruckFitItemsIndex = $scope.selectedTruckFitItems[index];
            oneLabourOriginals4['Name'] = encodeURIComponent(selectedTruckFitItemsIndex.Name.replace('"',replaceName));
            if (selectedTruckFitItemsIndex.priceCondition) {
              oneLabourOriginals4['Gross_Price__c'] = selectedTruckFitItemsIndex.priceCondition.price; //单价
              oneLabourOriginals4['SPN_Discount__c'] = selectedTruckFitItemsIndex.priceCondition.spnDiscount; //spn折扣
              oneLabourOriginals4['SPN_Price__c'] = selectedTruckFitItemsIndex.priceCondition.spnPrice; //spn价
              oneLabourOriginals4['Gross_Amount__c'] = selectedTruckFitItemsIndex.GrossAmountC; //总价
              oneLabourOriginals4['Net_Price__c'] = selectedTruckFitItemsIndex.priceCondition.favourablePrice;//优惠单价
            }
            oneLabourOriginals4['Service_Material__c'] = selectedTruckFitItemsIndex.Id;
            oneLabourOriginals4['Quantity__c'] = part_InputForListNo[index];
            oneLabourOriginals4['Discount__c'] = (Number(part_InputForListDiscount[index]) * 100) - 100;
            oneLabourOriginals4['Reserved__c'] = part_InputForListChecked[index];//预留
            oneLabourOriginals4['Net_Amount__c'] = selectedTruckFitItemsIndex.part_InputForListSpecial;//优惠总价
            oneLabourOriginals4['Line_Item__c'] = 100 + index;
            oneLabourOriginals4['Material_Number__c'] = selectedTruckFitItemsIndex.parts_number__c;
            oneLabourOriginals4['Material_Type__c'] = 'Part';
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals4);
          }
        };
        //保存
        $scope.toSaveServiceQuoteOverview = function (payload) {
          AppUtilService.showLoading();
          $scope.addLabourOriginalsList();//组织劳务费数据
          var serviceQuoteOverview = {};

          let truckFitItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
            return part.Material_Type__c == 'Part';
          });
          let labourItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
            return part.Material_Type__c == 'Labour';
          });

          serviceQuoteOverview['Ship_to__c'] = $stateParams.SendSoupEntryId;
          serviceQuoteOverview['Subject__c'] = $stateParams.SubjectC;
          serviceQuoteOverview['Contact__c'] = $stateParams.Contact__c;
          serviceQuoteOverview['Service_Type__c'] = $stateParams.SendAllUser[0].Service_Type__c;
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
          serviceQuoteOverview['Division__c']= $stateParams.Division__c;
          var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                        + '&serviceQuotes=' + JSON.stringify($stateParams.SendAllUser) + '&quoteLabourOriginals='
                        + JSON.stringify($scope.quoteLabourOriginalsList);
          console.log('payload', payload);

          ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
            AppUtilService.hideLoading();
            console.log('POST_success:', response);
            var ionPop = $ionicPopup.alert({
              title: '保存成功'
            });
            ionPop.then(function (res) {
              window.history.back(-1);
              window.history.back(-1);
            });
          }, function (error) {
            console.log('POST_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '保存失败',
              template:JSON.stringify(error)
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
              window.history.back(-1);
              window.history.back(-1);
            });
          }, function (error) {
            console.log('toSubmitCheckFunction_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: error.responseJSON[0].message
            });
          }, 'POST', JSON.stringify(requests), null);
          console.log('toSubmitCheckFunction_payload', requests);

        };

        $scope.toSubmitCheck = function () {
          AppUtilService.showLoading();
          $scope.addLabourOriginalsList();//组织劳务费数据
          var serviceQuoteOverview = {};

          let truckFitItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
            return part.Material_Type__c == 'Part';
          });
          let labourItems = _.filter($scope.quoteLabourOriginalsList, function (part) {
            return part.Material_Type__c == 'Labour';
          });

          serviceQuoteOverview['Ship_to__c'] = $stateParams.SendSoupEntryId;
          serviceQuoteOverview['Subject__c'] = $stateParams.SubjectC;
          serviceQuoteOverview['Contact__c'] = $stateParams.Contact__c;
          serviceQuoteOverview['Service_Type__c'] = $stateParams.SendAllUser[0].Service_Type__c;
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
          serviceQuoteOverview['Division__c']= $stateParams.Division__c;
          var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                        + '&serviceQuotes=' + JSON.stringify($stateParams.SendAllUser) + '&quoteLabourOriginals='
                        + JSON.stringify($scope.quoteLabourOriginalsList);
          console.log('payload', payload);

          ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
            console.log('POST_success:', response);
            $scope.toSubmitCheckFunction(response.Id);//提交审核接口

          }, function (error) {
            console.log('POST_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '保存失败',
              template:JSON.stringify(error)
            });
          });

        };

        $scope.toDownloadEexFile = function () {

          AppUtilService.showLoading();
          $scope.addLabourOriginalsList();//组织劳务费数据
          var serviceQuoteOverview = {};
          serviceQuoteOverview['Ship_to__c'] = $stateParams.SendSoupEntryId;
          serviceQuoteOverview['Subject__c'] = $stateParams.SubjectC;
          serviceQuoteOverview['Contact__c'] = $stateParams.Contact__c;
          serviceQuoteOverview['Service_Type__c'] = $stateParams.SendAllUser[0].Service_Type__c;
          serviceQuoteOverview['Division__c']= $stateParams.Division__c;
          var payload = $scope.paramSaveUrl + 'serviceQuoteOverview=' + JSON.stringify(serviceQuoteOverview)
                        + '&serviceQuotes=' + JSON.stringify($stateParams.SendAllUser) + '&quoteLabourOriginals='
                        + JSON.stringify($scope.quoteLabourOriginalsList);
          console.log('payload', payload);

          ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
            console.log('POST_success:', response);
            //下载excel接口
            var serviceQuoteOverviewId = {};
            serviceQuoteOverviewId['serviceQuoteOverviewId'] = response.Id;
            var excelTemplateCode = {};
            excelTemplateCode['excelTemplateCode'] = '1';
            // var payload = $scope.paramExeclUrl + serviceQuoteOverviewId + "/" + excelTemplateCode;
            var payload = $scope.paramExeclUrl + response.Id + '/1';

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
                title: '保存失败',
                template:JSON.stringify(error)
              });
            });

          }, function (error) {
            console.log('POST_error:', error);
            AppUtilService.hideLoading();
            var ionPop = $ionicPopup.alert({
              title: '保存失败',
              template:JSON.stringify(error)
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
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;
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
                  rebuildListForLSG[i].priceCondition.discount =
                    (rebuildListForLSG[i].priceCondition.discount + 100) / 100;
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
                                    + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId+'&isRental='+$scope.isRentalInfo;

          ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
            function (responsePartsRelateds) {
              AppUtilService.hideLoading();

              for (let i = 0; i < responsePartsRelateds.length; i++) {
                var responsePartsRelatedsList = responsePartsRelateds[i];
                if (responsePartsRelatedsList[0].priceCondition) {
                  responsePartsRelatedsList[0].priceCondition.discount =
                    (responsePartsRelatedsList[0].priceCondition.discount + 100) / 100;
                }
                $scope.selectedTruckFitItems.push(responsePartsRelatedsList[0]);
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

      });

})();
