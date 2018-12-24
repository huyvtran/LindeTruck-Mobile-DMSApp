angular.module('oinio.PriceListController', [])
  .controller('PriceListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ForceClientService, AppUtilService, LocalCacheService) {





    $scope.goToPriceListDetails = function () {
      $state.go('app.priceDetail');
    };

    $scope.goBack =function () {
      window.history.back();
    };

  });
