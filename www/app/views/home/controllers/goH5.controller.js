angular.module('oinio.goH5Controller', [])
    .controller('goH5Controller', function ($scope) {

        $scope.goBack = function () {
            window.history.go(-1);
        };

       
    });

