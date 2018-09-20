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
            $scope.TruckId ="";
            $scope.HasTruckNum = 0;
        });
        $scope.$on('$ionicView.enter', function () {
            vm.isOnline = ConnectionMonitor.isOnline();
            if (oCurrentUser) {
                vm.username = oCurrentUser.Name;
            }
            console.log("$stateParams.SendInfo",$stateParams.SendInfo);
            var userInfoId = $stateParams.SendInfo;
            HomeService.getOrder(userInfoId).then(function (response) {
                if(response.length>0){
                    $scope.busyerName = response[0].Account_Ship_to__r.Name!=null?response[0].Account_Ship_to__r.Name:"";
                    $scope.OwnerId = response[0].Account_Ship_to__r.Customer_Number__c !=null ? response[0].Account_Ship_to__r.Customer_Number__c:"";
                    $scope.workAccountId=response[0]._soupEntryId;
                    var busyType = response[0].Service_Order_Type__c;
                    if (busyType!=null){
                         if (busyType == "Work Order"){
                             $scope.busyerType ='工单';
                         }else if (busyType =="Customer Consult"){
                            $scope.busyerType ='客户咨询';
                        }else if (busyType =="Customer Complaint"){
                            $scope.busyerType ='客户投诉';
                        }
                    }else {
                        $scope.busyerType ='';
                    }
                    console.log('resp::',response);
                    HomeService.getTrucksForParentOrderSid(userInfoId).then(function (res) {
                        var str= "";
                        angular.forEach(res,function (item) {
                            str += item.Name+";\n";
                        });
                        $scope.HasTruckNum = res !=null ? res.length: 0;
                        $scope.TruckId = str;
                    },function (error) {
                        $log.error('Error ' + error);
                        $scope.TruckId ="";
                    });
                }else{
                    $scope.busyerName ="";
                    $scope.busyerType="";
                    $scope.OwnerId="";
                    $scope.TruckId-"";
                }
                //console.log("response.Service_Order_Owner__r:",response[0].Service_Order_Owner__r);

            },function (error) {
                $log.error('Error ' + error);
            });
        });

        $scope.toDetailInfo = function(){
            if (document.getElementById("detailContent").style.display == "none") {
                document.getElementById("detailContent").style.display = "";//显示
                document.getElementById("detailImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("detailContent").style.display = "none";//隐藏
                document.getElementById("detailImg").className = "OpenClose_Btn arrow_Down_White";

            }
        };
        $scope.toWorkInfo = function(){
            if (document.getElementById("workContent").style.display == "none") {
                document.getElementById("workContent").style.display = "";//显示
                document.getElementById("workImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("workContent").style.display = "none";//隐藏
                document.getElementById("workImg").className = "OpenClose_Btn arrow_Down_White";

            }
        };
        $scope.toPartsInfo = function(){
            if (document.getElementById("partContent").style.display == "none") {
                document.getElementById("partContent").style.display = "";//显示
                document.getElementById("partImg").className = "OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("partContent").style.display = "none";//隐藏
                document.getElementById("partImg").className = "OpenClose_Btn arrow_Down_White";

            }
        };
        $scope.toServiceInfo = function(){
            if (document.getElementById("serviceContent").style.display == "none") {
                document.getElementById("serviceContent").style.display = "";//显示
                document.getElementById("serviceImg").className ="OpenClose_Btn arrow_Down_White";
            } else {
                document.getElementById("serviceContent").style.display = "none";//隐藏
                document.getElementById("serviceImg").className = "OpenClose_Btn arrow_Down_White";

            }
        };

        $scope.goBack = function () {
            window.history.back();
        };

        $scope.goSave =function () {
            $state.go("app.home");
        };

    });

