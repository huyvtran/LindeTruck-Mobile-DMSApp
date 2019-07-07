(function () {

    'use strict';

    angular
        .module('oinio.common.more')
        .controller('SetMoreUserInfoController', SetMoreUserInfoController);

    function SetMoreUserInfoController($scope,$ionicPopup,LocalCacheService) {
        var vm = this;
        var oCurrentUser         = LocalCacheService.get('currentUser') || {};
        vm.userName="";
        vm.userPhone="";
        vm.gpsIntervals=[];
        $scope.$on('$ionicView.enter', function () {
            vm.userName=oCurrentUser.Name;
            vm.userPhone=oCurrentUser.Phone;
            vm.gpsIntervals=["3","5","10","15"];
            NativeStorage.getItem("GpsIntervalVal",function success(data) {
                $('#gspSelect').find('option[value = ' + data + ']').attr(
                    'selected', true);
            },function error(msg) {
                console.log(msg);
            });

        });

        $scope.changeGpsInterval = function () {
            var gpsIntervalTime =  $('#gspSelect option:selected').val();
            NativeStorage.setItem("GpsIntervalVal",gpsIntervalTime,function success(res) {
                $ionicPopup.alert({
                    title: '设置GPS时间间隔'+gpsIntervalTime+"分钟"
                });
                console.log(res);
            },function error(msg) {
                console.log(msg);
            });

        };
    }
})();
