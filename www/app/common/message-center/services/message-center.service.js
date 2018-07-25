/**
 * Module oinio.common.message-center MessageCenterService
 * MessageCenterService- methods to load the objects,error messages in the queue
 */
angular.module('oinio.common.message-center')
    .service('MessageCenterService', ['$q', '$http', '$log', 'SMARTSTORE_COMMON_SETTING', 'LocalDataService', function ($q, $http, $log, SMARTSTORE_COMMON_SETTING, LocalDataService) {
        var service = this;

        var platform = device.platform;
        var queueSoup = SMARTSTORE_COMMON_SETTING.SOUP_NAME_QUEUE;
        var errorState = SMARTSTORE_COMMON_SETTING.QUEUE_MESSAGE_ERROR_STATE;

        /**
         * @func getErrorMessages
         * @returns messages in queue
         **/
        service.getErrorMessages = function () {
            var deferred = $q.defer();

            var smartSql = 'select {' + queueSoup + ':_soup} from {' + queueSoup + '}  where {' + queueSoup + ':state}=' + '"' + errorState + '"';
            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

            navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {
                var currentPageEntries = cursor.currentPageOrderedEntries, queuedObjects = [];
                var object;
                var getNextSObject = function (index) {
                    if (index >= currentPageEntries.length) {
                        deferred.resolve(queuedObjects);
                    } else {
                        object = currentPageEntries[index][0];
                        LocalDataService.getSObject(object.objectName, object.recordSoupEntryId).then(function (result) {
                            object.Name = result.Name;
                            object.objectType = object.objectName;
                            object.sObject = result;
                            queuedObjects.push(object);
                            getNextSObject(++index);
                        }, function (error) {
                            getNextSObject(++index);
                            $log.debug('>>>> error in message-center.service.js getErrorMessages during loading SObject for ' + object.objectName + ': ' + error);
                        });
                    }
                };
                getNextSObject(0);

                return deferred.promise;
            }, function (error) {
                $log.error('>>>> error in MessageCenterService getErrorMessages():' + error);
                deferred.reject(error.details);
            });

            return deferred.promise;
        };

        /**
         * @func getObjectsInQueue
         * @returns objects in queue
         **/
        service.getObjectsInQueue = function () {
            var deferred = $q.defer();

            var smartSql = 'select {' + queueSoup + ':_soup} from {' + queueSoup + '} where ';

            if (platform === 'Android') {
                smartSql += '{' + queueSoup + ':state} = "null" order by {' + queueSoup + ':objectName}';
            }
            else {
                smartSql += '{' + queueSoup + ':state} IS NULL order by {' + queueSoup + ':objectName}';
            }

            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

            navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {
                var currentPageEntries = cursor.currentPageOrderedEntries, queuedObjects = [];
                var object;
                var getNextSObject = function (index) {
                    if (index >= currentPageEntries.length) {
                        deferred.resolve(queuedObjects);
                    } else {
                        object = currentPageEntries[index][0];
                        LocalDataService.getSObject(object.objectName, object.recordSoupEntryId).then(function (result) {
                            object.Name = result.Name;
                            object.objectType = object.objectName;
                            queuedObjects.push(object);
                            getNextSObject(++index);
                        }, function (error) {
                            getNextSObject(++index);
                            $log.debug('>>>> error in message-center.service.js getObjectsInQueue during loading SObject for ' + object.objectName + ': ' + error);
                        });
                    }
                };
                getNextSObject(0);

                return deferred.promise;
            }, function (error) {
                $log.error('>>>> error in MessageCenterService getObjectsInQueue():' + error);
                deferred.reject(error.details);
            });

            return deferred.promise;
        };

        /**
         * @func getQueuedRecordsCount
         * @returns no. of records for each object Type in queue
         **/
        service.getQueuedRecordsCount = function () {
            var deferred = $q.defer();

            var smartSql = 'select {' + queueSoup + ':objectName}, count(*) from {' + queueSoup + '} where {' + queueSoup + ':state} IS NULL group by {' + queueSoup + ':objectName}';

            var querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

            navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {
                var currentPageEntries = cursor.currentPageOrderedEntries, object, queuedObjects = [];
                for (var i = 0; i < currentPageEntries.length; i++) {
                    object = currentPageEntries[i];
                    queuedObjects.push({objectType: object[0], recordCount: object[1]});
                }
                deferred.resolve(queuedObjects);
                return deferred.promise;
            }, function (error) {
                $log.error('>>>> error in MessageCenterService getObjectsInQueue():' + error);
                deferred.reject(error.details);
            });

            return deferred.promise;
        };

        /**
         * @func getSyncedRecordsCount
         * @returns no. of synchronised records for each object Type
         **/
        service.getSyncedRecordsCount = function () {
            var deferred = $q.defer();
            var objectTypes, smartSql, querySpec, objectType, queuedObjects = [];

            LocalDataService.getConfiguredObjectNames().then(function (result) {
                objectTypes = result;

                var getCountOfNextSObject = function (index) {
                    if (index >= objectTypes.length) {
                        deferred.resolve(queuedObjects);
                    } else {
                        objectType = objectTypes[index];
                        smartSql = 'select count(*) from {' + objectType + '}';
                        querySpec = navigator.smartstore.buildSmartQuerySpec(smartSql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                        navigator.smartstore.runSmartQuery(false, querySpec, function (cursor) {
                            var currentPageEntries = cursor.currentPageOrderedEntries;
                            queuedObjects.push({objectType: objectType, recordCount: currentPageEntries[0][0]});
                            getCountOfNextSObject(++index);
                        });
                    }
                };
                getCountOfNextSObject(0);

                return deferred.promise;
            }, function (error) {
                $log.error('>>>> error in MessageCenterService getCountOfSynchronisedRecords():' + error);
                deferred.reject(error.details);
            });

            return deferred.promise;
        };
    }])
;
