(function () {

    'use strict';
    angular.module('oinio.coustmoDetaliControllers', [])
        .controller('CoustmoDetaliControllers', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
            LocalCacheService) {
            console.log("coustmoDetaliControllers");

            // 	for (var i = 0; i < 10; i++)
            // 		$scope.items.push(["item list ", i + 1].join(""));

            $scope.toDisplay = function (){
                console.log("display");
                if(document.getElementById("div_baseInfo").style.display == "none"){
                    document.getElementById("div_baseInfo").style.display="";//隐藏
                }else{
                    document.getElementById("div_baseInfo").style.display="none";//隐藏

                }
             };
        });
       
})();