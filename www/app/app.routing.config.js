/**
 * routing for app
 */
(function () {

    'use strict';

    var oinio = angular.module('oinio');

    oinio.config(routing);

    /**
     *
     * @param {object} $stateProvider
     * @param {object} $urlRouterProvider
     */
    function routing($stateProvider, $urlRouterProvider,$ionicConfigProvider) {
        $ionicConfigProvider.tabs.position('bottom');
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'app/common/navigation/templates/side-navigation.view.html',
                controller: 'SideNavigationController as vm'
            })

            // .state('app.home', {
            //     url: 'app/home',
            //     views: {
            //         menuContent: {
            //             templateUrl: 'app/views/home/templates/home.view.html',
            //             controller: 'HomeController as vm'
            //         }
            //     },
            //     cache: false
            // })
            .state('app.home', {
                url: 'app/date_Head',
                views: {
                    menuContent: {
                        templateUrl: 'app/views/home/templates/date_Head.html',
                        controller: 'HomeController as vm'
                    }
                },
                cache: false
            })
            .state('app.search_1', {
                url: 'app/search_1',
                views: {
                    menuContent: {
                        templateUrl: 'app/views/home/templates/search_1.html',
                        controller: 'Search_1Controller as vm'
                    }
                },
                cache: false
            })
            .state('app.customDetail', {
                url: '/customDetail/?SendPassId',
                views: {
                    menuContent: {
                        templateUrl: 'app/views/home/templates/customDetail.html',
                        controller: 'CustomDetailController as vm'
                    }
                }
            })
            /*.state('app.searchView', {
                url: '/searchView?objectType&searchTerm',
                views: {
                    menuContent: {
                        templateUrl: 'app/core/search/templates/search.view.html',
                        controller: 'SearchViewController as vm'
                    }
                }
            })*/

            .state('app.synchronize', {
                url: '/synchronize',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/synchronize/templates/synchronize.view.html',
                        controller: 'SynchronizeController as vm'
                    }
                },
                cache: false
            })

            .state('app.message-center', {
                url: '/message-center',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/message-center/templates/message-center.view.html',
                        controller: 'MessageCenterController as vm'
                    }
                },
                cache:false
            })

            // User Setting
            .state('app.user-setting', {
                url: '/user-setting',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/user-setting/templates/user-setting.view.html',
                        controller: 'UserSettingController as vm'
                    }
                }
            })

            // Pagelayout Route Configurations
            .state('app.pagelayout', {
                url: '/detail?objectType&sid',
                views: {
                    menuContent: {
                        templateUrl: 'app/core/object-detail/templates/object-detail.view.html',
                        controller: 'ObjectDetailController as vm'
                    }
                }
            })

            // Login in App Process
            .state('app.password', {
                url: '/password',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/login/templates/password.view.html',
                        controller: 'PasswordController as vm'
                    }
                }
            })

            .state('app.switch-user', {
                url: '/switch-user',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/login/templates/switch-user.view.html',
                        controller: 'SwitchUserController as vm'
                    }
                }
            })

            .state('app.forgot-password', {
                url: '/forgot-password',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/login/templates/forgot-password.view.html',
                        controller: 'ForgotPasswordController as vm'
                    }
                }
            })

            .state('app.new-password', {
                url: '/new-password',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/login/templates/new-password.view.html',
                        controller: 'UpdatePasswordController as vm'
                    }
                }
            })

            .state('app.change-password', {
                url: '/change-password',
                views: {
                    menuContent: {
                        templateUrl: 'app/common/login/templates/change-password.view.html',
                        controller: 'UpdatePasswordController as vm'
                    }
                }
            })

            // Login outer App Progress
            // routing before App is starting and local login is true
            .state('synchronize', {
                url: '/synchronize',
                templateUrl: 'app/common/synchronize/templates/synchronize.view.html',
                controller: 'SynchronizeController as vm',
                cache: false
            })

            .state('password', {
                url: '/password',
                templateUrl: 'app/common/login/templates/password.view.html',
                controller: 'PasswordController as vm',
                cache: false
            })

            .state('login', {
                url: '/login',
                templateUrl: 'app/common/login/templates/login.view.html',
                controller: 'LoginController as vm',
                cache: false
            })

            .state('switch-user', {
                url: '/switch-user?local',
                templateUrl: 'app/common/login/templates/switch-user.view.html',
                controller: 'SwitchUserController as vm'
            })

            .state('forgot-password', {
                url: '/forgot-password?local',
                templateUrl: 'app/common/login/templates/forgot-password.view.html',
                controller: 'ForgotPasswordController as vm',
                cache: false
            })

            .state('new-password', {
                url: '/new-password',
                templateUrl: 'app/common/login/templates/new-password.view.html',
                controller: 'UpdatePasswordController as vm',
                cache: false
            });

        //if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/home');
    }

})();
