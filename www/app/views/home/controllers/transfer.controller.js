angular.module('oinio.TransferController', [])
    .controller('TransferController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,
                                                ConnectionMonitor, LocalCacheService,ForceClientService,AppUtilService,dualModeService) {
        var vm = this,
            currentOrderId=null,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        $scope.allWorkers=[];
        $scope.getInitDataUri="/WorkDetailService";
        $scope.postUri="/services/apexrest/HomeService?action=reAssign&userId=";
        $scope.$on('$ionicView.beforeEnter', function () {
            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        });

        $scope.$on('$ionicView.enter', function () {

            console.log("$stateParams.workOrderId",$stateParams.workOrderId);
            currentOrderId= $stateParams.workOrderId;
            $scope.initPageAllWokers();
        });

        $scope.initPageAllWokers=function(){
            AppUtilService.showLoading();
            $scope.allWorkers=[];
            dualModeService.getWorkOrderUtilInfo(Number(localStorage.onoffline),currentOrderId, Number(localStorage.onoffline) !== 0 ? oCurrentUser.Id:oCurrentUser._soupEntryId).then(function callBack(res) {
                AppUtilService.hideLoading();
                if (res.assignUser!=undefined && res.assignUser!=null && res.assignUser.length>0){
                    for (var i =0;i<res.assignUser.length;i++){
                        var singleUser = res.assignUser[i].split(',');
                        $scope.allWorkers.push({
                            userId:singleUser[0],
                            userName:singleUser[1]
                        });
                    }
                    setTimeout(function () {
                        if (res.soResult!=undefined&&res.soResult!=null){
                            if (res.soResult.Service_Order_Owner__c!=undefined&&res.soResult.Service_Order_Owner__c!=null){
                                $('#selectUserGroup').find('option[value =' +res.soResult.Service_Order_Owner__c+']').attr('selected', true);
                            }
                        }
                    },200);
                }

            },function error(msg) {
            AppUtilService.hideLoading();
            console.log(msg);
            }
        );

        };

        $scope.goBack=function () {
            window.history.back();
        };

        $scope.submit=function () {
            var index = $('option:selected', '#selectUserGroup').index();
            var userId = $scope.allWorkers[index].userId;
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.postUri+userId+"&serviceOrderOverviewId="+currentOrderId,
                'POST',
                {},
                null,
                function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if(res.status.toLowerCase()=="success"){
                        $state.go("app.home");
                        $rootScope.getSomeData();
                    }else{
                        $ionicPopup.alert({
                            title:"提交失败",
                            template:res.message
                        });
                        return false;
                    }
                },function error(msg) {
                 AppUtilService.hideLoading();
                 console.log(msg);
                 $ionicPopup.alert({
                     title:"提交失败",
                     template:msg
                 });
                 return false;
                }
            );

        };
    });
