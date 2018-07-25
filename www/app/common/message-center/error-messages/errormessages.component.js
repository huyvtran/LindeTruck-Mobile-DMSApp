'use strict';

angular.module('oinio.common.message-center')
    .component('errorMessages', {
            templateUrl: 'app/common/message-center/error-messages/errormessages.component.html',
            bindings: {
            },
            controller: function ($scope, $filter, $log, MessageCenterService, PageLayoutService, ModalService, LocalDataService,
                                  IonicLoadingService, ConnectionMonitor, LocalSyncService, $ionicPopup, $state, APP_SETTINGS) {
                var ctrl = this;

                this.$onInit = function () { //after setting cache:false in routing and removing transclude:true from component defn, $onInit is getting fired every time view is entered
                    loadErrorMessages();
                };

                /**
                 * @func loadErrorMessages
                 * @description This function fetches all the error messages in the queue
                 *
                 */
                function loadErrorMessages () {
                    MessageCenterService.getErrorMessages()
                        .then(function (response) {
                            ctrl.messages = response;
                        }, function (error) {
                            $log.error('Error in error-messages component: ' + error);
                        });
                }
                /**
                 * @func openSobject
                 * @param {Object} object
                 * @description This function opens the selected sobject in PageLayout edit mode
                 *
                 */
                ctrl.openSobject = function (object) {
                    PageLayoutService.generatePageLayoutForSObject(object.sObject, true).then(function (pageLayoutResult) {

                        ModalService.show('app/core/modal/templates/edit.record.modal.view.html', 'SaveModalController as vm', {
                            layout: pageLayoutResult.layout,
                            sobject: object.sObject
                        }, {
                            animation: 'slide-in-up',
                            focusFirstInput: false,
                            backdropClickToClose: false,
                            hardwareBackButtonClose: false
                        }).then(function (save) {

                            if (save === true) {
                                IonicLoadingService.show($filter('translate')('cl.sync.lb_saving'));

                                LocalDataService.updateSObjects(object.sObject.attributes.type, [object.sObject]).then(function (saveSuccess) {
                                    IonicLoadingService.hide();

                                    synchronize(object.sObject.attributes.type);
                                }, function (error) {
                                    IonicLoadingService.hide();
                                    $log.error('>>>> Error in AccountDetailController while saving an record in editDetails(): ' + error);
                                });
                            }
                        }, function (error) {
                            $log.error('>>>> Error in AccountDetailController - editDetails(): ' + error);
                        });
                    }, function (err) {
                        $log.log('>>>> editDetails err in AccountDetailController');
                    });
                };

                /**
                 * synchronize to salesforce if device is online
                 */
                function synchronize(objectType) {
                    if (ConnectionMonitor.isOnline()) {
                        IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));
                        LocalSyncService.syncUpObjectByName(objectType).then(function () {
                            IonicLoadingService.hide();
                            loadErrorMessages();
                        }, function (error) {
                            // TODO: This is only a quick and very dirty fix. Use $q.defer / reject / resolve instead
                            // hide spinner
                            IonicLoadingService.hide();

                            var alertPopup = $ionicPopup.alert({
                                title: 'Synchronization failed.',
                                template: 'Please contact your administrator, if the problem persists.<br /><br /><span style="color:#CCCCCC">' + error + '</span>'
                            });

                            alertPopup.then(function(result) {
                                $log.error('errormessages.component::synchronize failure ==> ' + error);
                                $state.go(APP_SETTINGS.START_VIEW);
                            });
                        });
                    }
                }
            }
        }
    );
