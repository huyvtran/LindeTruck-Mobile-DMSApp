angular.module('oinio.RefundController', [])
    .controller('RefundController', function ($scope, $rootScope, $filter, $state, $ionicHistory,$stateParams, ConnectionMonitor,
                                                LocalCacheService) {

        $scope.selectRefundInfo = [];
        
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

        

        });
        $scope.$on('$ionicView.enter', function () {
            $scope.selectRefundInfo = $stateParams.refundInfo;
            console.log("$scope.selectRefundInfo:",$scope.selectRefundInfo);
        });

        $scope.goBackgw = function () {
            // window.history.back();
            $ionicHistory.goBack();
        };

                /**
 *删除数组指定下标或指定对象
 */
Array.prototype.remove=function(obj){
    for(var i =0;i <this.length;i++){
        var temp = this[i];
        if(!isNaN(obj)){
            temp=i;
        }
        if(temp == obj){
            for(var j = i;j <this.length;j++){
                this[j]=this[j+1];
            }
            this.length = this.length-1;
        }
    }
}

        $scope.toDelOneRefundView = function (obj) {
            $scope.selectRefundInfo.remove(obj);

        };
        $scope.toDelTwoRefundView = function (bigObj,obj) {
            // console.log("$scope.index:",index);
            // console.log("$scope.obj:",obj);

            bigObj.remove(obj);

        };    
        $scope.goToSave = function () {
            console.log("$scope.selectRefundInfo:",$scope.selectRefundInfo);


        };
    });

