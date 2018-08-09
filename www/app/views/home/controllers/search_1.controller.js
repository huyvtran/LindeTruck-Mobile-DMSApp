(function () {
    'use strict';

    angular.module('oinio.Search_1controllers', [])
        .controller('Search_1Controller', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
            LocalCacheService,$ionicHistory,AppUtilService,AccountService,$ionicPopup) {
            var vm = this;



            $scope.toRepair4 = function (){
                console.log("toRepair4");
                 $state.go('app.customDetail');

             };

            $scope.$on("$ionicView.enter",function () {
                AppUtilService.showLoading();
                $scope.isShow=true;
                $scope.items =  loadingData();
            });



            $scope.showChildInfoList = function () {
                console.log("showChildInfoList");
                $scope.searchText = "";
                $scope.isShow=false;
                
                 //调用接口获取结果
                 AccountService.searchAccounts("buwen").then(function (response) {
                    console.log("AccountServicegw",response[0]);
                    console.log("AccountServicegw",response[1]);
                    console.log("AccountServicegw",response);
                    let accountsName = [];
                    if (response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            accountsName.push(response[index].Name);
                        }
                        $scope.contentItems = accountsName;
                    }
                    else {
                        $ionicPopup.alert({
                            title: "结果",
                            template: "没有数据"
                        });
                    }
                }, function (error) {
                    $log.error('AccountService.searchAccounts Error ' + error);
                });    
            };


            var loadingData = function () {
                AppUtilService.hideLoading();
                return ["查询订单", "查询车档", "查询发货单"];
            };
        });
       
})();

