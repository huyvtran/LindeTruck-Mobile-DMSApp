angular.module('oinio.controllers', [])
    .controller('HomeController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
        LocalCacheService) {

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
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }

        });
        //加号“+”菜单
        // document.getElementById("add_bgbox").style.display = "none";//隐藏
        // document.getElementById("add_contactsImg").style.display = "none";//隐藏

        $scope.toDisplayBox = function () {
            if (document.getElementById("add_bgbox").style.display == "none") {
                document.getElementById("add_bgbox").style.display = "";//显示
                document.getElementById("add_contactsImg").style.display = "";

            } else {
                document.getElementById("add_bgbox").style.display = "none";//隐藏
                document.getElementById("add_contactsImg").style.display = "none";//隐藏


            }
        };


        $scope.addNewWork = function () {
            $state.go('app.newWork');
        };

    });

