(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('goH5Controller', function ($scope, $stateParams) {

      $scope.goBack = function () {
        window.history.go(-1);
      };
      $scope.$on('$ionicView.beforeEnter', function () {
        console.log("$stateParams.SendURL", $stateParams.SendURL);
        document.getElementById("sendUrl").src = $stateParams.SendURL;
      });

    });

})();
