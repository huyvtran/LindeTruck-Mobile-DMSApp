angular.module('oinio.NewOfferController', [])
  .controller('NewOfferController',
    function ($scope, $log, $ionicPopup, $stateParams, HomeService, $state, $rootScope, ForceClientService,
              AppUtilService, SQuoteService ,Service1Service) {
      var toDisplayDelCarBool = false;
      var tabSVViewNewIndex = 1;
      var selectAcctSetId;
      let trucksDescriptions = [];
      let trucksLevels = [];
      $scope.searchTruckText = '';
      $scope.contentTruckItems = [];
      $scope.selectedTruckItems = [];
      $scope.serviceSatusUrl = '/ServiceQuoteOverviewStatus/';
      $(document).ready(function () {
      });

      $scope.goBack = function () {
        // window.history.back();
        $state.go('app.home');

      };

      $scope.getServiceSatus = function (getId) {
        AppUtilService.showLoading();
        //审批状态
        ForceClientService.getForceClient().apexrest($scope.serviceSatusUrl + getId, 'GET', {}, null,
          function (response) {
            console.log('getServiceSatus_success:', response);
            $scope.serviceSatus = response.status;
            AppUtilService.hideLoading();
          }, function (error) {
            console.log('getServiceSatus_error:', error);
            AppUtilService.hideLoading();
          });
      };

      $scope.openSelectPage = function (ele) {
        console.log('cssss:::', $('#selectCustomer'));

        $('div.newWorkList_main').animate({
          opacity: '0.6'
        }, 'slow', 'swing', function () {
          $('div.newWorkList_main').hide();
          $('div.newWorkList_truckSelect').animate({
            opacity: '1'
          }, 'normal').show();

          if (ele === 'customer') {
            $('#selectCustomer').css('display', 'block');
            $('#selectTruck').css('display', 'none');
            $('#selectContactsDiv').css('display', 'none');
            window.setTimeout(function () {
              $('input').trigger('click').focus();
            }, 200);

          } else if (ele === 'selectTruck') {//选择车辆
            $('#selectTruck').css('display', 'block');
            $('#selectCustomer').css('display', 'none');
            $('#selectContactsDiv').css('display', 'none');
            $scope.getTrucks(selectAcctSetId);//获取当前选择用户下的车辆

          } else if (ele === 'selectContactsDiv') { //联系人
            $('#selectTruck').css('display', 'none');
            $('#selectCustomer').css('display', 'none');
            $('#selectContactsDiv').css('display', 'block');
            setTimeout(function () {
              $scope.selectAccountOfContacts();
            }, 100);
          }
        });
      };
      $scope.closeSelectPage = function () {
        $('div.newWorkList_truckSelect').animate({
          opacity: '0.6'
        }, 'slow', function () {
          $('div.newWorkList_truckSelect').hide();
          $('div.newWorkList_main').animate({
            opacity: '1'
          }, 'normal').show();
        });
        //检查保养策略
        $scope.checkMaintenanceStandard();
      };
      $scope.getAccts = function (keyWord) {
        AppUtilService.showLoading();
        //搜索客户
        Service1Service.searchAccounts(keyWord,true).then(function (response) {
          console.log(' Service1Service.searchAccounts', response);

          AppUtilService.hideLoading();
          let accountsName = [];
          let accountsId = [];
          if (response!=null && response.length > 0) {
            for (let index = 0; index < response.length; index++) {
              accountsName.push(response[index]);
              accountsId.push(response[index].Id);
            }
            $scope.contentItems = accountsName;
            $scope.getIds = accountsId;
            console.log('AccountServicegw22', accountsName);
          } else {
            var ionPop = $ionicPopup.alert({
              title: '结果',
              template: '没有客户数据'
            });
            ionPop.then(function () {
              //$ionicHistory.goBack();
              //$state.go("app.home");
            });
          }
        }, function (error) {
          $log.error('Service1Service.searchAccounts Error ' + error);
          AppUtilService.hideLoading();

        }).finally(function () {
          AppUtilService.hideLoading();
        });
      };
      //选择用户
      $scope.selectAccount = function (acct) {
        Service1Service.getAccountObjectById(acct.Id,true).then(function (response) {
          console.log(' Service1Service.getAccountObjectById', response);
          selectAcctSetId = acct.Id;
          $scope.searchResultAddress = response.Office_Address__c;
          $scope.searchResultAcctName = response.Name;
          $scope.getServiceSatus(selectAcctSetId);//审核状态
          $scope.selectedTruckItems = [];
        }, function (error) {
          $log.error('getAccount Error ' + error);
        }).finally(function () {
          //AppUtilService.hideLoading();
        });
        $scope.closeSelectPage();
      };

      //保养级别
      $scope.getMainLevelsAndDesc = function (obj) {
        if (!obj.Maintenance_Key__c) {
          return;
        }
        console.log('obj.Maintenance_Key__c', obj.Maintenance_Key__c);

        SQuoteService.getMaintenanceLevelsAndDescriptionsInfo(obj.Maintenance_Key__c, true).then(function (response) {
          console.log('getMainLevelsAndDesc', response);
          if (!response.levels || !response.descriptions) {
            return;
          }
          if (response.levels.length > 0) {
            obj['levels'] = response.levels;
          }
          if (response.names) {
            obj['levelNames'] = response.names;
          }
          if (response.descriptions.length > 0) {
            obj['descriptions'] = response.descriptions;
          }
          console.log('getMainLevelsAndDescobj', obj);
        }, function (error) {
          $log.error('HomeService.searchTrucks Error ' + error);
        }).finally(function () {
          //AppUtilService.hideLoading();
        });
      };
      $scope.getTrucks = function (acctId) {
        if ($scope.searchResultAcctName == null) {
          var ionPop = $ionicPopup.alert({
            title: '请先选择客户'
          });
          return;
        }
        AppUtilService.showLoading();
        $scope.contentTruckItems = [];
        console.log('searchTruckFleets::', acctId);
        //搜索车体 在线/离线
        HomeService.searchTruckFleets('', acctId, '150', true).then(function (response) {
          console.log('searchTruckFleets', response);
          AppUtilService.hideLoading();
          let trucks = [];
          if (response.length > 0) {
            for (let index = 0; index < response.length; index++) {
              trucks.push(response[index]);
            }
            $scope.contentTruckItems = trucks;
            setTimeout(function () {//再次搜索勾选之前已经选中的车辆
              for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                $('input.ckbox_truck_searchresult_item').each(function (index, element) {
                  if ($(element).attr('data-recordid') == $scope.selectedTruckItems[i].Id) {
                    $(this).prop('checked', true);
                  }
                });
              }
            }, 300);
          } else {
            var ionPop = $ionicPopup.alert({
              title: '结果',
              template: '没有数据'
            });
            ionPop.then(function () {
              //$ionicHistory.goBack();
              //$state.go("app.home");
            });
          }
        }, function (error) {
          AppUtilService.hideLoading();
          $log.error('HomeService.searchTrucks Error ' + error);
        }).finally(function () {
          AppUtilService.hideLoading();
        });
      };

      //根据用户查找车体
      $scope.getTrucksWithKey = function (keyWord) {
        if ($scope.searchResultAcctName == null) {
          var ionPop = $ionicPopup.alert({
            title: '请先选择客户'
          });
          return;
        }
        $scope.contentTruckItems = [];

        HomeService.searchTruckFleets(keyWord, selectAcctSetId, '150', true).then(function (response) {
          console.log('getTrucks::', keyWord);
          if (typeof (response) == 'string') {
            $ionicPopup.alert({
              title: '结果',
              template: '没有数据'
            });
            return;
          }
          let trucks = [];
          if (response.length > 0) {
            for (let index = 0; index < response.length; index++) {
              trucks.push(response[index]);
            }
            $scope.contentTruckItems = trucks;

            setTimeout(function () { //再次搜索勾选之前已经选中的车辆
              for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                $('input.ckbox_truck_searchresult_item').each(function (index, element) {
                  if ($(element).attr('data-recordid') == $scope.selectedTruckItems[i].Id) {
                    $(this).prop('checked', true);
                  }
                });
              }
            }, 300);

            console.log('getTrucks', trucks);
          } else {
            var ionPop = $ionicPopup.alert({
              title: '结果',
              template: '没有数据'
            });
            ionPop.then(function () {
              //$ionicHistory.goBack();
              //$state.go("app.home");
            });
          }
        }, function (error) {
          $log.error('HomeService.searchTrucks Error ' + error);
        }).finally(function () {
          //AppUtilService.hideLoading();
        });
      };

      $scope.selectContacts = function (item) {
        $scope.selectContactsName = item.Name;
        $scope.closeSelectPage();
      };
      //联系人
      $scope.selectAccountOfContacts = function () {
        Service1Service.getContactsObjectByAcctId(selectAcctSetId,true).then(function (response) {
          console.log('Service1Service.getContactsObjectByAcctId', response);
          let contactsAll = [];
          if (response !=null) {
            for (let index = 0; index < response.length; index++) {
              contactsAll.push(response[index]);
            }
            $scope.contactsItems = contactsAll;
          } else {
            var ionPop = $ionicPopup.alert({
              title: '结果',
              template: '没有客户数据'
            });
            ionPop.then(function () {
              //$ionicHistory.goBack();
              //$state.go("app.home");
            });
          }

        }, function (error) {
          $log.error('getAccount Error ' + error);
        }).finally(function () {
          //AppUtilService.hideLoading();
        });
        // $scope.init20Trucks(acct.Id);
      };

      $scope.changeTruckTab = function (index) {
        console.log('cssss:::', $('#selectCustomer'));
        if (index === '1') {
          $('#selectTruck_Tab_1').addClass('selectTruck_Tab_Active');
          $('#selectTruck_Tab_2').removeClass('selectTruck_Tab_Active');

          $('#selectTruck_result').css('display', 'block');
          $('#selectTruck_checked').css('display', 'none');
        } else if (index === '2') {
          $('#selectTruck_Tab_1').removeClass('selectTruck_Tab_Active');
          $('#selectTruck_Tab_2').addClass('selectTruck_Tab_Active');

          $('#selectTruck_result').css('display', 'none');
          $('#selectTruck_checked').css('display', 'block');
        }
      };

      //扫描二维码
      $scope.scanCode = function () {

        cordova.plugins.barcodeScanner.scan(
          function (result) {
            //扫码成功后执行的回调函数
            console.log('result', result);
            $scope.searchTruckText = result.text;
            $scope.getTrucksWithKey(result.text);
          },
          function (error) {
            //扫码失败执行的回调函数
            alert('Scanning failed: ' + error);
          }, {
            preferFrontCamera: false, // iOS and Android 设置前置摄像头
            showFlipCameraButton: false, // iOS and Android 显示旋转摄像头按钮
            showTorchButton: true, // iOS and Android 显示打开闪光灯按钮
            torchOn: false, // Android, launch with the torch switched on (if available)打开手电筒
            prompt: '在扫描区域内放置二维码', // Android提示语
            resultDisplayDuration: 500, // Android, display scanned text for X ms.
            //0 suppresses it entirely, default 1500 设置扫码时间的参数
            formats: 'QR_CODE', // 二维码格式可设置多种类型
            orientation: 'portrait', // Android only (portrait|landscape),
                                     //default unset so it rotates with the device在安卓上 landscape 是横屏状态
            disableAnimations: true, // iOS     是否禁止动画
            disableSuccessBeep: false // iOS      禁止成功后提示声音 “滴”
          }
        );
      };

      //全选
      $scope.checkAllSearchResults = function () {
        let ele = $('#ckbox_truck_searchresult_all');

        console.log('checkAllSearchResults:::', ele.prop('checked'));
        if (ele.prop('checked')) {
          $('input.ckbox_truck_searchresult_item').each(function (index, element) {
            $(this).prop('checked', true);
          });

          angular.forEach($scope.contentTruckItems, function (searchResult) {
            let existFlag = false;
            angular.forEach($scope.selectedTruckItems, function (selected) {
              if (searchResult.Id == selected.Id) {
                existFlag = true;
              }
            });
            if (!existFlag) {
              $scope.selectedTruckItems.push(searchResult);
              $scope.updateTruckString();
            }
          });
        } else {

          $('input.ckbox_truck_searchresult_item').each(function (index, element) {
            console.log('666:::', element.checked);
            element.checked = false;
          });

          let arr_temp = [];
          angular.forEach($scope.selectedTruckItems, function (selected) {
            let existFlag = false;
            angular.forEach($scope.contentTruckItems, function (searchResult) {
              if (searchResult.Id == selected.Id) {
                existFlag = true;
              }
            });
            if (!existFlag) {
              arr_temp.push(selected);
            }
          });
          $scope.selectedTruckItems = arr_temp;
          $scope.updateTruckString();

        }
      };

      //单选
      $scope.checkSearchResults = function (ele) {
        let element = $('input.ckbox_truck_searchresult_item[data-recordid*=\'' + ele.Id + '\']');

        if (element != null && element.length > 0) {
          if (element[0].checked) {
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
          } else {
            let temp = [];
            for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
              if (ele.Id != $scope.selectedTruckItems[i].Id) {
                temp.push($scope.selectedTruckItems[i]);
              }
            }
            $scope.selectedTruckItems = temp;
            $scope.updateTruckString();
          }
        } else {
          console.log('checkSearchResults::error');
        }
      };
      //保养策略
      $scope.checkMaintenanceStandard = function () {
        let maintenanceKey = "";
        if ($scope.selectedTruckItems.length>1){
          maintenanceKey =  $scope.selectedTruckItems[0].Maintenance_Key__c;
          for (let i = 0; i < $scope.selectedTruckItems.length; i++) {
              if (maintenanceKey!=$scope.selectedTruckItems[i].Maintenance_Key__c) {
                var ionPop = $ionicPopup.alert({
                  title: '保养只能选择同保养策略的车'
                });
                $scope.selectedTruckItems =[];
                return;
              }
          }
        }
      };
      //删除某个车体
        $scope.delSelectedItem = function (ele) {
          //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
          let new_temp = [];

          for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
            if (ele.Id != $scope.selectedTruckItems[i].Id) {
              new_temp.push($scope.selectedTruckItems[i]);
            }
          }

          $('input.ckbox_truck_searchresult_item').each(function (index, element) {
            if ($(element).attr('data-recordid') == ele.Id && element.checked) {
              element.checked = false;
            }
          });
          document.getElementById('ckbox_truck_searchresult_all').checked = false;

          $scope.selectedTruckItems = new_temp;
          $scope.updateTruckString();

        };

      $scope.delAllSelectedItem = function () {
        $('input.ckbox_truck_searchresult_item').each(function (index, element) {
          element.checked = false;
        });
        document.getElementById('ckbox_truck_searchresult_all').checked = false;

        $scope.selectedTruckItems = [];
        $scope.updateTruckString();
      };

      $scope.updateTruckString = function () {
        for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
          //更新选择的车体号
          let searchTrucksRes = $scope.selectedTruckItems[i];
          $scope.getMainLevelsAndDesc(searchTrucksRes);
        }

      };

      //下一步
      $scope.goNextPage = function () {
        if ($scope.searchResultAcctName == null) {
          var ionPop = $ionicPopup.alert({
            title: '请填写客户名称'
          });
          return;
        }
        // if ($scope.selectedTruckItems.length == 0) {
        //     var ionPop = $ionicPopup.alert({
        //         title: "请添加车辆"
        //     });
        //     return;
        // }

        var selectedTruckItemsCopy = JSON.parse(JSON.stringify($scope.selectedTruckItems));

        $('select.selectStatusServiceTypeClass').each(function (index, element) {
          let selected = selectedTruckItemsCopy[index];
          if (element.value =="修理"){
            selected['Service_Type__c'] = "Repair";
          }
          if (element.value =="检查"){
            selected['Service_Type__c'] = "Inspection";
          }
          if (element.value =="维护"){
            selected['Service_Type__c'] = "Maintenance";
          }
        });

        $('select.selectStatusLevelsClass').each(function (index, element) {
          let selected = selectedTruckItemsCopy[index];
          selected['Maintenance_Level__c'] = element.value;

          // console.log('selectStatusLevelsClass:::',element.value+"  index"+index);
        });
        $('select.selectStatusDescriptionsClass').each(function (index, element) {
          let selected = selectedTruckItemsCopy[index];
          selected['description'] = element.value;

          // console.log('selectStatusDescriptionsClass:::',element.value+"  index"+index);
        });

        $('input.sv_Input').each(function (index, element) {
          let selected = selectedTruckItemsCopy[index];
          selected['Work_Time__c'] = element.value;

          // console.log('sv_Input:::',element.value+"  index"+index);
        });
        for (let i = 0; i <selectedTruckItemsCopy.length; i++) {
          let selected = selectedTruckItemsCopy[i];
          selected['Truck_Fleet__c'] = selected.Name;
        }
        console.log('selectStatuClass:ALL::', selectedTruckItemsCopy);

        $state.go('app.newOfferFittings', {SendAllUser: selectedTruckItemsCopy, SendSoupEntryId: selectAcctSetId ,SubjectC:$scope.SubjectC});

        // $state.go('app.newOfferFittings');

      };

    });

