angular.module('oinio.NewOfferFittingsController', [])
    .controller('NewOfferFittingsController', function ($scope, $http, $ionicPopup, $stateParams, HomeService, $state, AppUtilService, $rootScope, SQuoteService, ForceClientService) {

        // var forceClient = ForceClientService.getForceClient();
        // console.log("forceClient", forceClient);
        $scope.contentTruckFitItems = [];
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
        $scope.paramUrl1 = "/Parts/7990110000/" + $stateParams.SendSoupEntryId;
        $scope.paramUrl2 = "/Parts/7990110003/" + $stateParams.SendSoupEntryId;
        $scope.paramSaveUrl = "/ServiceQuoteOverview?";
        $scope.paramApprovalsUrl = "/v38.0/process/approvals";
        $scope.paramExeclUrl = "/excel/";
        $scope.searchPartssUrl = "/Partss?keyword=";
        $scope.partsRelatedsUrl = "/PartsRelateds?partsNumbers=";

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
            document.addEventListener('click', function (e) {

                if (e.target === document.getElementById('btn_modify_Btn')) {
                    $scope.toDisplayModifyDiv();
                } else {
                    document.getElementById("btn_modify_Div").style.display = "none";//隐藏

                }
                if (e.target === document.getElementById('btn_import_Btn')) {
                    $scope.toDisplayImportDiv();
                } else {
                    document.getElementById("btn_import_Div").style.display = "none";//隐藏

                }
            });
        });
        $scope.$on('$ionicView.enter', function () {
            // console.log("NewOfferFittingsController");
           
            $scope.get();
        });
        $scope.goBack = function () {
            window.history.back();
        };

        $scope.openSelectPage = function () {
            console.log('cssss:::', $('#selectCustomer'));

            $('div.newWorkList_main').animate({
                opacity: '0.6'
            }, 'slow', 'swing', function () {
                $('div.newWorkList_main').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity: '1'
                }, 'normal').show();

                $('#selectTruckFit').css('display', 'block');
            });
        };
        $scope.closeSelectPage = function () {
            $('div.newWorkList_truckSelect').animate({
                opacity: '0.6'
            }, 'slow', function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.newWorkList_main').animate({
                    opacity: '1'
                }, 'normal').show();
            });
        };
//搜索配件
        $scope.getTrucks = function (keyWord) {
            AppUtilService.showLoading();
            // $scope.contentTruckFitItems = [{ Id: "a1Cp0000001W16yEAC1", Name: "8712" }, { Id: "a1Cp0000001W16yEAC2", Name: "9272" }, { Id: "a1Cp0000001W16yEAC3", Name: "8872" }];
            console.log("getTrucks::", keyWord);
            let parts_number__cList = [];
            let partsQuantitys = [];
            ForceClientService.getForceClient().apexrest($scope.searchPartssUrl+keyWord, 'GET', {}, null, function (response) {
                // console.log("searchPartssUrl:", response);
                for (let index = 0; index < response.results.length; index++) {
                    let element = response.results[index];
                    parts_number__cList.push(element.parts_number__c);
                    partsQuantitys.push("100000");
                }
               var getPartsRelatedsUrl = $scope.partsRelatedsUrl + JSON.stringify(parts_number__cList) + "&partsQuantitys=" +JSON.stringify(partsQuantitys) +"&accountId="+ "";
               console.log("getPartsRelatedsUrl:", getPartsRelatedsUrl);

                ForceClientService.getForceClient().apexrest(getPartsRelatedsUrl, 'GET', {}, null, function (responsePartsRelateds) {
                    AppUtilService.hideLoading();
                    console.log("getPartsRelatedsUrlRes:", responsePartsRelateds);
                    $scope.contentTruckFitItems = responsePartsRelateds;
                }, function (error) {
                    console.log("error:", error);
                    AppUtilService.hideLoading();

                });

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
                        if (searchResult[0].Id == selected[0].Id) {
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
                        if (searchResult[0].Id == selected[0].Id) {
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
            let element = $("input.ckbox_truck_searchresult_itemFit[data-recordid*='" + ele[0].Id + "']");
            console.log('checkSearchResults::', element);

            if (element != null && element.length > 0) {
                if (element[0].checked) {
                    let existFlag = false;
                    for (var i = 0; i < $scope.selectedTruckFitItems.length; i++) {
                        if (ele[0].Id == $scope.selectedTruckFitItems[i][0].Id) {
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
                        if (ele[0].Id != $scope.selectedTruckFitItems[i][0].Id) {
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
                if (ele[0].Id != $scope.selectedTruckFitItems[i][0].Id) {
                    new_temp.push($scope.selectedTruckFitItems[i]);
                }
            }

            $("input.ckbox_truck_searchresult_itemFit").each(function (index, element) {
                if ($(element).attr("data-recordid") == ele[0].Id && element.checked) {
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
                new_temp = new_temp + $scope.selectedTruckFitItems[i][0].Name + ';';
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

    });

