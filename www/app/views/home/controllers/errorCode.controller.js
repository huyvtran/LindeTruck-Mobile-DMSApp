angular.module('oinio.ErrorCodeController', [])
  .controller('ErrorCodeController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, ConnectionMonitor, LocalCacheService, ErrorCodeServices) {

    var vm = this;
    $scope.seriesIds = [];
    $scope.carTypes = [];
    $scope.codeDescription = '';
    $scope.condition = '';
    $scope.possibleReasion = '';


    /**
     * @func    $scope.$on('$ionicView.beforeEnter')
     * @desc
     */
    $scope.$on('$ionicView.beforeEnter', function () {

      ErrorCodeServices.getAllTruckSeries().then(function (seriesIds) {

        console.log('codeFile',seriesIds);

        $scope.seriesIds = seriesIds;

      }, function (error) {
        $log.error('ErrorCodeController.ionicView.beforeEnter Error ' + error);
      })

    });
    $scope.$on('$ionicView.enter', function () {
      // check if device is online/offline

    });

    $scope.goToSearch = function () {

      const series = $("#series_select").val();
      if (!series) {
        $ionicPopup.show({
          title: "请输入车系",
          buttons: [
            {
              text: "确定",
            }
          ]
        });
        return;
      }
      const carType = $("#carType_select").val();
      if (!carType) {
        $ionicPopup.show({
          title: "请输入车型",
          buttons: [
            {
              text: "确定",
            }
          ]
        });
        return;
      }
      const errorCode = $("#truckErrorCode").val();
      if (!series) {
        $ionicPopup.show({
          title: "请输入错误Code",
          buttons: [
            {
              text: "确定",
            }
          ]
        });
        return;
      }

      ErrorCodeServices.queryTruckErrorInfo(series, carType, errorCode ).then(function (errorInfo) {

        $scope.codeDescription = _.first(errorInfo).CodeDescription;
        $scope.condition = _.first(errorInfo).Condition;
        $scope.possibleReasion = _.first(errorInfo).PossibleReasion;

      }, function (error) {

        $log.error('ErrorCodeController.goToSearch Error ' + error);

      });

    };

    /**
     * SeriesId选择
     * */
    $scope.selectSeriesChange = function (seriesId) {

      console.log('seriesId',seriesId);
      ErrorCodeServices.getTruckSeriesOfAllCarType(seriesId).then(function (carTypes) {
        console.log('carTypes',carTypes);
        $scope.carTypes = carTypes;
      }, function (error) {
        $log.error('ErrorCodeController.selectSeriesChange Error ' + error);
      })

    };

    $scope.goBack =function () {
      window.history.back();
    };

  });
