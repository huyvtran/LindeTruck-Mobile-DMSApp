angular.module('oinio.NewOfferController', [])
    .controller('NewOfferController', function ($scope, $ionicPopup, $stateParams, HomeService, $state, $rootScope, SQuoteService) {
        var toDisplayDelCarBool = false;
        var tabSVViewNewIndex = 1;
        var selectAcctSetId;
        let trucksDescriptions = [];
        let trucksLevels = [];
        $scope.contentTruckItems = [];
        $scope.selectedTruckItems = [];
        $(document).ready(function () {
        });
        $scope.$on('$ionicView.enter', function () {
            console.log("NewOfferController");
            console.log('selectedTruckItems:ALL::', $scope.selectedTruckItems);


        });
        $scope.goBack = function () {
            window.history.back();
        };

        $scope.openSelectPage = function (ele) {
            console.log('cssss:::', $('#selectCustomer'));

            $('div.newWorkList_main').animate({
                opacity: '0.6'
            }, 'slow', 'swing', function () {
                $('div.newWorkList_main').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity: '1'
                }, 'normal').show();

                if (ele === 'customer') {
                    $('#selectCustomer').css('display', 'block');
                    $('#selectTruck').css('display', 'none');
                    $('#selectContactsDiv').css('display', 'none');
                    window.setTimeout(function () {
                        $("input").trigger("click").focus();
                    }, 200);

                } else if (ele === 'selectTruck') {
                    $('#selectTruck').css('display', 'block');
                    $('#selectCustomer').css('display', 'none');
                    $('#selectContactsDiv').css('display', 'none');

                } else if (ele === 'selectContactsDiv') {
                    $('#selectTruck').css('display', 'none');
                    $('#selectCustomer').css('display', 'none');
                    $('#selectContactsDiv').css('display', 'block');
                    setTimeout(function () {
                        $scope.selectAccountOfContacts();
                    }, 100);
                }
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
        $scope.getAccts = function (keyWord) {
            //调用接口获取结果
            SQuoteService.searchAccounts(keyWord).then(function (response) {
                let accountsName = [];
                let accountsId = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        accountsName.push(response[index]);
                        accountsId.push(response[index].Id);
                    }
                    $scope.contentItems = accountsName;
                    $scope.getIds = accountsId;
                    console.log("AccountServicegw22", accountsName);
                }
                else {
                    var ionPop = $ionicPopup.alert({
                        title: "结果",
                        template: "没有客户数据"
                    });
                    ionPop.then(function () {
                        //$ionicHistory.goBack();
                        //$state.go("app.home");
                    });
                }
            }, function (error) {
                $log.error('AccountService.searchAccounts Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
        };

        $scope.selectAccount = function (acct) {
            SQuoteService.getAccount(acct.Id).then(function (response) {
                console.log(" SQuoteService.getAccount", response);
                selectAcctSetId = acct.Id;
                $scope.searchResultAddress = response.Address__c;
                $scope.searchResultAcctName = response.Name;
            }, function (error) {
                $log.error('getAccount Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
            $scope.closeSelectPage();
        };

        $scope.getMainLevelsAndDesc = function (obj) {
            SQuoteService.getMaintenanceLevelsAndDescriptions(obj.Maintenance_Key__c).then(function (response) {
                console.log("getMainLevelsAndDesc", response);

                if (response.levels.length > 0) {
                    obj["levels"] = response.levels;
                }
                if (response.descriptions.length > 0) {
                    obj["descriptions"] = response.descriptions;
                }
                console.log("getMainLevelsAndDescobj", obj);
            }, function (error) {
                $log.error('HomeService.searchTrucks Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
        }
        $scope.getTrucks = function (keyWord) {
            $scope.contentTruckItems = [];
            // console.log("getTrucks::", keyWord);

            SQuoteService.searchTrucks(keyWord).then(function (response) {
                let trucks = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {

                        trucks.push(response[index]);

                    }
                    $scope.contentTruckItems = trucks;
                    console.log("getTrucks", trucks);
                }
                else {
                    var ionPop = $ionicPopup.alert({
                        title: "结果",
                        template: "没有数据"
                    });
                    ionPop.then(function () {
                        //$ionicHistory.goBack();
                        //$state.go("app.home");
                    });
                }
            }, function (error) {
                $log.error('HomeService.searchTrucks Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
        };

        $scope.selectContacts = function (item) {
            $scope.selectContactsName = item.Name;
            $scope.closeSelectPage();
        };
        $scope.selectAccountOfContacts = function () {
            SQuoteService.getContacts(selectAcctSetId).then(function (response) {
                console.log("SQuoteService.getContacts", response);
                let contactsAll = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        contactsAll.push(response[index]);
                    }
                    $scope.contactsItems = contactsAll;
                }
                else {
                    var ionPop = $ionicPopup.alert({
                        title: "结果",
                        template: "没有客户数据"
                    });
                    ionPop.then(function () {
                        //$ionicHistory.goBack();
                        //$state.go("app.home");
                    });
                }

            }, function (error) {
                $log.error('getAccount Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
            // $scope.init20Trucks(acct.Id);
        };

        $scope.changeTruckTab = function (index) {
            console.log('cssss:::', $('#selectCustomer'));
            if (index === '1') {
                $("#selectTruck_Tab_1").addClass("selectTruck_Tab_Active");
                $("#selectTruck_Tab_2").removeClass("selectTruck_Tab_Active");

                $('#selectTruck_result').css('display', 'block');
                $('#selectTruck_checked').css('display', 'none');
            } else if (index === '2') {
                $("#selectTruck_Tab_1").removeClass("selectTruck_Tab_Active");
                $("#selectTruck_Tab_2").addClass("selectTruck_Tab_Active");

                $('#selectTruck_result').css('display', 'none');
                $('#selectTruck_checked').css('display', 'block');
            }
        };

        $scope.checkAllSearchResults = function () {
            let ele = $("#ckbox_truck_searchresult_all");

            console.log('checkAllSearchResults:::', ele.prop("checked"));
            if (ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    $(this).prop("checked", true);
                });

                angular.forEach($scope.contentTruckItems, function (searchResult) {
                    let existFlag = false;
                    angular.forEach($scope.selectedTruckItems, function (selected) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        $scope.selectedTruckItems.push(searchResult);
                        $scope.updateTruckString();
                    }
                });
            } else {

                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    console.log('666:::', element.checked);
                    element.checked = false;
                });

                let arr_temp = [];
                angular.forEach($scope.selectedTruckItems, function (selected) {
                    let existFlag = false;
                    angular.forEach($scope.contentTruckItems, function (searchResult) {
                        if (searchResult.Id == selected.Id) {
                            existFlag = true;
                        }
                    });
                    if (!existFlag) {
                        arr_temp.push(selected);
                    }
                });
                $scope.selectedTruckItems = arr_temp;
                $scope.updateTruckString();

            }
        };

        $scope.checkSearchResults = function (ele) {
            let element = $("input.ckbox_truck_searchresult_item[data-recordid*='" + ele.Id + "']");
            console.log('checkSearchResults::', element);

            if (element != null && element.length > 0) {
                if (element[0].checked) {
                    let existFlag = false;
                    for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                        if (ele.Id == $scope.selectedTruckItems[i].Id) {
                            existFlag = true;
                        }
                    }
                    if (!existFlag) {
                        $scope.selectedTruckItems.push(ele);
                        $scope.updateTruckString();
                    }
                } else {
                    let temp = [];
                    for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                        if (ele.Id != $scope.selectedTruckItems[i].Id) {
                            temp.push($scope.selectedTruckItems[i]);
                        }
                    }
                    $scope.selectedTruckItems = temp;
                    $scope.updateTruckString();
                }
            } else {
                console.log('checkSearchResults::error');
            }
        };

        $scope.delSelectedItem = function (ele) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
            let new_temp = [];

            for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                if (ele.Id != $scope.selectedTruckItems[i].Id) {
                    new_temp.push($scope.selectedTruckItems[i]);
                }
            }

            $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                if ($(element).attr("data-recordid") == ele.Id && element.checked) {
                    element.checked = false;
                }
            });
            document.getElementById("ckbox_truck_searchresult_all").checked = false;

            $scope.selectedTruckItems = new_temp;
            $scope.updateTruckString();

        };

        $scope.delAllSelectedItem = function () {
            $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                element.checked = false;
            });
            document.getElementById("ckbox_truck_searchresult_all").checked = false;

            $scope.selectedTruckItems = [];
            $scope.updateTruckString();
        };

        $scope.updateTruckString = function () {
            for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                //更新选择的车体号
                let searchTrucksRes = $scope.selectedTruckItems[i];
                $scope.getMainLevelsAndDesc(searchTrucksRes);
            }

        };

        $scope.toDisplayDelCarView = function () {
            // var div = document.getElementById("addDelCarView");/*w和h都要用这部分，故单独定义一个div*/
            // var OpenClose_ArrowDiv = document.getElementById("OpenClose_Arrow");
            // var w = parseInt(div.style.width);
            // var h = parseInt(div.style.height);
            // // div.style.width=(w+30)+"px";
            // if (toDisplayDelCarBool) {
            //     div.style.height = '65px';
            //     toDisplayDelCarBool = false;
            //     OpenClose_ArrowDiv.className = 'arrow_Left_White';
            // } else {
            //     div.style.height = '275px';
            //     toDisplayDelCarBool = true;
            //     OpenClose_ArrowDiv.className = 'arrow_Down_White';

            // }
        };
        $scope.toAddSVViewTest = function (element) {
            console.log("toAddSVViewTest");
            element.parentNode.removeChild(element.parentNode);
        };
        $scope.toAddTableView = function () {
            // tabSVViewNewIndex++;
            // tabSVViewSetId = "tabSVViewId" + tabSVViewNewIndex;

            // var tabExample = document.getElementById("tabExample");
            // var tabExampleDiv = document.getElementById("tabExampleDiv");
            // var tabAdd = document.getElementById("tabExampleAdd");
            // 获得h1里的内容
            // var com = tabExample.innerHTML;
            // 克隆节点
            // var con = tabExample.cloneNode(true);
            // // 将内容写到克隆的节点内
            // con.innerHTML = com;
            // console.log("con", con);

            // var tr = document.createElement('tr')
            // tr.innerHTML = '<tr id="tabExampleDiv"><td id="tabExample" class="ad_Right_Td_Group"><table cellpadding="0" cellspacing="0" border="0" class="ad_Right_Table"><tr id="tabSVViewId1"><td class="ad_Right_Td" ng-click="toTabSVView()"><div class="pos_rel"><div> 车体号1 </div><div class="del_red_icon"></div></div></td></tr><tr><td class="ad_Right_Td"><select id="selectStatusId"><option>全部</option><option>未安排</option></select></td></tr><tr><td class="ad_Right_Td "><div> 车型1 </div></td></tr><tr><td class="ad_Right_Td "><div> 车系1 </div></td></tr><tr><td class="ad_Right_Td "><select id="selectStatusId"><option>全部</option><option>未安排</option></select></td></tr><tr><td class="ad_Right_Td "><select id="selectStatusId"><option>保养任务</option></select></td></tr><tr><td class="ad_Right_Td"><input class="ad_Input" /></td></tr></table></td>';
            // tabAdd.parentNode.insertBefore(tr, tabAdd);

            // var elements = tabExampleDiv.getElementsByTagName("table"); 
            // for(var i=0; i<elements.length; i++){ 
            //     console.log("elements[i].name","i:"+i +"elements:"+ elements[i].name+"id:"+elements[i].id);
            // }
            // var counttabSVViewNewIndex = "tabSVViewId" + parseInt(tabSVViewNewIndex-1);
            // var tabSVViewNewId = document.getElementById(counttabSVViewNewIndex);

            // console.log("tabSVViewNewId", tabSVViewNewId+" counttabSVViewNewIndex: "+counttabSVViewNewIndex+" tabSVViewNewIndex: "+tabSVViewNewIndex);
            // let tr = document.createElement('tr')
            // tr.innerHTML = '<tr><td id=' + tabSVViewSetId + ' class="ad_Right_Td" onclick=\"angular.element(this).scope().toAddSVViewTest(angular.element(this))\"> <div class="pos_rel"><div> ' + "车体号1" + ' </div><div class="del_red_icon"></div></div></td></tr>';
            // tabSVViewNewId.parentNode.replaceChild(tr, tabSVViewNewId);
        }


        $scope.toAddSVView = function () {
            var tabExampleSV = document.getElementById("tabExampleSV");
            var tabExampleSVAdd = document.getElementById("tabExampleSVAdd");
            // 获得h1里的内容
            var comSV = tabExampleSV.innerHTML;
            // 克隆节点
            var conSV = tabExampleSV.cloneNode(true);
            // 将内容写到克隆的节点内
            conSV.innerHTML = comSV;
            // console.log(con);
            tabExampleSVAdd.parentNode.insertBefore(conSV, tabExampleSVAdd);

        }

        $scope.toTabSVView = function () {
            var tabExampleDiv = document.getElementById("tabExampleDiv");

            for (var i = 0; i < tabExampleDiv.childNodes.length; i++) {//oList是做的ul的对象。
                //nodeType是节点的类型，利用nodeType来判断节点类型，再去控制子节点
                //nodeType==1 是元素节点
                //nodeType==3 是文本节点
                if (tabExampleDiv.childNodes[i].nodeType == 1) {//查找到oList内的元素节点
                    console.log(tabExampleDiv.childNodes[i]);//在控制器日志中显示找到的元素节点
                }

                console.log("tabExampleDiv:", tabExampleDiv.childNodes[i]);//在控制器日志中显示找到的元素节点

            }

        }
        $scope.goNextPage = function () {
            if ($scope.searchResultAcctName == null) {
                var ionPop = $ionicPopup.alert({
                    title: "请填写客户名称"
                });
                return;
            }
            if ($scope.selectedTruckItems.length == 0) {
                var ionPop = $ionicPopup.alert({
                    title: "请添加车辆"
                });
                return;
            }


            var selectedTruckItemsCopy = JSON.parse(JSON.stringify($scope.selectedTruckItems))

            $('select.selectStatusServiceTypeClass').each(function (index, element) {
                let selected = selectedTruckItemsCopy[index];
                selected["Service_Type__c"] = element.value;
                // console.log('selectStatusServiceTypeClass:::',element.value+"  index"+index);
            });

            $('select.selectStatusLevelsClass').each(function (index, element) {
                let selected = selectedTruckItemsCopy[index];
                selected["Maintenance_Level__c"] = element.value;

                // console.log('selectStatusLevelsClass:::',element.value+"  index"+index);
            });
            $('select.selectStatusDescriptionsClass').each(function (index, element) {
                let selected = selectedTruckItemsCopy[index];
                selected["description"] = element.value;

                // console.log('selectStatusDescriptionsClass:::',element.value+"  index"+index);
            });

            $('input.sv_Input').each(function (index, element) {
                let selected = selectedTruckItemsCopy[index];
                selected["Work_Time__c"] = element.value;

                // console.log('sv_Input:::',element.value+"  index"+index);
            });
            console.log('selectStatuClass:ALL::', selectedTruckItemsCopy);

            $state.go('app.newOfferFittings', { SendAllUser: selectedTruckItemsCopy, SendSoupEntryId: $scope.getIds[0] });

            // $state.go('app.newOfferFittings');

        };

    });

