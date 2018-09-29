angular.module('oinio.NewOfferFittingsController', [])
    .controller('NewOfferFittingsController', function ($scope, $http, $ionicPopup, $stateParams, HomeService, $state, AppUtilService ,$rootScope, SQuoteService, ForceClientService) {

        // var forceClient = ForceClientService.getForceClient();
        // console.log("forceClient", forceClient);
        $scope.serviceFeeList = [];
        $scope.quoteLabourOriginalsList = [];
        $scope.manMadeNo1 = 0;
        $scope.manMadeNo2 = 0;
        $scope.manMadeNo3 = 0;
        $scope.manMadePrice3 = 0;
        $scope.discountPrice3 = 0;
        var manMadeNo1Id;
        var manMadeNo2Id;
        var manMadeNo1Name;
        var manMadeNo2Name;
        $scope.paramUrl1 = "/Parts/7990110000/" + $stateParams.SendSoupEntryId;
        $scope.paramUrl2 = "/Parts/7990110003/" + $stateParams.SendSoupEntryId;
        $scope.paramSaveUrl = "/ServiceQuoteOverview?";

        $scope.get = function () {
            ForceClientService.getForceClient().apexrest($scope.paramUrl1, 'GET', {}, null, function (response) {
                console.log("success:", response);
                let responseItem = response.priceCondition;
                $scope.manMadePrice1 = responseItem.price;
                $scope.discountPrice1 = responseItem.discount;
                manMadeNo1Id = response.Id;
                manMadeNo1Name = response.parts_description__c;
            }, function (error) {
                console.log("error:", error);
            });
            ForceClientService.getForceClient().apexrest($scope.paramUrl2, 'GET', {}, null, function (response) {
                console.log("success:", response);
                let responseItem = response.priceCondition;
                $scope.manMadePrice2 = responseItem.price;
                $scope.discountPrice2 = responseItem.discount;
                manMadeNo2Id = response.Id;
                manMadeNo2Name = response.parts_description__c;
            }, function (error) {
                console.log("error:", error);
            });
        }
       
        $scope.$on('$ionicView.enter', function () {
            console.log("NewOfferFittingsController");
            $scope.get();
        });
        $scope.goBack = function () {
            window.history.back();
        };


        $scope.toAddSVView = function () {
            var serviceFeeName = $("#serviceFeeName").val();
            if (serviceFeeName == "") {
                var ionPop = $ionicPopup.alert({
                    title: "请填写劳务项目"
                });
                return;
            }
            $scope.serviceFeeList.push(serviceFeeName);
            $("#serviceFeeName").val("");
        };
        Array.prototype.baoremove = function (dx) {
            if (isNaN(dx) || dx > this.length) { return false; }
            this.splice(dx, 1);
        };

        $scope.toDelSVView = function (index) {
            $scope.serviceFeeList.baoremove(index);
            
        };

        $scope.sum = function (obj) {
            // var manMadePrice1 = document.getElementById("manMadePrice1");
            // var manMadeNo1 = document.getElementById("manMadeNo1");

            // if ($scope.manMadeNo1 != '') {
            //     console.log("index", parseInt($scope.manMadePrice1)+ "  "+parseInt($scope.manMadeNo1));
            //     $scope.sumPrice1 = parseInt($scope.manMadePrice1) * parseInt($scope.manMadeNo1);
            // }                
        };
        $scope.addLabourOriginalsList = function (obj) {
            var oneLabourOriginals1 = {};
            oneLabourOriginals1["Service_Quote__c"] = manMadeNo1Id;
            oneLabourOriginals1["Name"] = manMadeNo1Name;
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals1);
            var oneLabourOriginals2 = {};
            oneLabourOriginals2["Service_Quote__c"] = manMadeNo2Id;
            oneLabourOriginals2["Name"] = manMadeNo2Name;
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals2);
        };
        $scope.toSaveServiceQuoteOverview = function (payload) {
            AppUtilService.showLoading();
            $scope.addLabourOriginalsList();
            var serviceQuoteOverview = {};
            serviceQuoteOverview["Ship_to__c"] = $stateParams.SendSoupEntryId;

            // var serviceQuotes = [];//车辆
            // var quoteLabourOriginals = [];//劳务费
            for (let index = 0; index < $stateParams.SendAllUser.length; index++) {
                const element = $stateParams.SendAllUser[index];
                delete element.levels;
                delete element.descriptions;
                delete element.Id;
                delete element.Name;
            }
            var payload =$scope.paramSaveUrl+ "serviceQuoteOverview="+JSON.stringify(serviceQuoteOverview)+"&serviceQuotes="+ JSON.stringify($stateParams.SendAllUser)+ "&quoteLabourOriginals="+JSON.stringify($scope.quoteLabourOriginalsList);
            console.log("payload",payload);


            ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
                AppUtilService.hideLoading();
                console.log("POST_success:", response);
                var ionPop = $ionicPopup.alert({
                    title: "保存成功"
                });
                ionPop.then(function (res) {
                    window.history.back(-1);
                    window.history.back(-1);
                });
            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "保存失败"
                });
            });
        };
    });

