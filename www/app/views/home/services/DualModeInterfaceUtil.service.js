(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:dualModeService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('dualModeService', function($q, $log, $filter,LocalDataService, SMARTSTORE_COMMON_SETTING,ConnectionMonitor,ForceClientService,
                                            LocalSyncService,IonicLoadingService) {


            /*** INTERFACE ***/
            this.queryAccountInfo(keyword, isOnline){
                let deferred = $q.defer();
                //let result = new Object();
                if(isOnline){
                    let requestUrl = '/TruckFleetTransferService?action=queryAcct&';
                    if(keyword != null && keyword != ''){
                        requestUrl += 'keyWord=' + keyword;
                    }else{
                        deferred.reject('keyword lost !');
                    }
                    deferred.resolve(this.restRequest(requestUrl));
                }else{
                    let res = this.searchAccounts(keyword);
                    deferred.resolve(res);
                }
                return deferred.promise;
            }





            /*** FUNCTION ***/

            this.restRequest = function (requerstUrl) {
                let deferred = $q.defer();
                let result = new Object();

                ForceClientService.getForceClient()
                    .apexrest(
                        requerstUrl,
                        'GET',
                        {

                        },null,function success(res) {
                            console.log(res);
                            result =  res;
                            deferred.resolve(result);
                        },
                        function error(msg) {
                            console.log(msg);
                            deferred.reject(msg);
                        });
                return deferred.promise;
            }

            /**
             * @func  searchAccounts
             * @desc  search (fuzzy) Account list by account name or account sap number
             * @param {String} keyword - part of account name or account sap number
             * @returns {Promise} [Account] - Account list, including Id, Name, SAP_Number__c
             */
            this.searchAccounts = function(keyword){
                console.log('searchAccounts.keyword:%s', keyword);
                let deferred = $q.defer();

                let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+keyword+"%'\
                             or {Account:SAP_Number__c} like '%"+keyword+"%'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let accounts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            accounts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Address__c: entry[0].Address__c,
                                SAP_Number__c: entry[0].SAP_Number__c,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                        });
                    }
                    deferred.resolve(accounts);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('searchAccounts::', deferred.promise);
                return deferred.promise;
            };
        });
})();