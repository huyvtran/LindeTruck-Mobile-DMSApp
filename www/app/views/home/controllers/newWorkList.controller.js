angular.module('oinio.newWorkListControllers', [])
    .controller('newWorkListController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,HomeService,$ionicPopup) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;
        vm.adrs = [];

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
        });
        //加号“+”菜单
        // document.getElementById("add_bgbox").style.display = "none";//隐藏
        // document.getElementById("add_contactsImg").style.display = "none";//隐藏



        $scope.openSelectPage = function (ele) {
            console.log('cssss:::',$('#selectCustomer'));
            if(ele === 'customer') {
                $('#selectCustomer').css('display', 'block');
                $('#selectTruck').css('display', 'none');
            }else{
                $('#selectTruck').css('display', 'block');
                $('#selectCustomer').css('display', 'none');
            }
            $('div.newWorkList_main').animate({
                opacity:'0.6'
            },'slow',function () {
                $('div.newWorkList_main').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity:'1'
                },'normal').show();
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
                        $state.go("app.home");
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
                        $state.go("app.home");
                    });
                }
            }, function (error) {
                $log.error('HomeService.searchTrucks Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
        };
        
        
        $scope.checkboxTrucks = function (truck) {
            //console.log('checkboxTrucks:::',$('input.ckbox_truck_class'));

            $scope.searchResultTruckName =truck.Name;
            $scope.searchResultTruckNum =truck.Model__c;
            $scope.searchResultTruckId =truck.Id;
            $scope.searchResultTruckSoupId =truck._soupEntryId;

            $scope.closeSelectPage();
        };


        $scope.searchChange = function () {

        };


        $scope.saveServiceOrder = function () {
            let order2Save = new Object();
            let userId = LocalCacheService.get('currentUser');

            order2Save.Account_Name_Ship_to__c = $scope.searchResultAcctId;
            order2Save.Account_Name_Ship_to__r = new Object();
            order2Save.Account_Name_Ship_to__r._soupEntryId = $scope.searchResultAcctSoupId;

            order2Save.Truck_Serial_Number__c = $scope.searchResultTruckId;
            order2Save.Truck_Serial_Number__r = new Object();
            order2Save.Truck_Serial_Number__r._soupEntryId = $scope.searchResultTruckSoupId;

            let orderType = $("#select_serviceorder_type").val();
            if(orderType != null && orderType != ''){order2Save.Service_Order_Type__c = orderType;}

            order2Save.Plan_Date__c = new Date();

            if(userId != null && userId.Id != null) {
                HomeService.getUserObjectById(userId.Id).then(function (response) {
                    console.log("getUserObjectById::", response);
                    if (response != null) {
                        order2Save.Service_Order_Owner__c = userId.Id;
                        order2Save.Service_Order_Owner__r = response;

                        HomeService.addServiceOrders([order2Save]).then(function (addResult) {
                            console.log('HAHAHAHA!!!',addResult);
                            if(addResult != null && addResult.length != 0) {
                                $state.go('app.workDetails', {SendInfo: addResult[0]._soupEntryId});
                            }
                        }, function (error) {
                            $log.error('HomeService.addServiceOrders Error ' + error);
                        });
                    }
                }, function (error) {
                    $log.error('HomeService.getUserObjectById Error ' + error);
                });
            }else{
                HomeService.addServiceOrders([order2Save]).then(function (addResult) {
                    console.log('HAHAHAHA!222!!',addResult);
                    if(addResult != null && addResult.length != 0) {
                        $state.go('app.workDetails', {SendInfo: addResult[0]._soupEntryId});
                    }
                }, function (error) {
                    $log.error('HomeService.addServiceOrders Error ' + error);
                });
            }
        };


        
    });

