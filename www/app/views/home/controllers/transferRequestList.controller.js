angular.module('oinio.TransferRequestListController', [])
  .controller('TransferRequestListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ConnectionMonitor, LocalCacheService) {



    $scope.goBack =function () {
      window.history.back();
    };

  });

