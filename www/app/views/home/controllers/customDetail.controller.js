(function () {
    'use strict';

    angular.module('oinio.CustomDetailController', [])
        .controller('CustomDetailController', function ($scope, $ionicPopup,$rootScope, $filter, $state ,$stateParams, $ionicHistory, AccountService) {

            //调用接口获取结果
            console.log("$stateParams.SendPassId", $stateParams.SendPassId);
            AccountService.getAccount($stateParams.SendPassId).then(function (account) {
                console.log("getAccount", account);

                if (account != null) {
                    document.getElementById("accountName").textContent = account.Name;
                    
                    document.getElementById("accountAddress").textContent = account.Address__c;
                    document.getElementById("accountSAP").textContent = account.SAP_Number__c;

                    console.log("getAccountgw", account.Name);
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
            
            //调用接口获取结果
            AccountService.getContacts("001p000000Qx9m2AAB").then(function (contacts) {
                console.log("getContacts", contacts);
                let accountsName = [];
                if (contacts.length > 0) {
                    for (let index = 0; index < contacts.length; index++) {
                        accountsName.push(contacts[index].Name);
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

