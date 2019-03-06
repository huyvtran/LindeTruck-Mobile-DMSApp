(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('NewContentTruckPartController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService, ConnectionMonitor,
                LocalCacheService, ForceClientService) {

        var vm = this;
        $scope.contentTruckItems = [];//配件
        $scope.data = {};
        $scope.searchTruckText = '';
        $scope.searchResultTruckName = '';

        var oCurrentUser = LocalCacheService.get('currentUser') || {};
        console.log('oCurrentUser!', oCurrentUser);

        $scope.searchPartssUrl = '/Partss?keyword=';
        $scope.partsRelatedsUrl = '/PartsRelateds?partsNumbers=';
        $scope.createPartListUrl = '/PersonalPartListService?action=createPartList&partListData=';

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

        });

        //搜索配件
        $scope.getTrucks = function (keyWord) {
          AppUtilService.showLoading();
          $scope.contentTruckFitItems = [];
          console.log('getTrucks::', keyWord);
          let parts_number__cList = [];
          let partsQuantitys = [];
          var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord;
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
                                        + JSON.stringify(partsQuantitys) + '&accountId=' + $stateParams.SendSoupEntryId;
              console.log('getPartsRelatedsUrl:', getPartsRelatedsUrl);

              ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null,
                function (responsePartsRelateds) {
                  AppUtilService.hideLoading();
                  console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);
                  for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    $scope.contentTruckItems.push(responsePartsRelatedsList[0]);
                  }
                  _.each($scope.contentTruckItems, function (partItem) {
                    partItem.isClick = false;
                  });
                }, function (error) {
                  console.log('error:', error);
                  AppUtilService.hideLoading();

                });

            }, function (error) {
              console.log('error:', error);
              AppUtilService.hideLoading();
            });
        };

        $scope.contentSelectTruckItems = function () {
          return _.filter($scope.contentTruckItems, function (truckPart) {
            return truckPart.isClick;
          });
        };

        $scope.changeTruckTab = function (index) {
          if (index === '1') {
            $("#selectTruck_Tab_1").addClass("selectTruckCP_Tab_Active");
            $("#selectTruck_Tab_2").removeClass("selectTruckCP_Tab_Active");

            $('#selectTruckCP_result').css('display', 'block');
            $('#selectTruckCP_checked').css('display', 'none');
          } else if (index === '2') {
            $("#selectTruck_Tab_1").removeClass("selectTruckCP_Tab_Active");
            $("#selectTruck_Tab_2").addClass("selectTruckCP_Tab_Active");

            $('#selectTruckCP_result').css('display', 'none');
            $('#selectTruckCP_checked').css('display', 'block');
          }
        };

        $scope.isAllSelected = function () {
          if (_.isEmpty($scope.contentTruckItems)) {
            return false;
          }
          var isSelect = _.every($scope.contentTruckItems, 'isClick', true);
          return isSelect;
        };

        $scope.isTruckPartSelected = function (partItem) {
          if (_.isEmpty(partItem)) {
            return false;
          }
          return partItem.isClick;
        };

        $scope.checkAllSearchResults = function () {

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

        $scope.checkSearchResults = function (titem) {

          _.each($scope.contentTruckItems, function (partItem) {
            if (_.isEqual(partItem, titem)) {
              if (partItem.isClick === true) {
                _.assign(partItem, {isClick: false});
              } else {
                _.assign(partItem, {isClick: true});
              }
            }
          });

        };

        $scope.delSelectedItem = function (ele) {

          _.each($scope.contentTruckItems, function (partItem) {
            if (_.isEqual(partItem, ele)) {
              _.assign(partItem, {isClick: false});
            }
          });
        };

        $scope.delAllSelectedItem = function () {
          _.each($scope.contentTruckItems, function (partItem) {
            partItem.isClick = false;
          });
        };

        //添加分类配件
        $scope.addClassificationParts = function () {

          var partObj = [];
          // $stateParams.partItem;
          var truckItems = _.filter($scope.contentTruckItems, function (truckPart) {
            return truckPart.isClick;
          });

          if (truckItems.length > 0) {
            angular.forEach(truckItems, function (truckItem) {
              partObj.push({
                "Service_Material__c": truckItem.Id,
                "Name": truckItem.Name,
                'Part_Number__c': truckItem.parts_number__c,
                'Quantity__c': truckItem.quantity
              });
            });

            AppUtilService.showLoading();

            var personalPartListData = {
              "partObjs": partObj,
              "perPartListParentId": $stateParams.partItem.Id,
              "userId": oCurrentUser.Id
            };

            ForceClientService.getForceClient().apexrest(
              $scope.createPartListUrl + JSON.stringify(personalPartListData), 'POST', {}, null,
              function (responsePartsRelateds) {
                AppUtilService.hideLoading();
                console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);

                if (responsePartsRelateds.status == "Success") {
                  var ionPop = $ionicPopup.alert({
                    title: '保存成功'
                  });
                  ionPop.then(function (res) {
                    window.history.back();
                  });
                } else {
                  $ionicPopup.alert({
                    title: "保存失败"
                  });
                }
              }, function (error) {
                console.log('error:', error);
                AppUtilService.hideLoading();

              });
          } else {
            $ionicPopup.alert({
              title: "请选择配件"
            });
          }
        };

        $scope.closeSelectPage = function () {
          window.history.back();
        };

      });
})();
