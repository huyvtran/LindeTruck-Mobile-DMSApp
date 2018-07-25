angular.module('oinio.common.login')
    .controller('LoginController', function ($rootScope, $scope, $state, $filter, $log, LoginService, LocalCacheService, md5, MetaService, APP_SETTINGS) {

        var vm = this;

        vm.user = null;

        vm.loadUserNameFromCache = function () {
            vm.user = LocalCacheService.get('currentUser');
        };
        vm.themeClass = $rootScope.themeClass;
        vm.loginApp = function (p) {
            if (p === '' || p == null) {
                $scope.loginFailure = true;
                $scope.loginErrorMsg = $filter('translate')('cl.loginInteraction.msg_youPasswordIsEmpty');
                return false;
            } else {

                p = md5.createHash(p);

                LoginService.loginAsLocalUser(vm.user.Username, p).then(
                    function (result) {
                        if (result.success) {
                            $log.debug('login successfully');
                            $scope.loginFailure = false;

                            // check if app is already initialized or sync should be done after login
                            MetaService.appInitialized().then(function (initialized) {
                                if (initialized === false || APP_SETTINGS.SYNCHRONIZE_AFTER_LOGIN === true) {
                                    $state.go('synchronize');
                                }
                                else {
                                    $state.go(APP_SETTINGS.START_VIEW);
                                }
                            });
                        } else {
                            $log.debug('login failed');
                            $scope.loginFailure = true;

                            $scope.loginErrorMsg = $filter('translate')('cl.loginInteraction.msg_yourPasswordIsInvalid');
                            return false;
                        }
                    }, function (error) {
                        $log.error('>>>> error in LoginController' + error);
                        $scope.loginFailure = true;
                        $scope.loginErrorMsg = $filter('translate')('cl.loginInteraction.msg_yourPasswordIsInvalid');
                        return false;
                    }
                );
            }
        };
    });
