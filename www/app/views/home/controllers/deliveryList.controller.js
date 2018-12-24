angular.module('oinio.deliveryListController', [])
    .controller('deliveryListController', function ($scope ,$stateParams) {

        $scope.goBack = function () {
            window.history.go(-1);
        };
      $scope.$on('$ionicView.beforeEnter', function () {

      });

    });

