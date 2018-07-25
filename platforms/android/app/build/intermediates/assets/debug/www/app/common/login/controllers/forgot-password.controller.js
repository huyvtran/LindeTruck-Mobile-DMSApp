angular.module('oinio.common.login')
    .controller('ForgotPasswordController', function ($rootScope, $scope, $state, $filter, LoginService, LocalCacheService, md5) {

        var vm = this;

        vm.user = LocalCacheService.get('currentUser').Username;
        vm.themeClass = $rootScope.themeClass;

        var promise = LoginService.getDataFromUser(vm.user);

        promise.then(function (result) {
            if (result) {
                $scope.currentUserQuestion = $filter('translate')('cl.loginInteraction.passwordQuestions.' + result.question);
            } else {
                //todo if currentUser empty
                return false;
            }
        });

        vm.confirm = function (userAnswer) {

            if (!userAnswer) {
                $scope.confirmFailure = true;
                $scope.questionErrorMsg = $filter('translate')('cl.loginInteraction.lb_answerCannotBeBlank');

            } else {

                userAnswer  = md5.createHash(userAnswer);
                var promise = LoginService.getDataFromUser(vm.user);

                promise.then(function (result) {
                    if (result) {

                        var depositedAnswer = result.answer;
                        $scope.confirmFailure = false;

                        if (depositedAnswer === userAnswer) {
                            $scope.confirmFailure = false;
                            $state.go('new-password');
                        } else {
                            $scope.confirmFailure = true;
                            //$scope.questionErrorMsg = 'Answer was not correct';
                            $scope.questionErrorMsg = $filter('translate')('cl.loginInteraction.msg_answerWasNotCorrect');
                            return false;
                        }

                    } else {
                        $scope.confirmFailure = true;
                        //$scope.errorMsg = 'error msg!';
                        $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_errorMsg');
                        return false;
                    }
                }, function (error) {
                    $scope.confirmFailure = true;
                    //$scope.errorMsg = 'error msg!';
                    $scope.errorMsg = $filter('translate')('cl.loginInteraction.msg_errorMsg');
                    return false;
                });
            }
        };
    });
