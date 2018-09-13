angular.module('oinio.controllers', [])
    .controller('HomeController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,$ionicTabsDelegate,
        LocalCacheService,HomeService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        var allUser = [];
        vm.isOnline = null;
        var currentOrder = [];
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        });
        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            
            console.log("homeController$ionicView.enter");
        });
        //加号“+”菜单
        // document.getElementById("add_bgbox").style.display = "none";//隐藏
        // document.getElementById("add_contactsImg").style.display = "none";//隐藏

        $scope.toDisplayBox1 = function () {
            if (document.getElementById("add_bgbox1").style.display == "none") {
                document.getElementById("add_bgbox1").style.display = "";//显示
                document.getElementById("add_contactsImg1").style.display = "";

            } else {
                document.getElementById("add_bgbox1").style.display = "none";//隐藏
                document.getElementById("add_contactsImg1").style.display = "none";//隐藏
            }
        };


        $scope.addNewWork1 = function () {
            $state.go('app.newWork');
        };



        $scope.selectTabWithIndex = function (index) {
            $ionicTabsDelegate.select(index);
            if (index == 0) {
                getOrderBySelectTabs();
            }
        };


        var getOrderByStates = function (status) {
            var forNowlist = [];
            for (let index = 0; index < currentOrder.length; index++) {
                var userStatus = currentOrder[index].Status__c;

                if (userStatus == status) {
                    forNowlist.push(currentOrder[index]);
                }

            }
            return forNowlist;
        };
        var getOrderById = function (sendId) {
            console.log("getOrderById:",sendId);
            for (let index = 0; index < allUser.length; index++) {
                var userId = allUser[index].userId;
                if (userId == sendId) {
                    // console.log("getOrderById_UserId:",userId);

                    return allUser[index];
                }
            }
        };
        var getOrderBySelectTabs = function (status) {

            // 这里是获取全部工单的请求
            HomeService.getEachOrder().then(function (res) {
                allUser = res;
                if (typeof(getOrderById(oCurrentUser.Id))  === 'undefined') {
                    newArray =  allUser[0].orders
                } else {
                    currentOrder = getOrderById(oCurrentUser.Id).orders;
                }
                $rootScope.AllCount = currentOrder.length;
                //未安排 Not Planned
                $rootScope.NotPlannedCount = getOrderByStates("Not Planned").length;
                //未开始 "Not Started"
                $rootScope.NotStartedCount = getOrderByStates("Not Started").length;
                //进行中 "Not Completed"
                $rootScope.NotCompletedCount = getOrderByStates("Not Completed").length;
                //已完成 "Service Completed"
                $rootScope.ServiceCompletedCount = getOrderByStates("Service Completed").length;


            }, function (error) {
                console.log('getEachOrder Error ' + error);
            });
        };

    });

