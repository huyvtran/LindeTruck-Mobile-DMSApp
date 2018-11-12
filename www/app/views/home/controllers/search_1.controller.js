(function () {
    'use strict';

    angular.module('oinio.Search_1controllers', [])
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
                //AppUtilService.showLoading();
                $scope.contentItems=[];
                $scope.isShow=true;
                $scope.items =  loadingData();
                $scope.searchText ="";
                window.setTimeout(function () {
                    $("input").trigger("click").focus();
                },200);
            });

            $scope.searchChange =function(){
                $scope.isShow=true;
            };
            $scope.showChildInfoList = function (type,keyWord) {
                console.log("showChildInfoList");
                $scope.searchText = "";
                $scope.isShow=false;

                if (keyWord==null||keyWord==null){
                    return;
                }
                //AppUtilService.showLoading();
                switch (type){
                    case "查询订单":
                        getOrderList(keyWord);
                        break;
                    case "查询车档":
                        getCarList(keyWord);
                        break;
                    case "查询客户":
                        getGoodsList(keyWord);
                        break;
                }
            };

            var getOrderList =function (keyWord) {
                //AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "结果",
                    template: "没有订单数据"
                });
                ionPop.then(function () {
                    //$ionicHistory.goBack();
                    window.history.back();
                });
            };

            $scope.goBack = function () {
                //$ionicHistory.goBack();
                window.history.back();
            };

            var getCarList =function (keyWord) {
                //AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "结果",
                    template: "没有车档数据"
                });
                ionPop.then(function () {
                    //$ionicHistory.goBack();
                    window.history.back();
                });
            };

            var getGoodsList =function (keyWord) {
                AppUtilService.showLoading();
                //调用接口获取结果
                AccountService.searchAccounts(keyWord).then(function (response) {
                    console.log("AccountServicegw",keyWord);
                    let accountsName = [];
                    let accountsId = [];
                    if (response.length > 0) {
                        for (let index = 0; index < response.length; index++) {
                            accountsName.push(response[index]);
                            accountsId.push(response[index].Id);
                        }
                        $scope.contentItems = accountsName;
                        $scope.getIds = accountsId;
                        console.log("AccountServicegw11",response.length);
                    }
                    else {
                        var ionPop = $ionicPopup.alert({
                            title: "结果",
                            template: "没有客户数据"
                        });
                        ionPop.then(function () {
                            //$ionicHistory.goBack();
                            $state.go("app.home");
                        });
                    }
                }, function (error) {
                    $log.error('AccountService.searchAccounts Error ' + error);
                }).finally(function () {
                    AppUtilService.hideLoading();
                });
            };
            var loadingData = function () {
                //AppUtilService.hideLoading();
                console.log("get type data");
                return ["查询订单", "查询车档", "查询客户"];
            };


        });
       
})();

