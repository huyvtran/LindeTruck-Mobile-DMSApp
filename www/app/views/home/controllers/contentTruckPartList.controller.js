angular.module('oinio.ContentTruckPartListController', [])
  .controller('ContentTruckPartListController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService, ConnectionMonitor, LocalCacheService, ForceClientService) {

    var vm = this;
    $scope.contentTruckFitItems = [];//配件
    $scope.data = {};
    $scope.getPersonalPartListService="/PersonalPartListService?action=getParts&userId=";
    $scope.createParentName="/PersonalPartListService?action=createParent&typeName=";
    $scope.delPartList="/PersonalPartListService?action=delPartList&PartListIds=";

    var oCurrentUser = LocalCacheService.get('currentUser') || {};



    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {

      $scope.contentTruckFitItems = [{cartName:'ACCBT',cartList:[{itemIdentifier:'配件名1',quantity:'200'},{itemIdentifier:'配件名3',quantity:'200'},{itemIdentifier:'配件名2',quantity:'200'},{itemIdentifier:'配件名4',quantity:'200'}]}];

      $scope.refreshrData();

    });


    $scope.refreshrData = function () {
      AppUtilService.showLoading();

      ForceClientService.getForceClient().apexrest(
        $scope.getPersonalPartListService+oCurrentUser.Id,
        'GET',
        {},
        null,
        function callBack(res) {
          $scope.contentTruckFitItems = res;
          AppUtilService.hideLoading();

          console.log(res);
        },
        function error(msg) {
          AppUtilService.hideLoading();
          console.log(msg);
        }
      );
    };


    $scope.$on('$ionicView.enter', function () {
      // check if device is online/offline

    });

    $scope.toggleGroup = function (group) {
      group.show = !group.show;
      // console.log("toggleGroup:", group);
    };

    $scope.isGroupShown = function (group) {
      // console.log("isGroupShown:", group);
      return group.show;
    };

    $scope.deleteMoreTruck = function (group) {

      $ionicPopup.show({
        title: "是否删除配件？",
        buttons: [
          {
            text: "取消",
            onTap: function () {
              return true;
            }
          },
          {
            text: "确认",
            onTap: function () {

              ForceClientService.getForceClient().apexrest(
                $scope.delPartList + JSON.stringify([group.Id]) + "&userId=" + oCurrentUser.Id,
                'POST',
                {},
                null,
                function callBack(res) {

                  AppUtilService.hideLoading();
                  $scope.refreshrData();
                  console.log(res);
                },
                function error(msg) {
                  AppUtilService.hideLoading();
                  console.log(msg);
                }
              );

              return true;
            }
          }
        ]
      });

    };

    //添加分类配件
    $scope.addClassificationParts = function (group) {
      $state.go('app.newContentTruckPart',{partItem : group});
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
                // return $scope.data.fitItemName;

                AppUtilService.showLoading();

                ForceClientService.getForceClient().apexrest(
                  $scope.createParentName+$scope.data.fitItemName  + "&userId=" + oCurrentUser.Id,
                  'POST',
                  {},
                  null,
                  function callBack(res) {
                    AppUtilService.hideLoading();
                    $scope.refreshrData();
                  },
                  function error(msg) {
                    AppUtilService.hideLoading();
                    console.log(msg);
                  }
                );

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
