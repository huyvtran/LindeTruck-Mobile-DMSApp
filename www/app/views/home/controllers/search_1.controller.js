(function () {
    'use strict';

    angular.module('oinio.Search_1controllers', [])
        // .filter('filterSearchChild',function () {
        //     return function (text) {
        //             return text.indexOf($scope.searchChildText);
        //     };
        // })
        .controller('Search_1Controller', function ($scope, $rootScope, $log,$filter, $state, $stateParams, ConnectionMonitor,
            LocalCacheService,$ionicHistory,AppUtilService,AccountService,$ionicPopup) {
            var vm = this;
            let passId;
            $scope.toRepair4 = function (item){
                console.log("toRepair4item",item);
                $state.go('app.customDetail', {SendPassId: item});
             };

            $scope.$on("$ionicView.enter",function () {
                console.log("init some quantities");
                AppUtilService.showLoading();
                $scope.searchText ="";
                //$scope.searchChildText ="";
                $scope.button_clicked=false;
                $scope.isShow=true;
                //$scope.isBigTypeShow = true;
                $scope.items =  loadingData();
            });

            $scope.clearParentType =function(){
                $scope.searchText ="";
            };
            $scope.clearChildType = function(){
                //$scope.searchChildText ="";
            };

            $scope.showChildInfoList = function (keyWord) {
                console.log("showChildInfoList");
                $scope.button_clicked=true;
                $scope.searchText = "";
                //$scope.isBigTypeShow=false;
                $scope.isShow=false;

                 //调用接口获取结果
                 AccountService.searchAccounts(keyWord).then(function (response) {
                    console.log("AccountServicegw",response);
                    let accountsName = [];
                    let accountsId = [];
                    if (response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            accountsName.push(response[index]);
                            accountsId.push(response[index].Id);
                        }
                        $scope.contentItems = accountsName;
                        $scope.getIds = accountsId;
                        console.log("AccountServicegw11",accountsName);
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
                console.log("get type data");
                return ["查询订单", "查询车档", "查询发货单"];
            };
        });
       
})();

