'use strict';

angular.module('oinio.common.message-center')
    .component('queuedObjects', {
            templateUrl: 'app/common/message-center/queued-objects/queuedobjects.component.html',
            bindings: {
            },
            controller: function ($scope, $filter, $log, MessageCenterService) {
                var ctrl = this;

                /*$scope.$on('$ionicView.enter', function () { //onInit is getting fire when view entered, see comment below
                 loadObjectsInQueue();
                 });*/

                this.$onInit = function () { //after setting cache:false in routing and removing transclude:true from component defn, $onInit is getting fired every time view is entered
                    loadObjectsInQueue();
                };

                /**
                 * @func loadObjectsInQueue
                 * @description This function fetches all the messages in the queue
                 */
                function loadObjectsInQueue() {
                    MessageCenterService.getObjectsInQueue()
                        .then(function (response) {
                            ctrl.queued = response;
                            var queuedObjects = response;

                            //Change the structure of queuedObjects so that the array is grouped by Object Type
                            var queuedObjectsGrouped = [];
                            if (queuedObjects.length > 0) {
                                var objectType = queuedObjects[0].objectType;
                                var objectsForObjectType = [];
                                for (var i = 0; i < queuedObjects.length; i++) {
                                    if (objectType !== queuedObjects[i].objectType) {
                                        queuedObjectsGrouped.push({objectType: objectType, objects: objectsForObjectType});
                                        objectType = queuedObjects[i].objectType;
                                        objectsForObjectType = [];
                                    }

                                    objectsForObjectType.push(queuedObjects[i]);
                                }
                                //add the last object Type
                                queuedObjectsGrouped.push({objectType: objectType, objects: objectsForObjectType});

                                ctrl.queued = queuedObjectsGrouped;
                            }
                        }, function (error) {
                            $log.error('Error in queued objects component: ' + error);
                        });
                }
                /**
                 * @func getObjectTypeIcon
                 * @description This function fetches the path to the icon of the objectType
                 * @param {string}objectType
                 * @return link
                 */
                this.getObjectTypeIcon = function (objectType) {
                    return 'lib/salesforce-lightning-design-system/assets/icons/standard-sprite/svg/symbols.svg#' + objectType.toLowerCase();
                };
            }
        }
    );
