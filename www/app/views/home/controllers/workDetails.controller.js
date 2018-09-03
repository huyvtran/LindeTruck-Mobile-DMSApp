angular.module('oinio.workDetailsControllers', [])
    .controller('workDetailsController', function ($scope, $rootScope, $filter, $state, $log,$stateParams, ConnectionMonitor,
                                                   LocalCacheService,HomeService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        vm.isOnline = null;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
        });
        $scope.$on('$ionicView.enter', function () {
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log("$stateParams.SendInfo",$stateParams.SendInfo);
            var userInfoId = $stateParams.SendInfo;
            HomeService.getOrder(userInfoId).then(function (response) {
                $scope.busyerName = response[0].Account_Name_Ship_to__r.Name;
                $scope.busyerType = response[0].Service_Order_Type__c;
                console.log('resp::',response);
                HomeService.getUserObjectById(response[0].Service_Order_Owner__c).then(function (resp1) {
                    $scope.OwnerId = response[0].Service_Order_Owner__r = resp1.Id;
                    console.log('Step1::',response[0].Service_Order_Owner__r);
                    HomeService.getTruckObjectById(response[0].Truck_Serial_Number__c).then(function (resp2) {
                        $scope.TruckId = response[0].Truck_Serial_Number__r = resp2.Id;
                        console.log('Step2::',response[0].Truck_Serial_Number__r);
                    },function (e2) {
                        console.log(e2);
                    });
                },function (e1) {
                    console.log(e1);
                });


                //console.log("response.Service_Order_Owner__r:",response[0].Service_Order_Owner__r);

            },function (error) {
                $log.error('Error ' + error);
            });
        });
        $scope.goBack = function () {
            window.history.back();
        };

        $scope.goSave =function () {
            $state.go("app.home");
        };

        $scope.toDisplayMoreInfo = function () {
            if (document.getElementById("div_moreInfo").style.display == "none") {
                document.getElementById("div_moreInfo").style.display = "";//显示
                document.getElementById("div_moreInfoImg").className = "OpenClose_Btn arrow_Down_Red";
            } else {
                document.getElementById("div_moreInfo").style.display = "none";//隐藏
                document.getElementById("div_moreInfoImg").className = "OpenClose_Btn arrow_Left_Red";

            }
        };
        $scope.toDisplayBox = function () {

        };
    });

