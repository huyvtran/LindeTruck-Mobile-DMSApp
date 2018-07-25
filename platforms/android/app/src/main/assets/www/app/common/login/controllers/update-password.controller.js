angular.module('oinio.common.login')
    .controller('UpdatePasswordController', function ($rootScope, $scope, $state, $filter, $ionicHistory, LoginService, LocalCacheService, md5, APP_SETTINGS) {

        var vm = this;

        vm.user = null;

        vm.loadUserNameFromCache = function () {
            vm.user = LocalCacheService.get('currentUser');
        };
        vm.themeClass = $rootScope.themeClass;

        $scope.confirmFailure = false;
        $scope.confirmSuccess = false;

        /**
         * @desc confirm function for set new Password by change or forgot the Password
         *
         * @param {string} newPassword
         * @param {string} confirmNewPassword
         * @param {boolean} currentPassword
         * @returns {boolean}
         */
        vm.confirmUpdate = function (newPassword, confirmNewPassword, currentPassword) {

            var promise = LoginService.getDataFromUser(vm.user.Username);

            if (false === currentPassword) {

                /**
                 * @desc Forgot Password by outside App
                 */
                promise.then(function (result) {
                    if (result) {

                        var depositedQuestion = result.question,
                            depositedAnswer = result.answer;

                        if (!newPassword) {
                            $scope.confirmFailure = true;
                            $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_passwordCannotBeBlank');
                            return false;

                        } else if (newPassword !== confirmNewPassword) {
                            $scope.confirmFailure = true;
                            $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_theTwoPasswordsDoNotMatch');
                            return false;

                        } else {
                            newPassword = md5.createHash(newPassword);
                            vm.loadService(newPassword, depositedQuestion, depositedAnswer);
                        }
                    }
                });
            }
            else {

                /**
                 * @description Change Password by inside App
                 */
                promise.then(function (result) {
                    if (result) {

                        var depositedPassword = result.password,
                            depositedQuestion = result.question,
                            depositedAnswer = result.answer;

                        if (typeof currentPassword !== 'undefined') {
                            currentPassword = md5.createHash(currentPassword);
                        }

                        if (!newPassword || !currentPassword) {
                            $scope.confirmFailure = true;
                            $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_passwordCannotBeBlank');
                            return false;

                        } else if (newPassword !== confirmNewPassword) {
                            $scope.confirmFailure = true;
                            $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_theNewTwoPasswordsDoNotMatch');
                            return false;

                        } else if (currentPassword !== depositedPassword) {
                            $scope.confirmFailure = true;
                            $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_currentPasswordIsNotCorrect');
                        } else {
                            newPassword = md5.createHash(newPassword);
                            vm.loadService(newPassword, depositedQuestion, depositedAnswer);
                        }
                    }
                });
            }
        };

        /**
         * @desc loadService for update Local User Password.
         *
         * @param {string} newPassword
         * @param {string} depositedQuestion
         * @param {string} depositedAnswer
         */
        vm.loadService = function (newPassword, depositedQuestion, depositedAnswer) {
            LoginService.setLocalUserPassword(vm.user.Username, newPassword, depositedQuestion, depositedAnswer).then(function (result) {

                if (result.success) {
                    $scope.confirmFailure = false;
                    $scope.confirmSuccess = true;
                    $scope.successMsg = $filter('translate')('cl.loginInteraction.msg_newPasswordSavedSuccessfully');
                    // Time for show success Message
                    setTimeout(function () {
                        //$state.go('smartstore-sync');
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go(APP_SETTINGS.START_VIEW);
                    }, 3000);

                } else {
                    $scope.confirmFailure = true;
                    $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_errorMsg');
                    return false;
                }
            }, function (error) {
                $scope.confirmFailure = true;
                $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_errorMsg');

                return false;
            });
        };
    });
