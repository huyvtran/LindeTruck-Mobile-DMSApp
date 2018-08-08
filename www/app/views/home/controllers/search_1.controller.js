(function () {
    'use strict';

    angular.module('oinio.Search_1controllers', [])
        .controller('Search_1Controller', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
            LocalCacheService,$ionicHistory,AppUtilService) {
            var vm = this;



            $scope.toRepair4 = function (){
                console.log("toRepair4");
                $state.go('app.customDetail');
             };

            $scope.$on("$ionicView.enter",function () {
                AppUtilService.showLoading();
                $scope.items =  loadingData();
            });



            $scope.showChildInfoList = function () {
                console.log("showChildInfoList");
                $scope.searchText = '';
                $scope.items = ["100130011","100130012","100130013"];
                //console.log("AccountService",AccountService.searchAccounts("查询发货单 001"));
            };


            var loadingData = function () {
                AppUtilService.hideLoading();
                return ["查询订单", "查询车档", "查询发货单"];
            };
        });
       
})();

