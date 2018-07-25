angular.module('oinio.common.message-center', ['oinio.core'])
    .config(function ($stateProvider) {

        $stateProvider
            .state('app.messagePagelayout', {
                url: '/detail?objectType&sid',
                cache: false,
                views: {
                    menuContent: {
                        templateUrl: 'app/core/object-detail/templates/object-detail.view.html',
                        controller: 'ObjectDetailController as vm'
                    }
                }
            });
    });

