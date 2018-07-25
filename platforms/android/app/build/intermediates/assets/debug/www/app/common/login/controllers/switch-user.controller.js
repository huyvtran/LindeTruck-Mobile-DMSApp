/**
 * This customized switch user page is aimed to solve the issue below:
 * On standard switch user page, user has the chance to logout as another user.
 */
angular.module('oinio.common.login')
    .controller('SwitchUserController', function ($rootScope, $scope, $location, $state, $filter, $log, LoginService, LocalCacheService,
                                                  UtilService, SalesforceLoginService, SmartConnectorService) {
        var vm = this;
        vm.users = [];

        vm.local = false;
        if ($location.search() && $location.search().local) {
            vm.local = true;
        }

        vm.themeClass = $rootScope.themeClass;

        /**
         * @desc get Service for Users where user accounts already logged in
         */
        SalesforceLoginService.getUsers(function (users) {
            vm.users = users;
            $scope.$apply();
        });

        /**
         * @func switchToUser
         * @desc switchToUser
         *
         * @param {string} user
         */
        vm.switchToUser = function (user) {
            var currentUser = LocalCacheService.get('currentUser');

            if (currentUser.Username === user.Username) {
                $state.go('login');
            } else {
                //Disconnect from SmartConnector
                SmartConnectorService.disconnectSmartConnector().then(function () {
                    $log.info('SwitchUserController loginAsNewUser: SmartConnector disconnected');
                }).finally(function () {
                    SalesforceLoginService.switchToUser(user);
                });
            }
        };

        vm.loginAsNewUser = function () {
            //Disconnect from SmartConnector
            SmartConnectorService.disconnectSmartConnector().then(function () {
                $log.info('SwitchUserController loginAsNewUser: SmartConnector disconnected');
            }).finally(function () {
                SalesforceLoginService.switchToUser();
            });
        };
    });
