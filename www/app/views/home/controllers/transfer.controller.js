angular.module('oinio.TransferController', [])
    .controller('TransferController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,
                                                ConnectionMonitor, LocalCacheService,ForceClientService,AppUtilService) {
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
