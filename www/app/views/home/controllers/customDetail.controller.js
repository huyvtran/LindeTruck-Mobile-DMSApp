(function () {
    'use strict';

    angular.module('oinio.CustomDetailController', [])
        .controller('CustomDetailController', function ($scope, $rootScope, $filter, $state, $stateParams, ConnectionMonitor,
                                                    LocalCacheService,$ionicHistory,AppUtilService) {

            $scope.goBack = function () {
                $ionicHistory.goBack();
            }
        });

})();

