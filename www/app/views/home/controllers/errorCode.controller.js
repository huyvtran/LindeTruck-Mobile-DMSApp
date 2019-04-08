(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('ErrorCodeController',
      function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams, AppUtilService, ConnectionMonitor,
                LocalCacheService, ErrorCodeServices) {

        var vm = this;
        $scope.codeFiles = [];
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

          $log.log('>>>> URL：', $scope.getPartsForReadUrl1);

          AppUtilService.showLoading();
          ErrorCodeServices.getErrorCodeAllData().then(function (codeFiles) {

            $scope.codeFiles = codeFiles;

            ErrorCodeServices.getAllTruckSeries(codeFiles).then(function (seriesIds) {

              AppUtilService.hideLoading();
              $scope.seriesIds = seriesIds;

            }, function (error) {
              $log.error('ErrorCodeController.ionicView.beforeEnter Error ' + error);
            });

          }, function (error) {
            AppUtilService.hideLoading();
            if (error.responseJSON[0]) {
              $ionicPopup.show({
                title: error.responseJSON[0].message,
                buttons: [
                  {
                    text: "确定",
                  }
                ]
              });
            }
            // $log.error('ErrorCodeController.ionicView.beforeEnter Error ' + error);
          });

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
          if (!errorCode) {
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

          AppUtilService.showLoading();
          ErrorCodeServices.queryTruckErrorInfo($scope.codeFiles, series, carType, errorCode).then(
            function (errorInfo) {
              AppUtilService.hideLoading();
              var errorMsg = _.first(errorInfo);

              if (errorMsg) {
                $scope.codeDescription = errorMsg && errorMsg.CodeDescription__c;
                $scope.condition = errorMsg && errorMsg.Condition__c;
                $scope.possibleReasion = errorMsg && errorMsg.PossibleReasion__c;
              } else {
                $ionicPopup.show({
                  title: "没有对应的错误信息",
                  buttons: [
                    {
                      text: "确定",
                    }
                  ]
                });
              }

            }, function (error) {
              AppUtilService.hideLoading();
              $ionicPopup.show({
                title: "没有对应的错误信息",
                buttons: [
                  {
                    text: "确定",
                  }
                ]
              });
            });

        };

        /**
         * SeriesId选择
         * */
        $scope.selectSeriesChange = function (seriesId) {

          AppUtilService.showLoading();
          ErrorCodeServices.getTruckSeriesOfAllCarType($scope.codeFiles, seriesId).then(function (carTypes) {
            console.log('carTypes', carTypes);
            $scope.carTypes = carTypes;
            AppUtilService.hideLoading();
          }, function (error) {
            AppUtilService.hideLoading();
            $log.error('ErrorCodeController.selectSeriesChange Error ' + error);
          })

        };

        $scope.goBack = function () {
          window.history.back();
        };

      });
})();
