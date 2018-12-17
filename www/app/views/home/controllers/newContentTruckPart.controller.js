angular.module('oinio.NewContentTruckPartController', [])
  .controller('NewContentTruckPartController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService, ConnectionMonitor, LocalCacheService, ForceClientService) {

    var vm = this;
    $scope.contentTruckItems = [];//配件
    $scope.selectedTruckItems=[];
    $scope.data = {};
    $scope.searchTruckText ='';
    $scope.searchResultTruckName ='';


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
      ForceClientService.getForceClient().apexrest(getPartsRelatedsKeyWordUrl, 'GET', {}, null, function (response) {
        console.log('searchPartssUrl:', response);
        for (let index = 0; index < response.results.length; index++) {
          let element = response.results[index];
          parts_number__cList.push(element.parts_number__c);
          partsQuantitys.push(100000);
        }
        var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + '&partsQuantitys='
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
          }, function (error) {
            console.log('error:', error);
            AppUtilService.hideLoading();

          });

      }, function (error) {
        console.log('error:', error);
        AppUtilService.hideLoading();
      });
    };

    $scope.checkSearchResults = function (ele) {
      let element = $("input.ckbox_truck_searchresult_item[data-recordid*='"+ele.Id+"']");
      console.log('checkSearchResults::',element);

      if(element != null && element.length > 0) {
        if(element[0].checked) {
          let existFlag = false;
          for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
            if (ele.Id == $scope.selectedTruckItems[i].Id) {
              existFlag = true;
            }
          }
          if (!existFlag) {
            $scope.selectedTruckItems.push(ele);
            $scope.updateTruckString();
          }
        }else{
          let temp = [];
          for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
            if (ele.Id != $scope.selectedTruckItems[i].Id) {
              temp.push($scope.selectedTruckItems[i]);
            }
          }
          $scope.selectedTruckItems = temp;
          $scope.updateTruckString();
        }
      }else{
        console.log('checkSearchResults::error');
      }
    };


    $scope.$on('$ionicView.enter', function () {
      // check if device is online/offline

    });


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


    $scope.checkAllSearchResults = function () {
      let ele = $("#ckbox_truck_searchresult_all");

      console.log('checkAllSearchResults:::',ele.prop("checked"));
      if(ele.prop("checked")) {
        $("input.ckbox_truck_searchresult_item").each(function (index, element) {
          $(this).prop("checked", true);
        });

        angular.forEach($scope.contentTruckItems, function (searchResult) {
          let existFlag = false;
          angular.forEach($scope.selectedTruckItems, function (selected) {
            if(searchResult.Id == selected.Id){
              existFlag = true;
            }
          });
          if(!existFlag){
            $scope.selectedTruckItems.push(searchResult);
            $scope.updateTruckString();
          }
        });
      }else{

        $("input.ckbox_truck_searchresult_item").each(function (index, element) {
          console.log('666:::',element.checked);
          element.checked = false;
        });

        let arr_temp = [];
        angular.forEach($scope.selectedTruckItems, function (selected) {
          let existFlag = false;
          angular.forEach($scope.contentTruckItems, function (searchResult) {
            if(searchResult.Id == selected.Id){
              existFlag = true;
            }
          });
          if(!existFlag){
            arr_temp.push(selected);
          }
        });
        $scope.selectedTruckItems = arr_temp;
        $scope.updateTruckString();

      }
    };

    $scope.delSelectedItem = function (ele) {
      //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
      let new_temp = [];

      for (var i=0;i<$scope.selectedTruckItems.length;i++){
        if(ele.Id != $scope.selectedTruckItems[i].Id){
          new_temp.push($scope.selectedTruckItems[i]);
        }
      }

      $("input.ckbox_truck_searchresult_item").each(function (index, element) {
        if($(element).attr("data-recordid") == ele.Id && element.checked) {
          element.checked = false;
        }
      });
      document.getElementById("ckbox_truck_searchresult_all").checked = false;

      $scope.selectedTruckItems = new_temp;
      $scope.updateTruckString();

    };

    $scope.delAllSelectedItem = function () {
      $("input.ckbox_truck_searchresult_item").each(function (index, element) {
        element.checked = false;
      });
      document.getElementById("ckbox_truck_searchresult_all").checked = false;

      $scope.selectedTruckItems = [];
      $scope.updateTruckString();
    };

    $scope.updateTruckString = function () {
      let new_temp = '';

      for (var i=0;i<$scope.selectedTruckItems.length;i++){
        new_temp = new_temp + $scope.selectedTruckItems[i].Name + ';';
      }

      $scope.searchResultTruckName = new_temp;

    };

    //添加分类配件
    $scope.addClassificationParts = function () {

      // { "partObjs": [{"Id":xx, "Name":xx}], "perPartListParentId":xx, "userId": xx }
      var partObj = [];
      // $stateParams.partItem;
      angular.forEach($scope.selectedTruckItems, function (truckItem) {
        partObj.push({"Id":truckItem.Id, "Name":truckItem.Name});
      });

     var personalPartListData = { "partObjs" : partObj, "perPartListParentId" : $stateParams.partItem.Id, "userId" : oCurrentUser.Id };

      ForceClientService.getForceClient().apexrest($scope.createPartListUrl + JSON.stringify(personalPartListData), 'POST', {}, null,
        function (responsePartsRelateds) {
          AppUtilService.hideLoading();
          console.log('getPartsRelatedsUrlRes:', responsePartsRelateds);

          if (responsePartsRelateds.status == "Success"){
            var ionPop = $ionicPopup.alert({
              title: '保存成功'
            });
            ionPop.then(function (res) {
              window.history.back();
            });
          }else{
            $ionicPopup.alert({
              title: "保存失败"
            });
          }
        }, function (error) {
          console.log('error:', error);
          AppUtilService.hideLoading();

        });
      

    };

    $scope.closeSelectPage =function () {
      window.history.back();
    };

  });
