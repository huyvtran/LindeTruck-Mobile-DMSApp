angular.module('oinio.common.ionicloading')
    .service('IonicLoadingService', function ($rootScope, $ionicLoading) {

        // Trigger the loading indicator
        return {
            show: function (content, showBackdrop) { //code from the ionic framework doc

                var showbd = true;

                if (showBackdrop === false) {
                    showbd = showBackdrop;
                }

                // Show the loading overlay and text
                $rootScope.loading = $ionicLoading.show({

                    template: content,

                    // The text to display in the loading indicator
                    //content: content,

                    // The animation to use
                    animation: 'fade-in',

                    // Will a dark overlay or backdrop cover the entire view
                    showBackdrop: showbd,

                    // The maximum width of the loading indicator
                    // Text will be wrapped if longer than maxWidth
                    maxWidth: 200

                    // The delay in showing the indicator
                    //showDelay: 500
                });
            },
            hide: function () {
                $rootScope.loading = $ionicLoading.hide();
            }
        };
    });

