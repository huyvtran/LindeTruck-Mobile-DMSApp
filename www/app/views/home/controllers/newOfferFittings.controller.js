angular.module('oinio.NewOfferFittingsController', [])
    .controller('NewOfferFittingsController', function ($scope, $http, $ionicPopup, $stateParams, HomeService, $state, AppUtilService, $rootScope, SQuoteService, ForceClientService) {

        // var forceClient = ForceClientService.getForceClient();
        // console.log("forceClient", forceClient);
        $scope.contentTruckFitItems = [];//配件
        $scope.selectedTruckFitItems = [];
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
        $scope.contentLSGs = [];//LSG
        $scope.paramUrl1 = "/Parts/7990110000/" + $stateParams.SendSoupEntryId;
        $scope.paramUrl2 = "/Parts/7990110003/" + $stateParams.SendSoupEntryId;
        $scope.paramSaveUrl = "/ServiceQuoteOverview?";
        $scope.paramApprovalsUrl = "/v38.0/process/approvals";
        $scope.paramExeclUrl = "/excel/";
        $scope.searchPartssUrl = "/Partss?keyword=";
        $scope.partsRelatedsUrl = "/PartsRelateds?partsNumbers=";
        $scope.partLSGServer = "/LSGServer";
        $scope.get = function () {
            AppUtilService.showLoading();
            //人工
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

            //交通
            ForceClientService.getForceClient().apexrest($scope.paramUrl2, 'GET', {}, null, function (response) {
                console.log("success:", response);
                AppUtilService.hideLoading();
                let responseItem = response.priceCondition;
                $scope.manMadePrice2 = responseItem.price;
                $scope.discountPrice2 = responseItem.discount;
                manMadeNo2Id = response.Id;
                manMadeNo2Name = response.parts_description__c;
            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();
            });

        }
        $scope.toDisplayImportDiv = function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏

            if (document.getElementById("btn_import_Div").style.display == "none") {
                document.getElementById("btn_import_Div").style.display = "";//显示

            } else {
                document.getElementById("btn_import_Div").style.display = "none";//隐藏
            }
        };
        $scope.toDisplayModifyDiv = function () {
            document.getElementById("btn_import_Div").style.display = "none";//隐藏

            if (document.getElementById("btn_modify_Div").style.display == "none") {
                document.getElementById("btn_modify_Div").style.display = "";//显示

            } else {
                document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            }
        };
        $scope.$on('$ionicView.beforeEnter', function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_import_Div").style.display = "none";//隐藏

        });
        $scope.$on('$ionicView.enter', function () {
            console.log('接受点击事件');
            document.addEventListener('click', newHandle);//初始化弹框
            $scope.get();
        });

        $scope.$on('$ionicView.beforeLeave', function () {
            console.log('移除点击事件');
            document.removeEventListener('click', newHandle);
        });



        var newHandle = function(e) {
            console.log('e.target',e.target);
            console.log('document.getElementById(btn_modify_Btn)',document.getElementById('btn_modify_Btn'));
            if (e.target === document.getElementById('btn_modify_Btn')) {
                $scope.toDisplayModifyDiv();
            } else {
                if (document.getElementById('btn_modify_Div') && document.getElementById("btn_modify_Div").style) {
                    document.getElementById("btn_modify_Div").style.display = "none";//隐藏
                }
            }
            if (e.target === document.getElementById('btn_import_Btn')) {
                $scope.toDisplayImportDiv();
            } else {
                if (document.getElementById('btn_import_Div') && document.getElementById("btn_import_Div").style) {
                    document.getElementById("btn_import_Div").style.display = "none";//隐藏
                }
            }
          };


        $scope.toDisBothModifyDiv =  function () {
            document.getElementById("btn_modify_Div").style.display = "none";//隐藏
            document.getElementById("btn_import_Div").style.display = "none";//隐藏

        };
        $scope.goBack = function () {
          window.history.back();
        };

        $scope.openSelectPage = function (ele) {
            $scope.toDisBothModifyDiv();
            if (ele === 'selectLSG') {
                $('#selectLSG').css('display', 'block');
                $('#selectTruckFit').css('display', 'none');
                $scope.getLSG();
            } else {
                $('#selectTruckFit').css('display', 'block');
                $('#selectLSG').css('display', 'none');
            }

            $('div.workListDetails_bodyer').animate({
                opacity: '0.6'
            }, 'slow', 'swing', function () {
                $('div.workListDetails_bodyer').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity: '1'
                }, 'normal').show();

                // $('#selectTruckFit').css('display', 'block');
            });
        };
        $scope.closeSelectPage = function () {
            $('div.newWorkList_truckSelect').animate({
                opacity: '0.6'
            }, 'slow', function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.workListDetails_bodyer').animate({
                    opacity: '1'
                }, 'normal').show();
            });
        };
        /**
         *删除数组指定下标或指定对象
         */
        Array.prototype.remove = function (obj) {
            for (var i = 0; i < this.length; i++) {
                var temp = this[i];
                if (!isNaN(obj)) {
                    temp = i;
                }
                if (temp == obj) {
                    for (var j = i; j < this.length; j++) {
                        this[j] = this[j + 1];
                    }
                    this.length = this.length - 1;
                }
            }
        };
        $scope.addDelePartConfirmBtn = function(){//配件添加删除搜索页面 确定按钮
            $('div.newWorkList_truckSelect').animate({
                opacity: '0.6'
            }, 'slow', function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.workListDetails_bodyer').animate({
                    opacity: '1'
                }, 'normal').show();
            });

            if ($scope.contentTruckFitItems.length == 0 &&$scope.searchTruckText!="") {
                var onePartOriginals = {};
                var priceCondition = {};
                onePartOriginals["quantity"] = "";//数量
                onePartOriginals["priceCondition"] = priceCondition["price"];//公布价
                onePartOriginals["View_Integrity__c"] = "";//预留
                onePartOriginals["parts_number__c"] = $scope.searchTruckText;//物料信息
                onePartOriginals["Name"] = $scope.searchTruckText;//Name
                onePartOriginals["materialId"] = $scope.searchTruckText;//物料号
                onePartOriginals["saveId"] = "";//物料号
                onePartOriginals["type"] = "";//配件类型
                $scope.selectedTruckFitItems.push(onePartOriginals);
                $scope.searchTruckText = "";
            }
        };
        //搜索配件
        $scope.getTrucks = function (keyWord) {
            AppUtilService.showLoading();
            $scope.contentTruckFitItems = [];
            console.log("getTrucks::", keyWord);
            let parts_number__cList = [];
            let partsQuantitys = [];
            var getPartsRelatedsKeyWordUrl = $scope.searchPartssUrl + keyWord;
            ForceClientService.getForceClient().apexrest(getPartsRelatedsKeyWordUrl, 'GET', {}, null, function (response) {
                console.log("searchPartssUrl:", response);
                for (let index = 0; index < response.results.length; index++) {
                    let element = response.results[index];
                    parts_number__cList.push(element.parts_number__c);
                    partsQuantitys.push(100000);
                }
                var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + "&partsQuantitys=" + JSON.stringify(partsQuantitys) + "&accountId=" + $stateParams.SendSoupEntryId;
                console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);

                ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                    AppUtilService.hideLoading();
                    console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                    for (let i = 0; i < responsePartsRelateds.length; i++) {
                        var responsePartsRelatedsList = responsePartsRelateds[i];
                        // for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                        //     // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                        //     responsePartsRelatedsList[j]["itemNO"] = j;
                        //     $scope.contentTruckFitItems.push(responsePartsRelatedsList[j]);
                        // }
                        $scope.contentTruckFitItems.push(responsePartsRelatedsList[0]);
                    }
                }, function (error) {
                    console.log("error:", error);
                    AppUtilService.hideLoading();

                });

            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();
            });
        };

        //--清空经济件
        $scope.delByEconomical = function () {
            for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
                let element = $scope.selectedTruckFitItems[index];
                if (element.type =="economical") {
                    setTimeout(function() {
                        $scope.selectedTruckFitItems.remove(element);
                    },50);            
                }
            }
        }

        //--使用经济件
        $scope.useByEconomical = function () {
            for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
                let element = $scope.selectedTruckFitItems[index];
                if (element.type =="common") {
                    setTimeout(function() {
                        $scope.selectedTruckFitItems.remove(element);
                    },50);    
                }
            }
        }
        //搜索配件--导入经济件
        $scope.getTrucksByEconomical = function () {
            AppUtilService.showLoading();
            $scope.contentTruckFitItems = [];
            let parts_number__cList = [];
            let partsQuantitys = [];
            for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
                let element = $scope.selectedTruckFitItems[index];
                if (element.type =="common") {
                    parts_number__cList.push(element.parts_number__c);
                    partsQuantitys.push(100000);
                }
            }
            var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + "&partsQuantitys=" + JSON.stringify(partsQuantitys) + "&accountId=" + $stateParams.SendSoupEntryId;
            console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);
            $scope.selectedTruckFitItems = [];// 清空列表
            ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                AppUtilService.hideLoading();
                console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                        // responsePartsRelatedsList[j]["itemNO"] = j;
                        if (responsePartsRelatedsList[j].type =="common") {
                            $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                        }
                        if (responsePartsRelatedsList[j].type =="economical") {
                            $scope.selectedTruckFitItems.push(responsePartsRelatedsList[j]);
                        }
                    }
                }
            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();
            });

        };


        $scope.checkAllSearchResults = function () {
            let ele = $("#ckbox_truckFit_searchresult_all");

            console.log('checkAllSearchResults:::', ele.prop("checked"));
            if (ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                    $(this).prop("checked", true);
                });

                angular.forEach($scope.contentTruckFitItems, function (searchResult) {
                    let existFlag = false;
                    angular.forEach($scope.selectedTruckFitItems, function (selected) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        $scope.selectedTruckFitItems.push(searchResult);
                        $scope.updateTruckString();
                    }
                });
            } else {

                $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                    console.log('666:::', element.checked);
                    element.checked = false;
                });

                let arr_temp = [];
                angular.forEach($scope.selectedTruckFitItems, function (selected) {
                    let existFlag = false;
                    angular.forEach($scope.contentTruckFitItems, function (searchResult) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        arr_temp.push(selected);
                    }
                });
                $scope.selectedTruckFitItems = arr_temp;
                $scope.updateTruckString();

            }
        };
        $scope.changeTruckTab = function (index) {
            console.log('cssss:::', $('#selectCustomer'));
            if (index === '1') {
                $("#selectTruckFit_Tab_1").addClass("selectTruckFit_Tab_Active");
                $("#selectTruckFit_Tab_2").removeClass("selectTruckFit_Tab_Active");

                $('#selectTruckFit_result').css('display', 'block');
                $('#selectTruckFit_checked').css('display', 'none');
            } else if (index === '2') {
                $("#selectTruckFit_Tab_1").removeClass("selectTruckFit_Tab_Active");
                $("#selectTruckFit_Tab_2").addClass("selectTruckFit_Tab_Active");

                $('#selectTruckFit_result').css('display', 'none');
                $('#selectTruckFit_checked').css('display', 'block');
            }
        };

        $scope.checkSearchResults = function (ele) {
            let element = $("input.ckbox_truck_searchresult_itemFit[data-recordid*='" + ele.Id + "']");
            console.log('checkSearchResults::', element);

            if (element != null && element.length > 0) {
                if (element[0].checked) {
                    let existFlag = false;
                    for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                        if (ele.Id == $scope.selectedTruckFitItems[i].Id) {
                            existFlag = true;
                        }
                    }
                    if (!existFlag) {
                        $scope.selectedTruckFitItems.push(ele);
                        $scope.updateTruckString();
                    }
                } else {
                    let temp = [];
                    for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                        if (ele.Id != $scope.selectedTruckFitItems[i].Id) {
                            temp.push($scope.selectedTruckFitItems[i]);
                        }
                    }
                    $scope.selectedTruckFitItems = temp;
                    $scope.updateTruckString();
                }
            } else {
                console.log('checkSearchResults::error');
            }
        };

        $scope.delSelectedItem = function (ele) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
            let new_temp = [];

            for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                if (ele.Id != $scope.selectedTruckFitItems[i].Id) {
                    new_temp.push($scope.selectedTruckFitItems[i]);
                }
            }

            $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                if ($(element).attr("data-recordid") == ele.Id && element.checked) {
                    element.checked = false;
                }
            });
            document.getElementById("ckbox_truckFit_searchresult_all").checked = false;

            $scope.selectedTruckFitItems = new_temp;
            $scope.updateTruckString();

        };

        $scope.delAllSelectedItem = function () {
            $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                element.checked = false;
            });
            document.getElementById("ckbox_truckFit_searchresult_all").checked = false;

            $scope.selectedTruckFitItems = [];
            $scope.updateTruckString();
        };

        $scope.updateTruckString = function () {
            let new_temp = '';

            for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                new_temp = new_temp + $scope.selectedTruckFitItems[i].Name + ';';
            }

            $scope.searchResultTruckName = new_temp;

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

        //组装劳务费 配件列表
        $scope.addLabourOriginalsList = function (obj) {
            var oneLabourOriginals1 = {};
            oneLabourOriginals1["Service_Quote__c"] = manMadeNo1Id;
            oneLabourOriginals1["Name"] = manMadeNo1Name;
            oneLabourOriginals1["Gross_Amount__c"] = $scope.manMadePrice1;
            oneLabourOriginals1["Quantity__c"] = $scope.manMadeNo1;
            oneLabourOriginals1["Discount__c"] = $scope.discountPrice1;
            oneLabourOriginals1["Material_Type__c"] = "Labour";
            oneLabourOriginals1["Material_Number__c"] = "7990110000";
            // oneLabourOriginals1["Net_Amount__c"] = $scope.discountPrice1; //优惠总价
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals1);
            var oneLabourOriginals2 = {};
            oneLabourOriginals2["Service_Quote__c"] = manMadeNo2Id;
            oneLabourOriginals2["Name"] = manMadeNo2Name;
            oneLabourOriginals1["Gross_Amount__c"] = $scope.manMadePrice2;
            oneLabourOriginals2["Quantity__c"] = $scope.manMadeNo2;
            oneLabourOriginals2["Discount__c"] = $scope.discountPrice2;
            oneLabourOriginals2["Material_Type__c"] = "Labour";
            oneLabourOriginals2["Material_Number__c"] = "7990110003";
            $scope.quoteLabourOriginalsList.push(oneLabourOriginals2);
            // var serviceQuotes = [];//车辆
            // var quoteLabourOriginals = [];//劳务费
            for (let index = 0; index < $stateParams.SendAllUser.length; index++) {
                const element = $stateParams.SendAllUser[index];
                delete element.levels;
                delete element.descriptions;
                delete element.Id;
                delete element.Name;
            }

            var sv_InputForListPrice = [];//单价
            var sv_InputForListNo = [];//数量
            var sv_InputForListDiscount = [];//折扣
            var sv_InputForListSpecial = [];//优惠总价
            $('input.sv_InputForListPrice').each(function (index, element) {
                sv_InputForListPrice.push(element.value);
                // console.log('sv_InputForListPrice:::',element.value+"  index"+index);
            });
            $('input.sv_InputForListNo').each(function (index, element) {
                sv_InputForListNo.push(element.value);
                // console.log('sv_InputForListNo:::',element.value+"  index"+index);
            });
            $('input.sv_InputForListDiscount').each(function (index, element) {
                sv_InputForListDiscount.push(element.value);
                // console.log('sv_InputForListDiscount:::',element.value+"  index"+index);
            });
            $('input.sv_InputForListSpecial').each(function (index, element) {
                sv_InputForListSpecial.push(element.value);
                // console.log('sv_InputForListSpecial:::',element.value+"  index"+index);
            });

            for (let index = 0; index < $scope.serviceFeeList.length; index++) {
                var oneLabourOriginals3 = {};
                oneLabourOriginals3["Name"] = $scope.serviceFeeList[index];
                oneLabourOriginals3["Gross_Amount__c"] = sv_InputForListPrice[index];
                oneLabourOriginals3["Quantity__c"] = sv_InputForListNo[index];
                oneLabourOriginals3["Discount__c"] = sv_InputForListDiscount[index];
                oneLabourOriginals3["Net_Amount__c"] = sv_InputForListSpecial[index];
                oneLabourOriginals3["Material_Type__c"] = "Labour";
                $scope.quoteLabourOriginalsList.push(oneLabourOriginals3);

            }

            //配件
            var part_InputForListPrice = [];//优惠单价 ？
            var part_InputForListNo = [];//数量
            var part_InputForListDiscount = [];//折扣
            // var part_InputForListSpecial = [];//优惠总价
            var part_InputForListChecked = [];//预留状态

            $('input.part_InputForListPrice').each(function (index, element) {
                part_InputForListPrice.push(element.value);
                // console.log('sv_InputForListPrice:::',element.value+"  index"+index);
            });
            $('input.part_InputForListNo').each(function (index, element) {
                part_InputForListNo.push(element.value);
                // console.log('sv_InputForListNo:::',element.value+"  index"+index);
            });
            $('input.part_InputForListDiscount').each(function (index, element) {
                part_InputForListDiscount.push(element.value);
                // console.log('sv_InputForListDiscount:::',element.value+"  index"+index);
            });
            // $('input.part_InputForListSpecial').each(function (index, element) {
            //     part_InputForListSpecial.push(element.value);
            //     // console.log('sv_InputForListSpecial:::',element.value+"  index"+index);
            // });
            $("input.ckbox_part").each(function (index, element) {
                part_InputForListChecked.push(element.checked);
            });
            for (let index = 0; index < $scope.selectedTruckFitItems.length; index++) {
                var oneLabourOriginals4 = {};
                var selectedTruckFitItemsIndex = $scope.selectedTruckFitItems[index];
                oneLabourOriginals4["Name"] = selectedTruckFitItemsIndex.parts_number__c;
                if (selectedTruckFitItemsIndex.priceCondition) {
                    oneLabourOriginals4["Gross_Amount__c"] = selectedTruckFitItemsIndex.priceCondition.price;
                }
                oneLabourOriginals4["Quantity__c"] = part_InputForListNo[index];
                oneLabourOriginals4["Discount__c"] = part_InputForListDiscount[index];
                oneLabourOriginals4["View_Integrity__c"] = part_InputForListChecked[index];
                // oneLabourOriginals4["Net_Amount__c"] = part_InputForListSpecial[index];
                oneLabourOriginals4["Material_Type__c"] = "Part";
                $scope.quoteLabourOriginalsList.push(oneLabourOriginals4);

            }
        };
        //保存
        $scope.toSaveServiceQuoteOverview = function (payload) {
            AppUtilService.showLoading();
            $scope.addLabourOriginalsList();//组织劳务费数据
            var serviceQuoteOverview = {};
            serviceQuoteOverview["Ship_to__c"] = $stateParams.SendSoupEntryId;

            var payload = $scope.paramSaveUrl + "serviceQuoteOverview=" + JSON.stringify(serviceQuoteOverview) + "&serviceQuotes=" + JSON.stringify($stateParams.SendAllUser) + "&quoteLabourOriginals=" + JSON.stringify($scope.quoteLabourOriginalsList);
            console.log("payload", payload);

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

        //提交审核
        $scope.toSubmitCheckFunction = function (sendId) {
            var listForrequests = [];
            var payload1 = {};
            payload1["actionType"] = "Submit";
            payload1["contextId"] = sendId;
            payload1["comments"] = "comments";
            listForrequests.push(payload1);
            var requests = {};
            requests["requests"] = listForrequests;

            // path, callback, error, method, payload, headerParams
            ForceClientService.getForceClient().ajax($scope.paramApprovalsUrl, function (response) {
                AppUtilService.hideLoading();
                console.log("toSubmitCheckFunction_success:", response);
                var ionPop = $ionicPopup.alert({
                    title: "提交成功"
                });
                ionPop.then(function (res) {
                    window.history.back(-1);
                    window.history.back(-1);
                });
            }, function (error) {
                console.log("toSubmitCheckFunction_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "提交失败"
                });
            }, 'POST', JSON.stringify(requests), null);
            console.log("toSubmitCheckFunction_payload", requests);

        };

        $scope.toSubmitCheck = function () {
            AppUtilService.showLoading();
            $scope.addLabourOriginalsList();//组织劳务费数据
            var serviceQuoteOverview = {};
            serviceQuoteOverview["Ship_to__c"] = $stateParams.SendSoupEntryId;

            var payload = $scope.paramSaveUrl + "serviceQuoteOverview=" + JSON.stringify(serviceQuoteOverview) + "&serviceQuotes=" + JSON.stringify($stateParams.SendAllUser) + "&quoteLabourOriginals=" + JSON.stringify($scope.quoteLabourOriginalsList);
            console.log("payload", payload);

            ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
                console.log("POST_success:", response);
                $scope.toSubmitCheckFunction(response.Id);//提交审核接口

            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "保存失败"
                });
            });

        };

        $scope.toDownloadEexFile = function () {

            AppUtilService.showLoading();
            $scope.addLabourOriginalsList();//组织劳务费数据
            var serviceQuoteOverview = {};
            serviceQuoteOverview["Ship_to__c"] = $stateParams.SendSoupEntryId;

            var payload = $scope.paramSaveUrl + "serviceQuoteOverview=" + JSON.stringify(serviceQuoteOverview) + "&serviceQuotes=" + JSON.stringify($stateParams.SendAllUser) + "&quoteLabourOriginals=" + JSON.stringify($scope.quoteLabourOriginalsList);
            console.log("payload", payload);

            ForceClientService.getForceClient().apexrest(payload, 'POST', {}, null, function (response) {
                console.log("POST_success:", response);
                //下载excel接口
                var serviceQuoteOverviewId = {};
                serviceQuoteOverviewId["serviceQuoteOverviewId"] = response.Id;
                var excelTemplateCode = {};
                excelTemplateCode["excelTemplateCode"] = "1";
                // var payload = $scope.paramExeclUrl + serviceQuoteOverviewId + "/" + excelTemplateCode;
                var payload = $scope.paramExeclUrl + response.Id + "/1";

                ForceClientService.getForceClient().apexrest(payload, 'GET', {}, null, function (response_exc) {
                    console.log("Execl_success:", response_exc);
                    $scope.toPrintDownLoad(response_exc.base64, response_exc.filename);
                    AppUtilService.hideLoading();
                    var ionPop = $ionicPopup.alert({
                        title: "保存成功"
                    });
                }, function (error) {
                    console.log("Execl_error:", error);
                    AppUtilService.hideLoading();
                    var ionPop = $ionicPopup.alert({
                        title: "保存失败"
                    });
                });

            }, function (error) {
                console.log("POST_error:", error);
                AppUtilService.hideLoading();
                var ionPop = $ionicPopup.alert({
                    title: "保存失败"
                });
            });
        }

        function base64toBlob(base64Data, contentType) {
            contentType = contentType || '';
            let sliceSize = 1024;
            let byteCharacters = atob(base64Data);
            let bytesLength = byteCharacters.length;
            let slicesCount = Math.ceil(bytesLength / sliceSize);
            let byteArrays = new Array(slicesCount);
            for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                let begin = sliceIndex * sliceSize;
                let end = Math.min(begin + sliceSize, bytesLength);

                let bytes = new Array(end - begin);
                for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
                    bytes[i] = byteCharacters[offset].charCodeAt(0);
                }
                byteArrays[sliceIndex] = new Uint8Array(bytes);
            }
            return new Blob(byteArrays, { type: contentType });
        }

        //写入文件
        var writeFile = function (fileEntry, dataObj) {
            fileEntry.createWriter(function (fileWriter) {
                //写入结束
                fileWriter.onwriteend = function () {
                    console.log('写入文件成功');
                    //读取内容
                    //  readFile(fileEntry);
                }
                fileWriter.onerror = function (e) {
                    console.log('写入文件失败:' + e.toString());
                }
                // if (!dataObj) {
                //     dataObj = new Blob([dataObj], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, base64' });
                // }
                let blob = new Blob([base64toBlob(dataObj, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')], {});

                fileWriter.write(blob);

            });
        }

        $scope.toPrintDownLoad = function (base64, filename) {

            window.requestFileSystem(LocalFileSystem.PERSISTENT, 1024 * 1024, function (fs) {
                console.log('file system open:' + fs.name);
                console.info(fs);
                fs.root.getFile(filename, {
                    create: true,
                    exclusive: false
                }, function (fileEntity) {
                    console.info(fileEntity);
                    console.log('文件地址：' + fileEntity.toURL()); //file:///data/data/io.cordova.myapp84ea27/files/files/test1.txt
                    writeFile(fileEntity, base64);
                });
            });
        };

        $scope.getLSG = function () {
            AppUtilService.showLoading();
            $scope.contentLSGs = [];
            //导入LSG
            ForceClientService.getForceClient().apexrest($scope.partLSGServer, 'GET', {}, null, function (response) {
                console.log("partLSGServer_success:", response);
                for (let i = 0; i < response.ShoppingCartList.length; i++) {
                    var element = response.ShoppingCartList[i];
                    var ShoppingCartList = {};
                    ShoppingCartList["cartName"] = element.cartName;
                    var cartList = [];
                    for (let j = 0; j < 20; j++) {
                        if (element[j]) {
                            cartList.push(element[j])
                        }
                    }
                    ShoppingCartList["cartList"] = cartList;
                    console.log("ShoppingCartList:", ShoppingCartList);
                    $scope.contentLSGs.push(ShoppingCartList);
                }
                AppUtilService.hideLoading();
            }, function (error) {
                console.log("partLSGServer_error:", error);
                AppUtilService.hideLoading();
            });
        }

        $scope.toggleGroup = function (group) {
            group.show = !group.show;
            // console.log("toggleGroup:", group);
        };
        $scope.isGroupShown = function (group) {
            // console.log("isGroupShown:", group);
            return group.show;
        };

        //******************LSG勾选框************************ */
        $scope.checkAllSearchResultsLSG = function () {
            let ele = $("#ckbox_truckLSG_searchresult_all");

            console.log('checkAllSearchResultsLSG:::', ele.prop("checked"));
            if (ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                    $(this).prop("checked", true);
                });
            } else {
                $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                    console.log('666:::', element.checked);
                    element.checked = false;
                });

            }
        };
        $scope.setLSGList = function () {
            AppUtilService.showLoading();
            var contentLSGsGetList = [];
            $("input.ckbox_truck_searchresult_itemLSG").each(function (index, element) {
                if (element.checked) {
                    console.log('ckbox_truck_searchresult_itemLSG:::', $(element).attr("data-recordid"));
                    contentLSGsGetList.push($(element).attr("data-recordid"));
                }
            });
            let partsQuantitys = [];
            for (let i = 0; i < contentLSGsGetList.length; i++) {
                partsQuantitys.push(100000);
            }
            var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(contentLSGsGetList) + "&partsQuantitys=" + JSON.stringify(partsQuantitys) + "&accountId=" + $stateParams.SendSoupEntryId;
            console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);
            ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                AppUtilService.hideLoading();
                console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                var rebuildListForLSG = [];
                for (let i = 0; i < responsePartsRelateds.length; i++) {
                    var responsePartsRelatedsList = responsePartsRelateds[i];
                    for (let j = 0; j < responsePartsRelatedsList.length; j++) {
                        // responsePartsRelatedsList[j]["itemNO"] = i + "-" + j;
                        responsePartsRelatedsList[j]["itemNO"] = j;
                        rebuildListForLSG.push(responsePartsRelatedsList[j]);
                    }
                }

                for (let i = 0; i < rebuildListForLSG.length; i++) {
                    $scope.selectedTruckFitItems.push(rebuildListForLSG[i]);
                }
                $scope.closeSelectPage();

            }, function (error) {
                console.log("error:", error);
                AppUtilService.hideLoading();

            });

        }

    });

