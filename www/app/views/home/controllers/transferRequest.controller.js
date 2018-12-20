angular.module('oinio.TransferRequestController', [])
  .controller('TransferRequestController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ConnectionMonitor, LocalCacheService) {


    $scope.getCustomerInfo = {};
    $scope.outCustomerInfo = {};
    $scope.vehicle = {};

    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {

      $scope.getCustomerInfo = LocalCacheService.get('getCustomerInfo');
      $scope.outCustomerInfo = LocalCacheService.get('outCustomerInfo');
      $scope.vehicle = LocalCacheService.get('vehicle');
      if ($scope.getCustomerInfo) {
        $scope.getCustomerText = $scope.getCustomerInfo.Address__c + '/' + $scope.getCustomerInfo.Phone + '/' + $scope.getCustomerInfo.Id;
      }
      if ($scope.outCustomerInfo) {
        $scope.outCustomerText = $scope.outCustomerInfo.Address__c + '/' + $scope.outCustomerInfo.Phone + '/' + $scope.outCustomerInfo.Id;
      }
      if ($scope.vehicle) {
        $scope.vehicleTypeText = $scope.vehicle + '/' + $scope.vehicle + '/' + $scope.vehicle;
      }

    });



    $scope.openSelectPage = function (type) {
      $state.go('app.searchCustomer',{customerType: type});
    };

    $scope.openVehicleNumberPage = function () {
      if ($scope.getCustomerInfo) {
        $state.go('app.searchVehicle',{acctId:$scope.getCustomerInfo.Id});
      } else {
        $ionicPopup.alert({
          title: '请先选择转出客户'
        });
      }
    };

    $scope.goBack =function () {
      window.history.back();
    };

  });
