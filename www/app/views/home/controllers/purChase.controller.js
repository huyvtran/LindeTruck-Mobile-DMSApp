(function () {
    'use strict';


    angular.module('oinio.PurChaseController', [])
        .controller('PurChaseController', function ($scope, $rootScope, $filter, $state,$log,$ionicPopup,$stateParams, ConnectionMonitor,
                                                    LocalCacheService,ProcurementInfoService) {

            var vm = this,
                oCurrentUser = LocalCacheService.get('currentUser') || {};
            $scope.recordTypes = [];
            $scope.allBusinesses=[];
            $scope.chooseItem=null;
            vm.isOnline = null;

            /**
             * @func    $scope.$on('$ionicView.beforeEnter')
             * @desc
             */
            $scope.$on('$ionicView.beforeEnter', function () {
                LocalCacheService.set('previousStateForSCReady', $state.current.name);
                LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

                var calendar = new lCalendar();
                calendar.init({
                    'trigger': '#planDate',
                    'type': 'date'
                });
            });
            $scope.$on('$ionicView.enter', function () {
                // check if device is online/offline
                vm.isOnline = ConnectionMonitor.isOnline();
                if (oCurrentUser) {
                    vm.username = oCurrentUser.Name;
                }

                $scope.recordTypes.push({value:"Service Parts Procurement"});
                $scope.recordTypes.push({value:"Service Support Procurement"});



            });

            $scope.showMaterialPage = function(){
                if (document.getElementById("serachMaterialContent").style.display == "none") {
                    document.getElementById("serachMaterialContent").style.display = "block";//显示
                    document.getElementById("busyAllContent").style.display = "none";//隐藏
                } else {
                    document.getElementById("serachMaterialContent").style.display = "none";//隐藏
                    document.getElementById("busyAllContent").style.display = "block";//显示
                }
            };


            $scope.searchForBusiness =function(){
                if (document.getElementById("serachBusinessContent").style.display == "none") {
                    document.getElementById("serachBusinessContent").style.display = "block";//显示
                    document.getElementById("busyAllContent").style.display = "none";//隐藏
                } else {
                    document.getElementById("serachBusinessContent").style.display = "none";//隐藏
                    document.getElementById("busyAllContent").style.display = "block";//显示
                }
            };

            $scope.showBusinessInfo = function(){
                if (document.getElementById("businessBox").style.display == "none") {
                    document.getElementById("businessBox").style.display = "block";//显示
                    document.getElementById("businessInfoImg").className = "arrow_Down_White";
                } else {
                    document.getElementById("businessBox").style.display = "none";//隐藏
                    document.getElementById("businessInfoImg").className = "arrow_Down_White";
                }
            };


            $scope.showBaseInfo = function(){
                if (document.getElementById("baseBugInfo").style.display == "none") {
                    document.getElementById("baseBugInfo").style.display = "block";//显示
                    document.getElementById("baseInfoImg").className = "OpenClose_Btn arrow_Down_White";
                } else {
                    document.getElementById("baseBugInfo").style.display = "none";//隐藏
                    document.getElementById("baseInfoImg").className = "OpenClose_Btn arrow_Down_White";
                }
            };


            $scope.showMaterialInfo = function(){
                if (document.getElementById("materialContent").style.display == "none") {
                    document.getElementById("materialContent").style.display = "block";//显示
                    document.getElementById("materialImg").className = "OpenClose_Btn arrow_Down_White";
                } else {
                    document.getElementById("materialContent").style.display = "none";//隐藏
                    document.getElementById("materialImg").className = "OpenClose_Btn arrow_Down_White";

                }

            };



            $scope.addOrDelMaterial = function(){
                if (document.getElementById("materialAddBox").className == "btn_modify_Div to_Hide") {
                    document.getElementById("materialAddBox").className = "btn_modify_Div to_Open";//显示
                } else {
                    document.getElementById("materialAddBox").className = "btn_modify_Div to_Hide";//隐藏
                }
            };


            $scope.showContentHideBusiness = function(){
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachBusinessContent").style.display = "none";
            };


            $scope.showContentHideMaterial = function(){
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachMaterialContent").style.display = "none";
            };




            $scope.searchBusinessByNameAndId = function(){
                var nameOrId = $("#searchBig").val();
                ProcurementInfoService.querySupplierInformation(nameOrId).then(function success(res) {
                    $log.info(res);
                    console.log(res);
                    if (res.length>0){
                        angular.forEach(res,function (item,index,array){
                            $scope.allBusinesses.push(item);
                        });
                    }

                },function error(msg) {
                    $log.error(msg);
                    console.log(msg);
                });
            };

            $scope.chooseCurrentBusy =function(obj){
                $scope.chooseItem = obj;
                document.getElementById("busyAllContent").style.display = "block";
                document.getElementById("serachBusinessContent").style.display= "none";
                $scope.allBusinesses=[];
            };

            $scope.goBack =function () {
                window.history.back();
            };


            $scope.goSavePurChase =function () {
                var planDate = $("#planDate").val();

                if (!planDate){
                    $ionicPopup.alert({
                        title: "请选择计划日期"
                    });
                    return;
                }


                $state.go('app.home');
            };

        });

})();

