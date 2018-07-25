(function () {

    'use strict';

    /**
     * Module oinio.common.services OpenFileService
     */
    angular.module('oinio.common.services')
        .service('OpenFileService', function OpenFileService($q, $log, FileService, LocalDataService, SMARTSTORE_COMMON_SETTING) {

            /**
             * @func    openFile()
             * @desc    open PDF for current Step. (test functionality)
             */
            this.openFile = function (contentDocumentSid) {
                var platform = device.platform;
                FileService.getFilePath(contentDocumentSid).then(function (fileURL) {

                    var fileURLlen = fileURL.length;
                    var fileType = fileURL.substring(fileURLlen - 3, fileURLlen).toLowerCase();


                    if ((platform !== 'iOS') && (fileType === 'pdf')) {
                        window.openPDF(fileURL);
                    } else {
                        var ref = window.open(fileURL, '_blank', 'location=no,enableViewportScale=yes');
                        ref.addEventListener('loadstart', function (event) {
                            console.log('start: ' + event.url);
                        });
                        ref.addEventListener('loadstop', function (event) {
                            console.log('stop: ' + event.url);
                        });
                        ref.addEventListener('loaderror', function (event) {
                            console.log('error: ' + event.message);
                        });
                        ref.addEventListener('exit', function (event) {
                            console.log(event.type);
                        });

                    }
                });
            };

            /**
             * get all related Salesforce Files for given LinkedEntityId
             * @param {number} linkedEntityId
             * @returns {*|promise}
             */
            this.getRelatedFiles = function (linkedEntityId, objectType) {
                var deferred = $q.defer();

                var smartQuery = 'SELECT {ContentDocument:_soup}, {ContentVersion:_versionDataSynced} FROM {ContentDocumentLink} ' +
                    'INNER JOIN {ContentDocument} ON {ContentDocument:_soupEntryId} = {ContentDocumentLink:ContentDocumentId_sid} ' +
                    'LEFT OUTER JOIN {ContentVersion} ON {ContentVersion:_soupEntryId} = {ContentDocument:LatestPublishedVersionId_sid} ' +
                    'WHERE {ContentDocumentLink:LinkedEntityId_sid} = ' + linkedEntityId + ' AND {ContentDocumentLink:LinkedEntityId_type} = \'' + objectType + '\'';

                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartQuery, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var currentPageEntries = cursor.currentPageOrderedEntries;
                    var files = [];

                    for (var i = 0; i < currentPageEntries.length; i++) {
                        // currentPageEntries[i][0] is necessary because smartstore returns an Array with the included _soup as page entry
                        // in case of a locally created file, there is no _versionDataSynced field on ContentVersion
                        files.push({contentDocument: currentPageEntries[i][0], synchronized: (currentPageEntries[i][1] == 'true' || currentPageEntries[i][1] == '1' || currentPageEntries[i][1] === null)});
                    }

                    deferred.resolve(files);
                }, function (error) {
                    $log.error('>>>> Error in OpenFileService getRelatedFiles: ' + error);
                    deferred.reject('Error while loading related files');
                });

                return deferred.promise;
            };

            /**
             * @description gets all related files for a list of records and a list of object types
             * @param {array} linkedEntityIds
             * @param {string} objectTypes
             */
            this.getAllRelatedFiles = function (linkedEntityIds, objectTypes) {
                var deferred = $q.defer();

                var smartQuery = 'SELECT {ContentDocument:_soup}, {ContentVersion:_versionDataSynced} FROM {ContentDocumentLink} ' +
                    'INNER JOIN {ContentDocument} ON {ContentDocument:_soupEntryId} = {ContentDocumentLink:ContentDocumentId_sid} ' +
                    'LEFT OUTER JOIN {ContentVersion} ON {ContentVersion:_soupEntryId} = {ContentDocument:LatestPublishedVersionId_sid} ' +
                    'WHERE {ContentDocumentLink:LinkedEntityId_sid} IN (' + linkedEntityIds + ') AND {ContentDocumentLink:LinkedEntityId_type} IN (' + objectTypes + ')';

                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartQuery, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                console.log(smartQuery);

                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var currentPageEntries = cursor.currentPageOrderedEntries;
                    var files = [];

                    for (var i = 0; i < currentPageEntries.length; i++) {
                        // currentPageEntries[i][0] is necessary because smartstore returns an Array with the included _soup as page entry
                        // in case of a locally created file, there is no _versionDataSynced field on ContentVersion
                        files.push({contentDocument: currentPageEntries[i][0], synchronized: (currentPageEntries[i][1] == 'true' || currentPageEntries[i][1] == '1' || currentPageEntries[i][1] === null)});
                    }

                    deferred.resolve(files);
                }, function (error) {
                    $log.error('>>>> Error in OpenFileService getAllRelatedFiles: ' + error);
                    deferred.reject('Error while loading all related files');
                });

                return deferred.promise;
            };
        });
})();
