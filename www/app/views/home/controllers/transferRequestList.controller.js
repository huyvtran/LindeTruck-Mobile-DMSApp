angular.module('oinio.TransferRequestListController', [])
  .controller('TransferRequestListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ConnectionMonitor, LocalCacheService) {


    $scope.selectedTapIndex = '1';

    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {
      LocalCacheService.del('getCustomerInfo');
      LocalCacheService.del('outCustomerInfo');
      LocalCacheService.del('vehicle');
    });


    $scope.goTransferRequest = function (){
      $state.go('app.transferRequest');
    };


    $scope.changeTruckTabWithCP = function (index) {
      $scope.selectedTapIndex = index;
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

    $scope.goBack =function () {
      window.history.back();
    };

  });

