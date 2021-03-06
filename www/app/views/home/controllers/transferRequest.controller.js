(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('TransferRequestController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService,
                ForceClientService, LocalCacheService) {

        $scope.getCustomerInfo = {};
        $scope.outCustomerInfo = {};
        $scope.vehicle = {};
        $scope.remarksText = '';
        $scope.transfer = {};
        $scope.tapIndex = LocalCacheService.get('tapIndex');
        $scope.truckFleetTransfer = '/TruckFleetTransferService?action=saveTransfer&type=';

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

          if ($stateParams.transfer) {

            LocalCacheService.set('getCustomerInfo', $stateParams.transfer.Source_Account_ShipTo__r);
            LocalCacheService.set('outCustomerInfo', $stateParams.transfer.Target_Account_ShipTo__r);
            LocalCacheService.set('vehicle', $stateParams.transfer.Truck_Fleet__r);
            LocalCacheService.set('transfer', $stateParams.transfer);

            $scope.transfer = LocalCacheService.get('transfer');
            $scope.getCustomerInfo = $scope.transfer.Source_Account_ShipTo__r;
            $scope.outCustomerInfo = $scope.transfer.Target_Account_ShipTo__r;
            $scope.vehicle = $scope.transfer.Truck_Fleet__r;
            $scope.remarksText = $scope.transfer.Description__c;

          }

          $scope.getCustomerInfo = LocalCacheService.get('getCustomerInfo');
          $scope.outCustomerInfo = LocalCacheService.get('outCustomerInfo');
          $scope.vehicle = LocalCacheService.get('vehicle');
          $scope.transfer = LocalCacheService.get('transfer');

          if ($scope.getCustomerInfo) {
            $scope.getCustomerText =
              $scope.getCustomerInfo.Address__c + '/' + $scope.getCustomerInfo.Phone + '/' + $scope.getCustomerInfo.Id;
          }
          if ($scope.outCustomerInfo) {
            $scope.outCustomerText =
              $scope.outCustomerInfo.Address__c + '/' + $scope.outCustomerInfo.Phone + '/' + $scope.outCustomerInfo.Id;
          }
          if ($scope.vehicle) {
            $scope.vehicleTypeText = $scope.vehicle.Name;
          }
        });

        $scope.openSelectPage = function (type) {
          if ($scope.transfer) {
            if ($scope.transfer.Status__c !== 'Submit') {
              $state.go('app.searchCustomer', {customerType: type});
            }
          } else {
            $state.go('app.searchCustomer', {customerType: type});
          }

        };

        $scope.openVehicleNumberPage = function () {
          if ($scope.transfer) {
            if ($scope.transfer.Status__c !== 'Submit') {
              if ($scope.getCustomerInfo) {
                $state.go('app.searchVehicle', {acctId: $scope.getCustomerInfo.Id});
              } else {
                $ionicPopup.alert({
                  title: '请先选择转出客户'
                });
              }
            }
          } else {
            if ($scope.getCustomerInfo) {
              $state.go('app.searchVehicle', {acctId: $scope.getCustomerInfo.Id});
            } else {
              $ionicPopup.alert({
                title: '请先选择转出客户'
              });
            }
          }
        };

        $scope.draftSubmit = function () {
          if (!$scope.getCustomerInfo) {
            $ionicPopup.alert({
              title: '请选择转出客户'
            });
            return;
          }

          if ($scope.tapIndex == '1') {
            if (!$scope.outCustomerInfo) {
              $ionicPopup.alert({
                title: '请选择转入客户'
              });
              return;
            }
          }

          if (!$scope.vehicle) {
            $ionicPopup.alert({
              title: '请选择转出车档号'
            });
            return;
          }

          AppUtilService.showLoading();

          // Source_Account_ShipTo__c: 转出客户Id
          // Target_Account_ShipTo__c: 转入客户Id(Scrap 不填)
          // Source_Account_CS_Manager__c: Account.Service_Group_Default__r.Manager__c
          // Target_Account_CS_Manager__c: Account.Service_Group_Default__r.Manager__c(Scrap 不填)
          // Truck_Fleet__c: 车档 Id
          // Description__c: 备注

          let Truck_Fleet_Transfer__c = {};

          if ($scope.tapIndex == '1') {

            Truck_Fleet_Transfer__c.Source_Account_ShipTo__c = $scope.getCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Target_Account_ShipTo__c = $scope.outCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Source_Account_CS_Manager__c = $scope.getCustomerInfo.Service_Group_Default__r
                                                                   && $scope.getCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Target_Account_CS_Manager__c = $scope.outCustomerInfo.Service_Group_Default__r
                                                                   && $scope.outCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Truck_Fleet__c = $scope.vehicle.Id;
            Truck_Fleet_Transfer__c.Status__c = 'Draft';
            Truck_Fleet_Transfer__c.Description__c = $scope.remarksText;
            if ($scope.transfer) {
              Truck_Fleet_Transfer__c.Id = $scope.transfer.Id;
            }

          } else {

            Truck_Fleet_Transfer__c.Source_Account_ShipTo__c = $scope.getCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Source_Account_CS_Manager__c = $scope.getCustomerInfo.Service_Group_Default__r
                                                                   && $scope.getCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Truck_Fleet__c = $scope.vehicle.Id;
            Truck_Fleet_Transfer__c.Status__c = 'Draft';
            Truck_Fleet_Transfer__c.Description__c = $scope.remarksText;
            if ($scope.transfer) {
              Truck_Fleet_Transfer__c.Id = $scope.transfer.Id;
            }
          }

          ForceClientService.getForceClient().apexrest(
            $scope.truckFleetTransfer + `${$scope.tapIndex == '1' ? 'Transfer' : 'Scrap'}` + '&transferInfo='
            + JSON.stringify(Truck_Fleet_Transfer__c),
            'POST',
            {},
            null,
            function callBack(res) {

              AppUtilService.hideLoading();

              if (res.status == 'Success') {
                if ($scope.tapIndex == '1') {

                  var confirmPopup = $ionicPopup.confirm({
                    title: '提交转移申请成功',
                    okText: '确定',
                    cancelText: null
                  });
                  confirmPopup.then(function (res) {
                    window.history.back();
                  });

                } else {
                  var confirmPopup = $ionicPopup.confirm({
                    title: '提交报废申请成功',
                    okText: '确定',
                    cancelText: null
                  });
                  confirmPopup.then(function (res) {
                    window.history.back();
                  });
                }

              } else {
                $ionicPopup.alert({
                  title: '提交失败，请再次提交'
                });
              }

            },
            function error(msg) {
              AppUtilService.hideLoading();

              $ionicPopup.alert({
                title: '提交失败，请再次提交'
              });
            }
          );

        };

        $scope.submit = function () {

          if (!$scope.getCustomerInfo) {
            $ionicPopup.alert({
              title: '请选择转出客户'
            });
            return;
          }

          if ($scope.tapIndex == '1') {
            if (!$scope.outCustomerInfo) {
              $ionicPopup.alert({
                title: '请选择转入客户'
              });
              return;
            }
          }

          if (!$scope.vehicle) {
            $ionicPopup.alert({
              title: '请选择转出车档号'
            });
            return;
          }

          AppUtilService.showLoading();

          // Source_Account_ShipTo__c: 转出客户Id
          // Target_Account_ShipTo__c: 转入客户Id(Scrap 不填)
          // Source_Account_CS_Manager__c: Account.Service_Group_Default__r.Manager__c
          // Target_Account_CS_Manager__c: Account.Service_Group_Default__r.Manager__c(Scrap 不填)
          // Truck_Fleet__c: 车档 Id
          // Description__c: 备注

          let Truck_Fleet_Transfer__c = {};

          if ($scope.tapIndex == '1') {

            Truck_Fleet_Transfer__c.Source_Account_ShipTo__c = $scope.getCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Target_Account_ShipTo__c = $scope.outCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Source_Account_CS_Manager__c = $scope.getCustomerInfo.Service_Group_Default__r
                                                                   && $scope.getCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Target_Account_CS_Manager__c = $scope.outCustomerInfo.Service_Group_Default__r
                                                                   && $scope.outCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Truck_Fleet__c = $scope.vehicle.Id;
            Truck_Fleet_Transfer__c.Status__c = 'Submit';
            Truck_Fleet_Transfer__c.Description__c = $scope.remarksText;
            if ($scope.transfer) {
              Truck_Fleet_Transfer__c.Id = $scope.transfer.Id;
            }

          } else {

            Truck_Fleet_Transfer__c.Source_Account_ShipTo__c = $scope.getCustomerInfo.Id;
            Truck_Fleet_Transfer__c.Source_Account_CS_Manager__c = $scope.getCustomerInfo.Service_Group_Default__r
                                                                   && $scope.getCustomerInfo.Service_Group_Default__r.Manager__c;
            Truck_Fleet_Transfer__c.Truck_Fleet__c = $scope.vehicle.Id;
            Truck_Fleet_Transfer__c.Status__c = 'Submit';
            Truck_Fleet_Transfer__c.Description__c = $scope.remarksText;
            if ($scope.transfer) {
              Truck_Fleet_Transfer__c.Id = $scope.transfer.Id;
            }
          }

          ForceClientService.getForceClient().apexrest(
            $scope.truckFleetTransfer + `${$scope.tapIndex == '1' ? 'Transfer' : 'Scrap'}` + '&transferInfo='
            + JSON.stringify(Truck_Fleet_Transfer__c),
            'POST',
            {},
            null,
            function callBack(res) {

              AppUtilService.hideLoading();

              if (res.status == 'Success') {
                if ($scope.tapIndex == '1') {

                  var confirmPopup = $ionicPopup.confirm({
                    title: '提交转移申请成功',
                    okText: '确定',
                    cancelText: null
                  });
                  confirmPopup.then(function (res) {
                    window.history.back();
                  });

                } else {
                  var confirmPopup = $ionicPopup.confirm({
                    title: '提交报废申请成功',
                    okText: '确定',
                    cancelText: null
                  });
                  confirmPopup.then(function (res) {
                    window.history.back();
                  });
                }

              } else {
                $ionicPopup.alert({
                  title: '提交失败，请再次提交'
                });
              }

            },
            function error(msg) {
              AppUtilService.hideLoading();

              $ionicPopup.alert({
                title: '提交失败，请再次提交'
              });
            }
          );

        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
