(function () {

    'use strict';

    /**
     * Module oinio.common.lookup LookupService
     */
    angular.module('oinio.common.lookup')
        .service('LookupModalService', function LookupService($q, $log) {

            /**
             * lookup search
             * @param {string} objectType
             * @param {string} searchTerm
             * @param {string} searchField
             * @param {string} [recordTypeDeveloperName]
             * @returns {*|promise}
             */
            this.searchLookup = function (objectType, searchTerm, searchField, recordTypeDeveloperName) {
                var deferred = $q.defer();

                var smartQuery = 'SELECT {' + objectType + ':_soup} FROM {' + objectType + '}';

                // JOIN and WHERE clause for RecordType if DeveloperName is given
                var recordTypeClause = null;
                if (recordTypeDeveloperName) {

                    smartQuery = smartQuery + ' JOIN {RecordType} ON {RecordType:_soupEntryId} = {' + objectType + ':RecordTypeId_sid} ';

                    recordTypeClause = '{RecordType:DeveloperName} = \'' + recordTypeDeveloperName + '\'';
                }

                // WHERE clause for search term
                if (searchTerm) {
                    smartQuery = smartQuery + ' WHERE {' + objectType + ':' + searchField + '} LIKE \'%' + searchTerm + '%\'';
                }

                // complete smart query
                if (recordTypeClause) {
                    if (searchTerm) {
                        smartQuery = smartQuery + ' AND ';
                    }
                    else {
                        smartQuery = smartQuery + ' WHERE ';
                    }

                    smartQuery = smartQuery + recordTypeClause;
                }

                // execute smart query
                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartQuery, 25);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {

                        // build result
                        var lookups = [];

                        for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                            var entry = cursor.currentPageOrderedEntries[i];
                            lookups.push(entry[0]);
                        }

                        deferred.resolve({
                            lookups: lookups,
                            hasNextPage: (cursor.totalPages > 1),
                            cursor: cursor,
                            currentPage: 0
                        });
                    }, function (error) {
                        $log.error('>>>> Error in LookupService searchLookup(): ' + error);
                        deferred.reject('Error while searching lookups');
                    }
                );

                return deferred.promise;
            };

            /**
             * next page
             * @param {*} currentCursor
             * @param {number} currentPage
             * @returns {*|promise}
             */
            this.nextPage = function (currentCursor, currentPage) {
                var deferred = $q.defer();

                currentPage++;

                // move cursor to next page
                navigator.smartstore.moveCursorToPageIndex(currentCursor, currentPage, function (cursor) {

                    // build result
                    var lookups = [];

                    for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {
                        var entry = cursor.currentPageOrderedEntries[i];
                        lookups.push(entry[0]);
                    }

                    deferred.resolve({
                        lookups: lookups,
                        hasNextPage: (cursor.currentPageIndex < cursor.totalPages - 1),
                        cursor: cursor,
                        currentPage: currentPage
                    });
                }, function (error) {
                    $log.error('>>>> Error in LookupService nextPage(): ' + error);
                    deferred.reject('Error while paging lookups');
                });

                return deferred.promise;
            };

            /**
             * close cursor for lookup search
             * @param {*} cursor
             */
            this.resetSearch = function (cursor) {
                var deferred = $q.defer();

                if (cursor) {
                    // close smartstore cursor
                    navigator.smartstore.closeCursor(cursor, function () {
                        $log.debug('>>>> LookupService cursor closed');
                        deferred.resolve('cursor closed');
                    }, function (error) {
                        deferred.reject('error while closing cursor');
                        $log.error('>>>> Error in LookupService resetSearch(): ' + error);
                    });
                }
                else {
                    deferred.resolve('no cursor');
                }

                return deferred.promise;
            };
        });
})();
