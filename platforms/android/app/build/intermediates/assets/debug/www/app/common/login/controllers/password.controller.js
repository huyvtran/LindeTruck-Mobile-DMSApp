angular.module('oinio.common.login')
    .controller('PasswordController', function ($rootScope, $scope, $state, $filter, LoginService, LocalCacheService, $http, md5, UtilService, MetaService, ModalService, APP_SETTINGS) {

        var vm = this;

        vm.user = null;

        vm.loadUserNameFromCache = function () {
            vm.user = LocalCacheService.get('currentUser');
        };

        vm.themeClass = $rootScope.themeClass;

        $scope.confirmFailure = false;
        $scope.confirmQuestionFailure = false;

        vm.dataSubmit = function (password, confirmPassword, userQuestion, userAnswer) {

            if (!password) {
                $scope.confirmFailure = true;
                $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_passwordCannotBeBlank');
                return false;
            } else if (password != confirmPassword) {
                $scope.confirmFailure = true;
                $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_theTwoPasswordsDoNotMatch');
                return false;
            } else if (!userQuestion) {
                $scope.confirmQuestionFailure = true;
                $scope.questionErrorMsg = $filter('translate')('cl.loginInteraction.msg_questionCannotBeBlank');
                return false;
            } else if (!userAnswer) {
                $scope.confirmQuestionFailure = true;
                $scope.questionErrorMsg = $filter('translate')('cl.loginInteraction.msg_answerCannotBeBlank');
                return false;
            } else {

                password = md5.createHash(password);
                userAnswer = md5.createHash(userAnswer);

                LoginService.setLocalUserPassword(vm.user.Username, password, userQuestion, userAnswer).then(function (result) {
                    if (result.success) {
                        $scope.confirmFailure = false;
                        UtilService.isDeviceOnline().then(function (isOnline) {
                            if (isOnline) {
                                MetaService.appInitialized().then(function (initialized) {
                                    if (initialized === false || APP_SETTINGS.SYNCHRONIZE_AFTER_LOGIN === true) {
                                        $state.go('synchronize');
                                    }
                                    else {
                                        $state.go(APP_SETTINGS.START_VIEW);
                                    }
                                });
                            } else {
                                $state.go(APP_SETTINGS.START_VIEW);
                            }
                        });
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
            }
        };

        vm.helpHint = function () {

            ModalService.show(
                'app/common/login/templates/modal/password.help-details.view.html',
                'SideNavigationHelpModalController as vm', {
                    helpSection: 'password'
                });
        };

        /**
         * @desc get Questions from JSON
         */
        $http.get('app/common/i18n/locale-en.json').success(function (response) {
            $scope.passwordQuestions = response.cl.loginInteraction.passwordQuestions;
        }).error(function (response) {
            console.log('Not response in' + response);
        });

    });
