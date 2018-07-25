(function () {

    'use strict';

    /**
     * Module oinio.common.services ProjectHierarchyService
     */
    angular.module('oinio.common.services')
        .service('ProjectHierarchyService', function ProjectHierarchyService($q, $log) {

            var service = this;
            service.projectSid = -1;
            service.hierarchy = [];

            /**
             * gather project hierarchy for job
             * @param {number} projectSid
             * @returns {*|promise}
             */
            this.getProjectHierarchy = function (projectSid) {

                var deferred = $q.defer();

                if (projectSid && service.projectSid !== projectSid) {
                    // load project hierarchy
                    service.projectSid = projectSid;

                    var projects = [];

                    queryProject(projectSid).then(function () {
                        service.hierarchy = projects.slice().reverse();

                        // resolve project hierarchy
                        deferred.resolve(service.hierarchy);
                    }, function (error) {
                        $log.error('>>>> Error in ProjectHierarchyService getProjectHierarchy(): ' + error);
                    }, function (project) {
                        // add project to hierarchy
                        projects.push(project);
                    });
                }
                else {
                    // return cached hierarchy
                    deferred.resolve(service.hierarchy);
                }

                return deferred.promise;
            };

            /**
             *
             * @param {number} sid
             * @returns {*}
             */
            function queryProject(sid) {

                var deferred = $q.defer();

                var smartQuery = 'SELECT {ISW_Project__c:_soup} FROM {ISW_Project__c} ' +
                    'WHERE {ISW_Project__c:_soupEntryId} = ' + sid +
                    ' AND {ISW_Project__c:RecordType_DeveloperName__c} != \'Unallocated_Project\'';

                var querySpec = navigator.smartstore.buildSmartQuerySpec(smartQuery, 1);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {

                        if (cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length > 0) {
                            var project = cursor.currentPageOrderedEntries[0][0];
                            var parentProject = project['ParentProject__c_sid'];

                            // notify calling function with current project
                            deferred.notify(project);

                            if (parentProject) {
                                // if current project also has a parent project, load next parent project
                                deferred.resolve(queryProject(parentProject));
                            }
                            else {
                                // if current project has no further parent project resolve backt to calling function
                                deferred.resolve('done');
                            }
                        }
                    }, function (error) {
                        $log.error('>>>> Error in ProjectHierarchyService queryProject(): ' + error);
                        deferred.reject('Error while querying ISW_Project__c');
                    }
                );

                return deferred.promise;
            }
        });
})();
