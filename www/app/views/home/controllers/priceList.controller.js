angular.module('oinio.PriceListController', [])
  .controller('PriceListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ForceClientService, AppUtilService, LocalCacheService) {


    var oCurrentUser = LocalCacheService.get('currentUser') || {};

    $scope.queryList = '/ServiceQuoteOverviewService?action=queryList&userId=';
    $scope.priceListItems = [];



    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {
      AppUtilService.showLoading();
      //人工
      ForceClientService.getForceClient().apexrest($scope.queryList +  oCurrentUser.Id, 'GET', {}, null, function (response) {
        console.log('success:', response);
        $scope.priceListItems = response;
        AppUtilService.hideLoading();
      }, function (error) {
        console.log('error:', error);
        AppUtilService.hideLoading();
      });
    });

    $scope.goToPriceListDetails = function (priceItem) {
      $state.go('app.priceDetail',{overviewId:priceItem.Id});
    };

    $scope.goBack =function () {
      window.history.back();
    };

  });
