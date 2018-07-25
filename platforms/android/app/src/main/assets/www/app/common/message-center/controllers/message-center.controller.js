(function () {

    'use strict';

    angular
        .module('oinio.common.message-center')
        .controller('MessageCenterController', MessageCenterController);

    MessageCenterController.$inject = ['$scope'];

    function MessageCenterController ($scope) {

        var vm = this;

        /**
         * @func reportSlideChanged
         * @param {number} index
         *
         * @description This function gets an index (number) from the directive on-slide-changed back,
         *              on the basis of the index is a specific view with the respective controller addressed.
         *
         */
        $scope.reportSlideChanged = function (index) {
            switch (index) {
                case 0:
                    vm.messagesIsActive = true;
                    break;
                case 1:
                    vm.queuedIsActive = true;
                    break;
                case 2:
                    vm.overviewIsActive = true;
                    break;
            }
        };
    }
})();
