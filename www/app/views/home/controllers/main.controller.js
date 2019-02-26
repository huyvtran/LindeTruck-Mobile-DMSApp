(function () {
    'use strict';



});

angular.module('oinio.MainController', [])
    .controller('MainController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                            LocalCacheService,$ionicTabsDelegate,TimeCardService,ForceClientService) {

        var vm = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
      $rootScope.forceClientProd = false;

        vm.isOnline = null;
        cordova.plugins.backgroundMode.on('activate', function () {
            cordova.plugins.backgroundMode.disableWebViewOptimizations();

        });
        cordova.plugins.backgroundMode.setEnabled(true);
        // cordova.plugins.backgroundMode.overrideBackButton();
        var firstIntoApp = true;

        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);
            if (firstIntoApp) {
                $ionicTabsDelegate.select(1);
                firstIntoApp = false;
            }
            console.log("mainController.$ionicView.beforeEnter");
            TimeCardService.fetchVersionInfo();
          var forceClient = ForceClientService.getForceClient().instanceUrl;
          if (forceClient.charAt(16)=='.') {
            $rootScope.forceClientProd = true;
          }else {
            $rootScope.forceClientProd = false;
          }

          if ($rootScope.forceClientProd){
            $rootScope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCWeb4PDAForCRM4Proc"; //生产环境
            $rootScope.timeCardLindeCRMURL = "http://106.14.144.146:660/api/common/accesstoken?appId=linde20180702&amp;secret=363a0910db1dcc47806b63f700ab4b94&amp;companyCode=linde"; //打卡生产环境
              $rootScope.mainDataURL="http://106.14.144.146:660/api/linde/mainData";
            $rootScope.apkDownloadURL = "http://cnxmnazure-vm11.chinacloudapp.cn:98/Prod_seapp.apk"; //生产环境APK下载地址
          } else {
            $rootScope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCWeb4PDAForCRM"; //测试环境
            $rootScope.timeCardLindeCRMURL = "https://lindechinaoatest.gaiaworkforce.com/api/common/accesstoken?appId=linde&amp;secret=linde2018&amp;companyCode=lindechinatest"; //打卡测试环境
              $rootScope.mainDataURL="https://lindechinaoatest.gaiaworkforce.com/api/linde/mainData";
            $rootScope.apkDownloadURL = "http://139.219.108.57:98/SEApp.apk"; //测试环境APK下载地址
          }
        });

        $scope.addNewLinkMan = function () {
            $state.go('app.newLinkMan');
        };

        $scope.$on('$ionicView.enter', function () {
            // check if device is online/offline
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log("mainController.$ionicView.enter");
        });

    });

