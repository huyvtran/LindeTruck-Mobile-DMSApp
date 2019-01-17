(function() {

    'use strict';

    angular.module('oinio.services')
        .service('Service1Service', function($q, $log, $filter,LocalDataService,SMARTSTORE_COMMON_SETTING,
                                             ConnectionMonitor,
                                             LocalSyncService,
                                             IonicLoadingService,
                                             ForceClientService) {
            //Service1Service content Start.
            let service = this;
            let hosturl = '/services/apexrest/Service1Service?';




            /**
             * replace function of HomeService.getUserObjectById
             */
            this.getUserObjectById = function (str_userId,isOnline) {
                if(isOnline){
                    let url = service.buildURL('querySobject','select id from user where id = ""');
                    let requestMethod = 'GET';
                    return service.sendRest(url,requestMethod);
                }else{
                    let deferred = $q.defer();

                    let sql =  "select {User:_soup}\
                         from {User}\
                         where {User:Id}='"+Id+"'";
                    let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        let user;
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                user = entry[0];
                            });
                        }
                        deferred.resolve(user);
                    }, function (err) {
                        $log.error(err);
                        console.error(err);
                        deferred.reject(err);
                    });
                    console.log('getUserObjectById::', deferred.promise);
                    return deferred.promise;
                }
            };



            this.buildURL = function (str_type,str_param) {
                return 'type=' + str_type + '&param=' + str_param;
            };

            this.sendRest = function (url,requestMethod) {
                var deferred = $q.defer();

                ForceClientService.getForceClient().apexrest(hosturl + url, requestMethod, {}, null, function (response) {
                    deferred.resolve(response);
                }, function (error) {
                    console.log('Service1Service::sendRest::error::',error);
                    deferred.reject(new Exception(EXCEPTION_SEVERITY.RECOVERABLE, error.status, msg, error.stack, error));
                });

                return deferred.promise;
            };

        //Service1Service content End.
        });
})();





























