(function (angular) {

    'use strict';

    /**
     * Module oinio.common.services UserAssignmentService
     */
    angular.module('oinio.common.services')
        .service('UserAssignmentService', function UserAssignmentService($q, $filter, $injector, $log, LocalCacheService, SMARTSTORE_COMMON_SETTING) {
            var initialized = false;

            var assignedSteps = null;
            var assignedStepsSid = null;

            var assignedJobs = null;
            var assignedJobsSid = null;

            var assignedSubProjects = null;
            var assignedSubProjectsSid = null;

            var assignedMasterProjects = null;
            var assignedMasterProjectsSid = null;

            /**
             * load user assignment
             * @param {boolean} reload
             * @returns {*}
             */
            this.initUserAssignment = function (reload) {
                var deferred = $q.defer();

                if (!initialized || reload) {

                    assignedSteps = [];
                    assignedStepsSid = [];

                    assignedJobs = [];
                    assignedJobsSid = [];

                    assignedSubProjects = [];
                    assignedSubProjectsSid = [];

                    assignedMasterProjects = [];
                    assignedMasterProjectsSid = [];

                    // workaround for true and null to keep iOS and Android compatibility - smartstore issue
                    var mobileSDKFalse = device.platform === 'iOS' ? 0 : '\'false\'';

                    // current user from cache
                    var currentUser = LocalCacheService.get('currentUser');

                    var query = 'SELECT {AVANTOAssignedUser__c:Step__c}, {AVANTOAssignedUser__c:Step__c_sid}, ' +
                        '{AVANTOAssignedUser__c:Job__c}, {AVANTOAssignedUser__c:Job__c_sid}, ' +
                        '{AVANTOAssignedUser__c:Master_Project__c}, {AVANTOAssignedUser__c:Master_Project__c_sid}, ' +
                        '{AVANTOAssignedUser__c:Project__c}, {AVANTOAssignedUser__c:Project__c_sid},' +
                        '{AVANTOAssignedUser__c:Origin_Record_Id__c}, {AVANTOAssignedUser__c:User__c} FROM {AVANTOAssignedUser__c} WHERE ' +
                        '{AVANTOAssignedUser__c:IsDeleted} = ' + mobileSDKFalse + ' AND {AVANTOAssignedUser__c:User__c} = \'' + currentUser.Id + '\'';

                    var querySpec = navigator.smartstore.buildSmartQuerySpec(query, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);

                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {

                        for (var i = 0; i < cursor.currentPageOrderedEntries.length; i++) {

                            var entry = cursor.currentPageOrderedEntries[i];

                            // only consider these records where the Origin_Record_Id__c is equal to a project/ job/ step Id
                            // these are the actual records where the user got assigned to
                            if (entry[0] && entry[8] === entry[0]) { // user assigned to a step
                                if (entry[1]) { // TODO: double check if null is null on Android and iOS
                                    assignedSteps.push(entry[0]);
                                    assignedStepsSid.push(entry[1]);
                                }

                            }
                            else if (entry[2] && entry[8] === entry[2]) { // user assigned to a job
                                if (entry[3]) { // TODO: double check if null is null on Android and iOS
                                    assignedJobs.push(entry[2]);
                                    assignedJobsSid.push(entry[3]);
                                }

                            }
                            else if (entry[4] && entry[8] === entry[4]) { // user assigned to a master project
                                if (entry[5]) { // TODO: double check if null is null on Android and iOS
                                    assignedMasterProjects.push(entry[4]);
                                    assignedMasterProjectsSid.push(entry[5]);
                                }

                            }
                            else if (entry[6] && entry[8] === entry[6]) { // user assigned to a sub project
                                if (entry[7]) { // TODO: double check if null is null on Android and iOS
                                    assignedSubProjects.push(entry[6]);
                                    assignedSubProjectsSid.push(entry[7]);
                                }
                            }
                        }

                        initialized = true;
                        deferred.resolve({initialized: initialized});
                    }, function (error) {
                        deferred.reject(error);
                    });
                }
                else {
                    deferred.resolve({initialized: initialized});
                }

                return deferred.promise;
            };

            /**
             * step assigned to a user
             * @param {string} stepId - Salesforce Id
             * @returns {boolean}
             */
            this.stepAssigned = function (stepId) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedSteps.indexOf(stepId) > -1);
                });

                return deferred.promise;
            };

            /**
             * step assigned to a user by _soupEntryId
             * @param {number} stepSid - _soupEntryId
             * @returns {boolean}
             */
            this.stepAssignedBySid = function (stepSid) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedStepsSid.indexOf(stepSid.toString()) > -1);
                });

                return deferred.promise;
            };

            /**
             * job assigned to a user
             * @param {string} jobId - Salesforce Id
             * @returns {boolean}
             */
            this.jobAssigned = function (jobId) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedJobs.indexOf(jobId) > -1);
                });

                return deferred.promise;
            };

            /**
             * job assigned to a user by _soupEntryId
             * @param {number} jobSid - _soupEntryId
             * @returns {boolean}
             */
            this.jobAssignedBySid = function (jobSid) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedJobsSid.indexOf(jobSid.toString()) > -1);
                });

                return deferred.promise;
            };

            /**
             * master project assigned to a user
             * @param {string} projectId - Salesforce Id
             * @returns {boolean}
             */
            this.masterProjectAssigned = function (projectId) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedMasterProjects.indexOf(projectId) > -1);
                });

                return deferred.promise;
            };

            /**
             * master project assigned to a user by _soupEntryId
             * @param {number} projectSid - _soupEntryId
             * @returns {boolean}
             */
            this.masterProjectAssignedBySid = function (projectSid) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedMasterProjectsSid.indexOf(projectSid.toString()) > -1);
                });

                return deferred.promise;
            };

            /**
             * sub project assigned to a user
             * @param {string} subProjectId - Salesforce Id
             * @returns {boolean}
             */
            this.subProjectAssigned = function (subProjectId) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedSubProjects.indexOf(subProjectId) > -1);
                });

                return deferred.promise;
            };

            /**
             * sub project assigned to a user by _soupEntryId
             * @param {number} subProjectSid - _soupEntryId
             * @returns {boolean}
             */
            this.subProjectAssignedBySid = function (subProjectSid) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    deferred.resolve(assignedSubProjectsSid.indexOf(subProjectSid.toString()) > -1);
                });

                return deferred.promise;
            };

            /**
             * get user project assignment by _soupEntryId for master project or sub project
             * @param {number} projectSid
             */
            this.getProjectAssignmentBySid = function (projectSid, masterProjectSid) {
                var deferred = $q.defer();

                this.initUserAssignment(false).then(function () {
                    var assigned = assignedSubProjectsSid.indexOf(projectSid.toString()) > -1 || assignedMasterProjectsSid.indexOf(masterProjectSid.toString()) > -1;
                    deferred.resolve(assigned);
                }, function (error) {
                    deferred.reject(false);
                });

                return deferred.promise;
            };

            /**
             * custom cleanup for user assignment changes
             */
            this.cleanupForUserAssignment = function () {
                var deferred = $q.defer();

                $injector.get('MetaService').getMetaValue('lastCleanUpDate')
                    .then(function (lastCleanUpDate) {
                        var date = new Date();
                        date.setMinutes(date.getMinutes() - 5);

                        // process cleanup only when a complete cleanup was not processed
                        if (lastCleanUpDate && new Date(lastCleanUpDate) < date) {
                            var loadingService = $injector.get('IonicLoadingService');
                            loadingService.show($filter('translate')('cl.global.lb_update_user_assignment'));
                            $injector.get('LocalSyncService').cleanUpObjectsByNames(['AVANTOAssignedUser__c', 'ISW_Project__c', 'ISW_Job__c', 'ISW_Step__c', 'WeldDataSet__c'])
                                .then(function () {
                                    $log.debug('Custom cleanup for user Assignment done');
                                    deferred.resolve('done');
                                })
                                .catch(function (error) {
                                    $log.error('Error during updating user assignment');
                                    deferred.reject(error);
                                })
                                .finally(function () {
                                    // update user assignment
                                    this.initUserAssignment(true);
                                    loadingService.hide();
                                }.bind(this));
                        }
                        else {
                            this.initUserAssignment(true);
                            deferred.resolve('done');
                        }
                    }.bind(this))
                    .catch(function (error) {
                        this.initUserAssignment(true);
                        deferred.reject(error);
                    }.bind(this));

                return deferred.promise;
            };
        });
})(angular);
