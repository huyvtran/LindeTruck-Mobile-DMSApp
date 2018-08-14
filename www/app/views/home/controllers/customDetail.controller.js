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
                        $scope.accountSalesMan=account.Salesman_formula__c;

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
                    console.log("getContacts", contacts);
                    if (contacts.length > 0) {
                        $scope.contentItems = contacts;
                    }
                }, function (error) {
                    $log.error('AccountService.searchAccounts Error ' + error);
                });
            };

            document.getElementById("contactsInfo").style.display = "none";//隐藏
            document.getElementById("contractInfo").style.display = "none";//隐藏
            document.getElementById("labelInfo").style.display = "none";//隐藏
            document.getElementById("offerInfo").style.display = "none";//隐藏
            document.getElementById("carstopInfo").style.display = "none";//隐藏
            document.getElementById("businessInfo").style.display = "none";//隐藏
            document.getElementById("workorderInfo").style.display = "none";//隐藏

            $scope.toDisplayBaseInfo = function () {
                if (document.getElementById("div_baseInfo").style.display == "none") {
                    document.getElementById("div_baseInfo").style.display = "";//显示
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("div_baseInfo").style.display = "none";//隐藏
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayContacts = function () {//联系人
                if (document.getElementById("contactsInfo").style.display == "none") {
                    document.getElementById("contactsInfo").style.display = "";//显示
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("contactsInfo").style.display = "none";//隐藏
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayContract = function () {//合同
                if (document.getElementById("contractInfo").style.display == "none") {
                    document.getElementById("contractInfo").style.display = "";//显示
                    document.getElementById("div_ContractImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("contractInfo").style.display = "none";//隐藏
                    document.getElementById("div_ContractImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayLabel = function () {//标签
                if (document.getElementById("labelInfo").style.display == "none") {
                    document.getElementById("labelInfo").style.display = "";//显示
                    document.getElementById("div_LabelImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("labelInfo").style.display = "none";//隐藏
                    document.getElementById("div_LabelImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayOffer = function () {//报价
                if (document.getElementById("offerInfo").style.display == "none") {
                    document.getElementById("offerInfo").style.display = "";//显示
                    document.getElementById("div_OfferImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("offerInfo").style.display = "none";//隐藏
                    document.getElementById("div_OfferImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayCarstop = function () {//车档
                if (document.getElementById("carstopInfo").style.display == "none") {
                    document.getElementById("carstopInfo").style.display = "";//显示
                    document.getElementById("div_CarstopImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("carstopInfo").style.display = "none";//隐藏
                    document.getElementById("div_CarstopImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayBusiness = function () {//商机
                if (document.getElementById("businessInfo").style.display == "none") {
                    document.getElementById("businessInfo").style.display = "";//显示
                    document.getElementById("div_BusinessImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("businessInfo").style.display = "none";//隐藏
                    document.getElementById("div_BusinessImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayWorkorder = function () {//工单
                if (document.getElementById("workorderInfo").style.display == "none") {
                    document.getElementById("workorderInfo").style.display = "";//显示
                    document.getElementById("div_WorkorderImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("workorderInfo").style.display = "none";//隐藏
                    document.getElementById("div_WorkorderImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.goBack = function () {
                $ionicHistory.goBack();
            }
        });


})();

