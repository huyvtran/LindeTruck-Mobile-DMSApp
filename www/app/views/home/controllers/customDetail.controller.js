(function () {
    'use strict';

    angular.module('oinio.CustomDetailController', [])
        .controller('CustomDetailController', function ($scope, $ionicPopup,$rootScope, $filter, $log,$state ,$stateParams, $ionicHistory, AccountService
        ,AppUtilService) {
            $scope.$on("$ionicView.beforeEnter",function () {
                $scope.accountName="";
                $scope.accountAddress="";
                $scope.accountSAP="";
            });

            $scope.$on("$ionicView.enter",function () {
                //AppUtilService.showLoading();
                getBaseInfo();
                getContactInfo();
            });

            $scope.$on("$ionicView.leave",function () {

            });

            //获取基础信息
            var getBaseInfo = function(){
                //调用接口获取结果
                console.log("$stateParams.SendPassId", $stateParams.SendPassId);
                AccountService.getAccountWithDetails($stateParams.SendPassId).then(function (account) {
                    console.log("getAccount", account);

                    if (account != null) {
                        $scope.accountName=account.Name;
                        $scope.accountAddress=account.Address__c;

                        account.Salesman__r.then(function(account){
 
                            if(typeof (account) != 'undefined'){
                                $scope.accountSalesMan=account.Name;
                            }
                            
                        }, function (error) {
                            $log.error('getAccount(Id).then error ' + error);
                        });

                        account.BTU__r.then(function(account){
                            if(typeof (account) != 'undefined'){
                                $scope.accountGroup=account.Name;
                            }

                        }, function (error) {
                            $log.error('getAccount(Id).then error ' + error);
                        });
                      
                    }
                    else {
                        $ionicPopup.alert({
                            title: "搜索结果",
                            template: "没有数据"
                        });
                    }
                }, function (error) {
                    $log.error('AccountService.searchAccounts Error ' + error);
                });
            };

            //获取联系人信息
            var getContactInfo =function(){
                //调用接口获取结果 $rootScope.accountId  "001p000000Qx9m2AAB"
                AccountService.getContacts($stateParams.SendPassId).then(function (contacts) {
                    //{"Id":"003p000000MnltsAAB","Name":"吴工","MobilePhone":null}
                    console.log("getContacts", contacts);
                    //let accountsNames = [];
                    if (contacts.length > 0) {
                        // for (let index = 0; index < contacts.length; index++) {
                        //     accountsNames.push(contacts[index].Name);
                        // }
                        //$scope.contentItems = accountsNames;
                        $scope.contentItems = contacts;
                    }
                    else {
                        $ionicPopup.alert({
                            title: "搜索结果",
                            template: "联系人信息没有数据"
                        });
                    }
                }, function (error) {
                    $log.error('AccountService.searchAccounts Error ' + error);
                });
            };


            $scope.toDisplayBaseInfo = function () {
                if (document.getElementById("div_baseInfo").style.display == "none") {
                    document.getElementById("div_baseInfo").style.display = "";//隐藏
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("div_baseInfo").style.display = "none";//隐藏
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayContacts = function () {
                if (document.getElementById("contactsInfo").style.display == "none") {
                    document.getElementById("contactsInfo").style.display = "";//隐藏
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("contactsInfo").style.display = "none";//隐藏
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.goBack = function () {
                $ionicHistory.goBack();
            }
        });


})();

