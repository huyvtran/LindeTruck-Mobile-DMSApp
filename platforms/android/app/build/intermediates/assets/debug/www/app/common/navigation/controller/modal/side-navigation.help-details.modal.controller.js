angular.module('oinio.common.navigation')
    .controller('SideNavigationHelpModalController', function ($scope, $log, $filter, $ionicViewSwitcher, $q, $http,
                                                             parameters) {

        var vm = this;
        vm.helpSection = parameters.helpSection;
        vm.helpSectionPath = 'cl.help.' + vm.helpSection + '.';

        /**
         * @desc load part of JSON with help for particular section
         *
         * @author kacperSlotwinski
         */
        vm.getHelpTxt = function (section) {
            var defer = $q.defer();
            var output;

            $http.get('app/common/i18n/locale-en_US.json').success(function (response) {
                output = response.cl.help[section];
                defer.resolve(output);
                // return output;
            }).error(function (response) {
                console.log('Not response in' + response);
            });
            return defer.promise;
        };

        /**
         * @desc load JSON help section into variable
         *
         * @author kacperSlotwinski
         */
        vm.getHelpTxt(vm.helpSection).then(function (output) {
            vm.helpHintOutput = output;
        });

        vm.closeHelpModal = function () {
            $scope.closeModal();
        };

    });
