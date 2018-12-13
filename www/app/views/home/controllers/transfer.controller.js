angular.module('oinio.TransferController', [])
    .controller('TransferController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,
                                                ConnectionMonitor, LocalCacheService,ForceClientService,AppUtilService) {
        var vm = this,
            currentOrderId=null,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        $scope.allWorkers=[];
        $scope.getInitDataUri="/WorkDetailService";
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
            ForceClientService.getForceClient().apexrest(
                $scope.getInitDataUri+'/'+currentOrderId+'/'+oCurrentUser.Id,
                "GET",
                {},
                null,
                function callBack(res) {
                    AppUtilService.hideLoading();
                    $scope.allWorkers=[];
                    if (res.assignUser.length>0){
                        for (var i =0;i<res.assignUser.length;i++){
                            var arr = res.assignUser[i].split(',');
                            $scope.allWorkers.push({
                                userId:arr[0],
                                userName:arr[1]
                            }) ;
                        }
                    }
                },function error(msg) {
                    AppUtilService.hideLoading();
                    console.log(msg);
                    $ionicPopup.alert({
                        title:"舒适化小组内成员数据失败"
                    });
                    return false;
                }
            );
        };

        $scope.goBack=function () {
            window.history.back();
        };

        $scope.submit=function () {
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                ""
            );
        };
    });
