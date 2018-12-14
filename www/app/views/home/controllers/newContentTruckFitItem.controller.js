angular.module('oinio.NewContentTruckFitItemController', [])
  .controller('NewContentTruckFitItemController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService, ConnectionMonitor, LocalCacheService, ErrorCodeServices) {

    var vm = this;
    $scope.contentTruckFitItems = [];//配件
    $scope.data = {};


    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {


    });

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


    //添加分类配件
    $scope.addClassificationParts = function (group) {

    };

    $scope.addFitItemList = function () {

      $ionicPopup.show({
        template: '<input type="text" ng-model="data.fitItemName">',
        title: '输入配件分类名称',
        scope: $scope,
        buttons: [
          { text: '取消' },
          {
            text: '<b>添加</b>',
            type: 'button-positive',
            onTap: function(e) {
              if (!$scope.data.fitItemName) {
                //不允许用户关闭，除非他键入wifi密码
                e.preventDefault();
              } else {
                return $scope.data.fitItemName;
              }
            }
          },
        ]
      });
    };


    $scope.closeSelectPage =function () {
      window.history.back();
    };

  });
