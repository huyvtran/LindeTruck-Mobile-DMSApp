angular.module('oinio.NewOfferFittingsController', [])
    .controller('NewOfferFittingsController', function ($scope, $ionicPopup, $stateParams, HomeService, $state, $rootScope,SQuoteService) {
        var toDisplayDelCarBool = false;
        var tabSVViewNewIndex = 1;
        var selectAcctSetId;
        $scope.currentOrdertest = [1,2,3,4];
        $(document).ready(function () {
        });
        $scope.$on('$ionicView.enter', function () {
            console.log("NewOfferFittingsController");
        
        });
        $scope.goBack = function () {
            window.history.back();
        };
        


    });

