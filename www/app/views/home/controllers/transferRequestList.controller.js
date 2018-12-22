angular.module('oinio.TransferRequestListController', [])
  .controller('TransferRequestListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,  ForceClientService, AppUtilService, LocalCacheService) {


    $scope.selectedTapIndex = LocalCacheService.get('tapIndex');
    $scope.truckFleetTransfer = '/TruckFleetTransferService?action=getInitInfo&userId=';
    $scope.scrapLists = [];
    $scope.scrapAllLists = [];
    $scope.transferList = [];
    $scope.transferAllList = [];
    $scope.transSelected = '';
    $scope.scrapSelected = '';
    $scope.statusTypes = [{'name':'草稿','type':'Draft'},{'name':'已提交','type':'Sub'},{'name':'已审批','type':'Approval'}];
    var oCurrentUser = LocalCacheService.get('currentUser') || {};



    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {
      LocalCacheService.del('getCustomerInfo');
      LocalCacheService.del('outCustomerInfo');
      LocalCacheService.del('vehicle');

      if ($scope.selectedTapIndex === '1') {

        $('#selectTruckCP_Tab_1').addClass('selectTruckCP_Tab_Active');
        $('#selectTruckCP_Tab_2').removeClass('selectTruckCP_Tab_Active');

        $('#selectTruckCP_result').css('display', 'block');
        $('#selectTruckCP_checked').css('display', 'none');

      } else if ($scope.selectedTapIndex === '2') {

        $('#selectTruckCP_Tab_1').removeClass('selectTruckCP_Tab_Active');
        $('#selectTruckCP_Tab_2').addClass('selectTruckCP_Tab_Active');

        $('#selectTruckCP_result').css('display', 'none');
        $('#selectTruckCP_checked').css('display', 'block');
      }


      ForceClientService.getForceClient().apexrest(
        $scope.truckFleetTransfer + oCurrentUser.Id,
        'GET',
        {},
        null,
        function callBack(res) {

          AppUtilService.hideLoading();

          $scope.transferList =  res.Transfer;
          $scope.scrapLists = res.Scrap;
          $scope.transferAllList =  res.Transfer;
          $scope.scrapAllLists  = res.Scrap;

        },
        function error(msg) {
          AppUtilService.hideLoading();

        }
      );

    });

    $scope.getStatusType = function (status){
      if (status == 'Draft') {
        return '草稿';
      } else if (status == 'Sub') {
        return '已提交';
      } else if (status == 'Approval') {
        return '已审批';
      }
    };



    $scope.selectTransChange = function (status){
      var statusType = '';
      if (status == '草稿') {
        statusType = 'Draft';
      } else if (status == '已提交') {
        statusType = 'Sub';
      } else if (status == '已审批') {
        statusType = 'Approval';
      }

      $scope.transferList =  _.filter($scope.transferAllList, function (statusItem) {
        return statusItem.Status__c == statusType;
      });

    };

    $scope.selectScrapChange = function (status){
      var statusType = '';
      if (status == '草稿') {
        statusType = 'Draft';
      } else if (status == '已提交') {
        statusType = 'Sub';
      } else if (status == '已审批') {
        statusType = 'Approval';
      }

      $scope.scrapLists =  _.filter($scope.scrapAllLists, function (statusItem) {
        return statusItem.Status__c == statusType;
      });

    };



    $scope.goToTransferDetails = function (transfer){
      $state.go('app.transferRequest',{transfer:transfer});
    };



    $scope.goTransferRequest = function (){
      $state.go('app.transferRequest');
    };

    $scope.goScrapListsRequest = function (){
      $state.go('app.transferRequest');
    };

    $scope.changeTruckTabWithCP = function (index) {
      LocalCacheService.set('tapIndex',index);

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

