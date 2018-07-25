(function (angular) {

    'use strict';

    angular
        .module('oinio.common.touch-id')
        .service('TouchIdService', function ($state, $filter, $timeout, MetaService, IonicLoadingService, APP_SETTINGS) {

            var vm = this;

            vm.touchId = function () {
                // after checking window.plugins and window.plugins.touchid are available
                window.plugins.touchid.isAvailable(
                    /**
                     * @desc success callback, invoked when it's available.
                     * @param {object} msg
                     */
                    function (msg) {
                        //console.log('touch-id is available');
                        window.plugins.touchid.verifyFingerprintWithCustomPasswordFallbackAndEnterPasswordLabel(
                            // The message shown in the fingerprint window
                            'Scan your fingerprint to log in',
                            'Enter Local Password', // this replaces the default 'Enter password' label

                            /**
                             * @desc success callback, invoked when the fingerprint matched.
                             */
                            function () {
                                console.log('Verification success! ' + JSON.stringify(msg));
                                // check if app is already initialized or sync should be done after login
                                MetaService.appInitialized().then(function (initialized) {
                                    if (initialized === false || APP_SETTINGS.SYNCHRONIZE_AFTER_LOGIN === true) {
                                        $state.go('synchronize');
                                    }
                                    else {
                                        $state.go(APP_SETTINGS.START_VIEW);
                                    }
                                });
                            },

                            // -1 - Fingerprint scan failed more than 3 times
                            // -2 or -128 - User tapped the 'Cancel' button
                            // -3 - User tapped the 'Enter Passcode' or 'Enter Password' button
                            // -4 - The scan was cancelled by the system (Home button for example)
                            // -6 - TouchID is not Available
                            // -8 - TouchID is locked out from too many tries
                            /**
                             * @desc error callback, invoked in any other case, use the error codes to determine what to do next.
                             * @param {object} msg
                             */
                            function (msg) {
                                console.log('TOUCHID MESSAGECODE ', JSON.stringify(msg.code));
                                if (msg.code === -2 || msg.code === -128) {
                                    // User tapped the 'Cancel' button.
                                    $state.go('login');
                                } else if (msg.code === -3) {
                                    //User tapped the 'Enter Passcode' or 'Enter Password' button.
                                    $state.go('login');
                                } else {
                                    IonicLoadingService.show($filter('translate')('cl.touchID.lb_forwarded_local_login'));
                                    $timeout(function () {
                                        IonicLoadingService.hide();
                                        $state.go('login');
                                    }, 4000);
                                }
                            }
                        );
                    },

                    /**
                     * @desc error callback, invoked when it's not available.
                     */
                    function (msg) {
                        console.log('touch-id is not available. Details: ' + JSON.stringify(msg));
                        $state.go('login');
                    }
                );
            };
        });
})(angular);
