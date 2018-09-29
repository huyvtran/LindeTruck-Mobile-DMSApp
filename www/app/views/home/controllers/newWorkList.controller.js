angular.module('oinio.newWorkListControllers', [])
    .controller('newWorkListController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,HomeService,$ionicPopup) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;
        vm.adrs = [];
        vm.priorities = [];

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

            vm.adrs.push({label:'工单',value:'Work Order'});
            vm.adrs.push({label:'客户咨询',value:'Customer Consult'});
            vm.adrs.push({label:'客户投诉',value:'Customer Complaint'});

            vm.priorities.push({label:'紧急',value:'Urgent'});
            vm.priorities.push({label:'高',value:'High'});
            vm.priorities.push({label:'中',value:'Medium'});
            vm.priorities.push({label:'低',value:'Low'});

        });
        $scope.$on('$ionicView.enter', function () {
            console.log('oCurrentUser:::',LocalCacheService.get('currentUser'));
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }

            $scope.contentItems=[];
            $scope.searchAcctText ='';

            $scope.contentTruckItems=[];
            $scope.searchTruckText ='';

            $scope.searchResultAcctName ='';
            $scope.searchResultCustomerNum ='';
            $scope.searchResultAcctId ='';
            $scope.searchResultAcctSoupId ='';

            $scope.searchResultTruckName ='';
            $scope.searchResultTruckNum ='';
            $scope.searchResultTruckId ='';
            $scope.searchResultTruckSoupId ='';

            $scope.selectedTruckItems=[];


            $scope.initLatest3Orders=[];

            $scope.displayStandardInfo = true;
            $scope.displayHistory = true;
            $scope.defaultStandardInfoHeight = 0;
            $scope.defaultHistoryWorkHeight = 0;

            $scope.displayDatepicker = true;

            HomeService.getLatest3ServiceOrders().then(function (response) {
                console.log("getLatest3ServiceOrders",response);

                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        if(response[index].Status__c == 'Not Started'){
                            response[index].Status__c = '未开始';
                        }
                        if(response[index].Status__c == 'Not Completed'){
                            response[index].Status__c = '未完成';
                        }
                        if(response[index].Status__c == 'Service Completed'){
                            response[index].Status__c = '已完成';
                        }
                        if(response[index].Status__c == 'End'){
                            response[index].Status__c = '已结束';
                        }
                        if(response[index].Status__c == 'Not Planned'){
                            response[index].Status__c = '未安排';
                        }
                    }
                    $scope.initLatest3Orders = response;
                    //console.log("getLatest3ServiceOrders",accountsName);
                }
            }, function (error) {
                $log.error('HomeService.getLatest3ServiceOrders Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });

            console.log('Begin::init animate node::');
            $scope.defaultStandardInfoHeight = document.querySelector("#newwork_standardInfo").scrollHeight + 'px';
            document.querySelector("#newwork_standardInfo").style.height = $scope.defaultStandardInfoHeight;
            $scope.defaultHistoryWorkHeight = document.querySelector("#newwork_historyWork").scrollHeight + 'px';
            document.querySelector("#newwork_historyWork").style.height = $scope.defaultHistoryWorkHeight;


            let currentDate = $scope.getCurrentDateString();
            $('#input_plandate').val(currentDate);
            let initDatePickerParamm = new Object();
            //initDatePickerParamm['startDate'] = currentDate;
            initDatePickerParamm['data-date-format'] = 'yyyy-mm-dd';

            var Instance_datepicker = $('#input_plandate').datepicker(initDatePickerParamm);

            Instance_datepicker.on('show', function(e){
                console.log('datepicker::show');
                $scope.displayDatepicker = true;
            });
            Instance_datepicker.on('hide', function(e){
                console.log('datepicker::hide');
                $scope.displayDatepicker = false;
            });


        });



        $scope.clickDatepickerIcon = function () {
            if($scope.displayDatepicker){
                console.log('show>>>hide');
                $('#input_plandate').datepicker('hide');
            }else{
                console.log('hide>>show');
                $('#input_plandate').datepicker('show');
            }
        };



        $scope.openSelectPage = function (ele) {
            console.log('cssss:::',$('#selectCustomer'));

            $('div.newWorkList_main').animate({
                opacity:'0.6'
            },'slow','swing',function () {
                $('div.newWorkList_main').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity:'1'
                },'normal').show();

                if(ele === 'customer') {
                    $('#selectCustomer').css('display', 'block');
                    $('#selectTruck').css('display', 'none');
                }else{
                    $('#selectTruck').css('display', 'block');
                    $('#selectCustomer').css('display', 'none');
                }
            });



        };

        $scope.closeSelectPage = function () {
            console.log('aaaaa');
            $('div.newWorkList_truckSelect').animate({
                opacity:'0.6'
            },'slow',function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.newWorkList_main').animate({
                    opacity:'1'
                },'normal').show();
            });
        };

        $scope.cancleButton = function () {
            window.history.back();
        };


        $scope.getAccts = function (keyWord) {
            //调用接口获取结果
            HomeService.searchAccounts(keyWord).then(function (response) {
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
                    console.log("AccountServicegw11",accountsName);
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
            console.log('select:acct:',acct);

            $scope.searchResultAcctName = acct.Name;
            $scope.searchResultCustomerNum = acct.Customer_Number__c;
            $scope.searchResultAcctId =acct.Id;
            $scope.searchResultAcctSoupId =acct._soupEntryId;

            //$scope.closeSelectPage();
            $scope.init20Trucks(acct.Id);
        };


        $scope.init20Trucks = function (keyWord) {
            $scope.contentTruckItems = [];
            console.log("init20Trucks1::",keyWord);

            HomeService.init20AcctTrucks(keyWord).then(function (response) {
                console.log("init20Trucks2::",keyWord);
                let trucks = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        trucks.push(response[index]);
                    }
                    $scope.contentTruckItems = trucks;
                    console.log("init20Trucks",trucks);
                }
            }, function (error) {
                $log.error('HomeService.init20Trucks Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
                $scope.closeSelectPage();
            });
        };


        $scope.getTrucks = function (keyWord) {
            $scope.contentTruckItems = [];

            HomeService.searchTrucks(keyWord,$scope.searchResultAcctId).then(function (response) {
                console.log("getTrucks::",keyWord);
                let trucks = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        trucks.push(response[index]);
                    }
                    $scope.contentTruckItems = trucks;
                    console.log("getTrucks",trucks);
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
        
        


        $scope.searchChange = function () {

        };


        $scope.saveServiceOrder = function () {
            let order2Save = new Object();
            let userId = LocalCacheService.get('currentUser');

            order2Save.Account_Ship_to__c = $scope.searchResultAcctId;
            order2Save.Account_Ship_to__r = new Object();
            order2Save.Account_Ship_to__r._soupEntryId = $scope.searchResultAcctSoupId;

            // order2Save.Truck_Serial_Number__c = $scope.searchResultTruckId;
            // order2Save.Truck_Serial_Number__r = new Object();
            // order2Save.Truck_Serial_Number__r._soupEntryId = $scope.searchResultTruckSoupId;

            order2Save.Description__c = $("#textarea_desc").val();

            let orderType = $("#select_serviceorder_type").val();
            if(orderType != null && orderType != ''){order2Save.Service_Order_Type__c = orderType;}

            let orderPriority = $("#select_serviceorder_priority").val();
            if(orderPriority != null && orderPriority != ''){order2Save.Priority__c = orderPriority;}

            order2Save.Plan_Date__c = $('#input_plandate').val();

            if(userId != null && userId.Id != null) {
                HomeService.getUserObjectById(userId.Id).then(function (response) {
                    console.log("getUserObjectById::", response);
                    if (response != null) {
                        order2Save.Service_Order_Owner__c = userId.Id;
                        order2Save.Service_Order_Owner__r = response;

                        HomeService.addWorkOrder([order2Save],$scope.selectedTruckItems).then(function (addResult) {
                            console.log('HAHAHAHA!!!',addResult);
                            if(addResult != null && addResult.length != 0) {
                                $state.go('app.workDetails',
                                    {   SendInfo: addResult[0]._soupEntryId,
                                        workDescription:$("#textarea_desc").val()
                                    });
                            }
                        }, function (error) {
                            $log.error('HomeService.addServiceOrders Error ' + error);
                        });
                    }
                }, function (error) {
                    $log.error('HomeService.getUserObjectById Error ' + error);
                });
            }else{
                HomeService.addWorkOrder([order2Save],$scope.selectedTruckItems).then(function (addResult) {
                    console.log('HAHAHAHA!222!!',addResult);
                    if(addResult != null && addResult.length != 0) {
                        $state.go('app.workDetails', {SendInfo: addResult[0]._soupEntryId});
                    }
                }, function (error) {
                    $log.error('HomeService.addServiceOrders Error ' + error);
                });
            }
        };

        $scope.changeTruckTab = function (index) {
            console.log('cssss:::',$('#selectCustomer'));
            if(index === '1') {
                $("#selectTruck_Tab_1").addClass("selectTruck_Tab_Active");
                $("#selectTruck_Tab_2").removeClass("selectTruck_Tab_Active");

                $('#selectTruck_result').css('display', 'block');
                $('#selectTruck_checked').css('display', 'none');
            }else if (index === '2') {
                $("#selectTruck_Tab_1").removeClass("selectTruck_Tab_Active");
                $("#selectTruck_Tab_2").addClass("selectTruck_Tab_Active");

                $('#selectTruck_result').css('display', 'none');
                $('#selectTruck_checked').css('display', 'block');
            }
        };

        $scope.checkAllSearchResults = function () {
            let ele = $("#ckbox_truck_searchresult_all");

            console.log('checkAllSearchResults:::',ele.prop("checked"));
            if(ele.prop("checked")) {
                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    $(this).prop("checked", true);
                });

                angular.forEach($scope.contentTruckItems, function (searchResult) {
                    let existFlag = false;
                    angular.forEach($scope.selectedTruckItems, function (selected) {
                        if(searchResult.Id == selected.Id){
                            existFlag = true;
                        }
                    });
                    if(!existFlag){
                        $scope.selectedTruckItems.push(searchResult);
                        $scope.updateTruckString();
                    }
                });
            }else{

                $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                    console.log('666:::',element.checked);
                    element.checked = false;
                });

                let arr_temp = [];
                angular.forEach($scope.selectedTruckItems, function (selected) {
                    let existFlag = false;
                    angular.forEach($scope.contentTruckItems, function (searchResult) {
                        if(searchResult.Id == selected.Id){
                            existFlag = true;
                        }
                    });
                    if(!existFlag){
                        arr_temp.push(selected);
                    }
                });
                $scope.selectedTruckItems = arr_temp;
                $scope.updateTruckString();

            }
        };


        $scope.checkSearchResults = function (ele) {
            let element = $("input.ckbox_truck_searchresult_item[data-recordid*='"+ele.Id+"']");
            console.log('checkSearchResults::',element);

            if(element != null && element.length > 0) {
                if(element[0].checked) {
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
                }else{
                    let temp = [];
                    for (var i = 0; i < $scope.selectedTruckItems.length; i++) {
                        if (ele.Id != $scope.selectedTruckItems[i].Id) {
                            temp.push($scope.selectedTruckItems[i]);
                        }
                    }
                    $scope.selectedTruckItems = temp;
                    $scope.updateTruckString();
                }
            }else{
                console.log('checkSearchResults::error');
            }
        };

        $scope.checkboxTrucks = function (truck) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));

            $scope.searchResultTruckName = truck.Name;
            $scope.searchResultTruckNum = truck.Model__c;
            $scope.searchResultTruckId = truck.Id;
            $scope.searchResultTruckSoupId = truck._soupEntryId;

            $scope.closeSelectPage();
        };




        $scope.delSelectedItem = function (ele) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));
            let new_temp = [];

            for (var i=0;i<$scope.selectedTruckItems.length;i++){
                if(ele.Id != $scope.selectedTruckItems[i].Id){
                    new_temp.push($scope.selectedTruckItems[i]);
                }
            }

            $("input.ckbox_truck_searchresult_item").each(function (index, element) {
                if($(element).attr("data-recordid") == ele.Id && element.checked) {
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
            let new_temp = '';

            for (var i=0;i<$scope.selectedTruckItems.length;i++){
                new_temp = new_temp + $scope.selectedTruckItems[i].Name + ';';
            }

            $scope.searchResultTruckName = new_temp;

        };

        $scope.getCurrentDateString = function () {
            let d = new Date().getDate();
            let m = new Date().getMonth()+1;
            let y = new Date().getFullYear();

            if(d<10){
                d = '0' + d;
            }
            if(m<10){
                m = '0' + m;
            }
            return y+'-'+m+'-'+d;
        };

        $scope.showStandardInfo = function () {
            $scope.displayStandardInfo = !$scope.displayStandardInfo;
            if($scope.displayStandardInfo){
                document.querySelector("#newwork_standardInfo").style.height = $scope.defaultStandardInfoHeight;
            }else{
                document.querySelector("#newwork_standardInfo").style.height = '0px';
            }
        }

        $scope.showHistoryWork = function () {
            $scope.displayHistory = !$scope.displayHistory;
            if($scope.displayHistory){
                document.querySelector("#newwork_historyWork").style.height = $scope.defaultHistoryWorkHeight;
            }else{
                document.querySelector("#newwork_historyWork").style.height = '0px';
            }
        }

}).directive('repeatFinish',function(){
    return {
        controller: function ($scope, $element, $attrs) {

        },
        link: function(scope,element,attr,controller){
            console.log('scope::',scope);
            //console.log('element::',element);
            //console.log('attr::',attr);
            //console.log('controller::',controller);

            if(scope.$last == true){
                console.log('ng-repeat element render finished.');
                scope.$parent.defaultHistoryWorkHeight = document.querySelector("#newwork_historyWork").scrollHeight + 'px';
                document.querySelector("#newwork_historyWork").style.height = scope.$parent.defaultHistoryWorkHeight;
            }
        }
    }
});

