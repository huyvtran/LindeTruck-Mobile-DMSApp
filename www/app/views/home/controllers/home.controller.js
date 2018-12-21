angular.module('oinio.controllers', [])
    .controller('HomeController', function ($scope,$http, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,$ionicTabsDelegate,
                                            LocalCacheService, HomeService) {

      var vm           = this,
          oCurrentUser = LocalCacheService.get('currentUser') || {};
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

        console.log('homeController$ionicView.enter');
      });

      $scope.$on('$ionicView.beforeLeave', function () {
        console.log('移除点击事件');
        document.removeEventListener('click', newHandle);
      });

      $(document).ready(function () {
        document.addEventListener('click', newHandle);//初始化弹框
      });

      // $scope.$on('$ionicView.enter', function () {
      //   console.log('接受点击事件');
      //   document.addEventListener('click', newHandle);//初始化弹框
      //   $scope.get();
      // });
      //新加弹框点击事件
      var newHandle = function (e) {
        //console.log('e.target', e.target);
        //console.log('document.getElementById(btn_modify_Btn)', document.getElementById('add_bgbox1_Btn'));
        if (e.target === document.getElementById('add_bgbox1_Btn')) {
          $scope.toDisplayModifyDiv();
        } else {
          if (document.getElementById('add_bgbox1') && document.getElementById('add_bgbox1').style) {
            document.getElementById('add_bgbox1').style.display = 'none';//隐藏
          }
        }
      };

      $scope.toDisplayModifyDiv = function () {
        if (document.getElementById('add_bgbox1').style.display == 'none') {
          document.getElementById('add_bgbox1').style.display = '';//显示

        } else {
          document.getElementById('add_bgbox1').style.display = 'none';//隐藏
        }
      };

      //加号“+”菜单
      // document.getElementById("add_bgbox").style.display = "none";//隐藏
      // document.getElementById("add_contactsImg").style.display = "none";//隐藏

      $scope.toDisplayBox1 = function () {
        if (document.getElementById('add_bgbox1').style.display == 'none') {
          document.getElementById('add_bgbox1').style.display = '';//显示
          document.getElementById('add_contactsImg1').style.display = '';

        } else {
          document.getElementById('add_bgbox1').style.display = 'none';//隐藏
          document.getElementById('add_contactsImg1').style.display = 'none';//隐藏
        }
      };

      $scope.addCustomer = function () {
        // $http({
        //   method: 'GET',
        //   url: 'http://api.map.baidu.com/place/v2/search?query=' +
        //        JSON.stringify('东丽区华明工业园区华瑞路10号')
        //        + '&bounds=19.356894,73.324615,53.583491,134.845176&output=json&ak=RBfIl5ZzQ4BowljtLFOHurr4DEp8hAoo'
        // }).then(function successCallback(response) {
        //   // 请求成功执行代码
        //   console.log('successCallback', response);
        // }, function errorCallback(response) {
        //   // 请求失败执行代码
        //   console.log('errorCallback', response);
        // });
        // $state.go('app.goH5');

      };

      $scope.addNewWork1 = function () {
        $state.go('app.newWork');
      };

      $scope.addNewOffer = function () {
        $state.go('app.newOffer');
      };
      $scope.serviceManager = function () {
        $state.go('app.serviceManagement');
      };

      $scope.doPurChase = function () {
        $state.go('app.purchase');
      };

      $scope.errorCodeView = function () {
        $state.go('app.errorCode');
      };

      $scope.commonParts = function () {
        $state.go('app.contentTruckPartList');
      };

      $scope.applyTransfer = function () {
        $state.go('app.transferRequestList');
      };

      $scope.selectTabWithIndex = function (index) {
        $ionicTabsDelegate.select(index);
        if (index == 0) {
          getOrderBySelectTabs();
        }
      };

      $scope.selectCalenderStatus = function (index) {
        $ionicTabsDelegate.select(1);
        getOrderBySelectTabs();
        $rootScope.switchelectStatus(index);
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
        console.log('getOrderById:', sendId);
        for (let index = 0; index <  $scope.allUser.length; index++) {
          var userId =  $scope.allUser[index].userId;
          if (userId == sendId) {
            // console.log("getOrderById_UserId:",userId);

            return  $scope.allUser[index];
          }
        }
      };

      var getOrderBySelectTabs = function (status) {

       console.log('allUser',$rootScope.allUser );


        // 这里是获取全部工单的请求
        // HomeService.getEachOrder().then(function (res) {
        //   allUser = res;
          if (typeof(getOrderById(oCurrentUser.Id)) === 'undefined') {
            currentOrder = $rootScope.allUser[0].orders;
          } else {
            currentOrder = getOrderById(oCurrentUser.Id).orders;
          }
          $rootScope.AllCount = currentOrder.length;
          //未安排 Not Planned
          $rootScope.NotPlannedCount = getOrderByStates('Not Planned').length;
          //未开始 "Not Started"
          $rootScope.NotStartedCount = getOrderByStates('Not Started').length;
          //进行中 "Not Completed"
          $rootScope.NotCompletedCount = getOrderByStates('Not Completed').length;
          //已完成 "Service Completed"
          $rootScope.ServiceCompletedCount = getOrderByStates('Service Completed').length;
        //
        // }, function (error) {
        //   console.log('getEachOrder Error ' + error);
        // });
      };

    });

