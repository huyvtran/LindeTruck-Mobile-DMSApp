(function () {

    'use strict';
    angular.module('oinio.Search_1controllers', [])
        .controller('Search_1Controller', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
            LocalCacheService) {
            $scope.items = ["Chinese", "English", "German", "Italian", "Janapese", "Sweden", "Koeran", "Russian", "French"];
            console.log("fromIndex-------------");

            // 	for (var i = 0; i < 10; i++)
            // 		$scope.items.push(["item list ", i + 1].join(""));

            $scope.toRepair4 = function (){
                console.log("toRepair4");
                $state.go('app.customDetail');
             };
        });
       
})();