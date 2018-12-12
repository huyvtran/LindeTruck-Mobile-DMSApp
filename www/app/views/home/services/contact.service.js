(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:ContactService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('ContactService', function($q, $filter, $log, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, SMARTSTORE_COMMON_SETTING) {

            let service = this;

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

            /**
             * @func  getAccount
             * @desc  get Account (basic info) by Id
             * @param {String} Id - Account.Id
             * @returns {Promise} Object - Account {Id:"xxx", Name:"xxx", SAP_Number__c:"xxx", Address__c:"xxx"]}
             */
            this.getAccount = function(Id) {
                console.log('getAccount.Id:%s', Id);
                let deferred = $q.defer();

                let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Id}='"+Id+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let account;
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            account = {
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                SAP_Number__c: entry[0].SAP_Number__c,
                                Address__c: entry[0].Address__c,
                                Salesman__c: entry[0].Salesman__c,
                                Salesman_formula__c: entry[0].Salesman_formula__c,
                                Sale_Group_Code__c: entry[0].Sale_Group_Code__c,
                                _soupEntryId: entry[0]._soupEntryId
                            };
                        });
                    }
                    deferred.resolve(account);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getAccount::', deferred.promise);
                return deferred.promise;
            };


            this.getContacts = function(AccountId) {
                let deferred = $q.defer();

                let sql =  "select {Contact:_soup}\
                         from {Contact}\
                         where {Contact:AccountId}='"+AccountId+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let contacts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            contacts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                MobilePhone: entry[0].MobilePhone,
                                Phone: entry[0].Phone,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                        });
                    }
                    deferred.resolve(contacts);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getContacts::', deferred.promise);
                return deferred.promise;
            };


            /**
             * @func  save new Contacts
             * @desc  save Contacts with recordType Service_Contact to Salesforce
             * @param {Contact[]} adrs - the data which should be create and save objects for,
             *      the data should contain
             *  Contact.Name,
             *  Contact.Account.Id          //Customer
             *  Contact.Account._soupEntryId
             *
             *  Contact.Phone,           //Contact Info
             *  Contact.MobilePhone,
             *  Contact.Email,
             *
             *  Contact.Contact_State__c,       //Contact State
             *  Contact.Position_Type__c,       //Job Type
             *
             * @returns {Promise} an array of Contact objects containing like
             *   "_soupId": 1234567890,
             */
            this.addContacts = function (adrs) {
                $log.debug('addContacts:: '+adrs);
                var deferred = $q.defer();

                // console.log(service.recordTypes);
                // var adrRecordType = _.find(service.recordTypes, {
                //     'DeveloperName': 'Service_Contact'
                // });
                // console.log(adrRecordType);

                LocalDataService.createSObject('Contact','Service_Contact').then(function(sobject) {
                    var newItem, adr;
                    var adrsToSave = [];
                    for (var i=0;i<adrs.length;i++){
                        adr = adrs[i];
                        newItem = service.cloneObj(sobject);

                        //newItem['Name'] = adr.Name;
                        newItem['LastName'] = adr.Name;
                        newItem['AccountId'] = adr.Account.Id;
                        newItem['AccountId_sid'] = adr.Account._soupEntryId;
                        newItem['AccountId_type'] = 'Account';

                        newItem['Phone'] = adr.Phone;
                        newItem['MobilePhone'] = adr.MobilePhone;
                        newItem['Email'] = adr.Email;

                        //if(adrRecordType != null && adrRecordType.Id != null){newItem['RecordTypeId'] = adrRecordType.Id;}
                        newItem['Contact_State__c'] = adr.Contact_State__c;
                        newItem['Position_Type__c'] = adr.Position_Type__c;

                        adrsToSave.push(newItem);
                        console.log('newItem::' + newItem);
                        // }
                    }
                    LocalDataService.saveSObjects('Contact', adrsToSave).then(function(result) {
                        console.log('localSave:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        for (var i=0;i<result.length;i++){
                            if (result[i].success){
                                adrs[i]._soupEntryId = result[i]._soupEntryId;
                            }
                        }
                        console.log('localSave222:::',adrs);
                        deferred.resolve(adrs);
                        service.synchronize().then(function () {
                            deferred.resolve('done');
                        });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };

            this.updateContacts = function (adrs) {
                console.log('update contacts:: '+adrs);
                var deferred = $q.defer();
                var adrIds = [];

                angular.forEach(adrs, function (entry) {
                    adrIds.push(entry._soupEntryId);
                });

                LocalDataService.getSObjects('Contact',adrIds).then(function(sobjects) {

                    angular.forEach(sobjects, function (sobject) {
                        angular.forEach(adrs, function (adrItem){
                            if(sobject._soupEntryId == adrItem._soupEntryId){
                                sobject['LastName'] = adrItem.Name;
                                sobject['AccountId'] = adrItem.Account.Id;
                                sobject['AccountId_sid'] = adrItem.Account._soupEntryId;
                                sobject['AccountId_type'] = 'Account';
                                sobject['Phone'] = adrItem.Phone;
                                sobject['MobilePhone'] = adrItem.MobilePhone;
                                sobject['Email'] = adrItem.Email;
                                sobject['Contact_State__c'] = adrItem.Contact_State__c;
                                sobject['Position_Type__c'] = adrItem.Position_Type__c;
                            }
                        });

                    });

                    LocalDataService.updateSObjects('Service_Order__c', sobjects).then(function(result) {
                        console.log('localSave:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        console.log('localSave222:::',result);
                        //deferred.resolve(result);
                        service.synchronize().then(function () {
                             //deferred.resolve('done');
                            deferred.resolve(result);
                        });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };


            /**
             * synchronize to salesforce if device is online
             */
            this.synchronize = function () {
                var deferred = $q.defer();

                if (ConnectionMonitor.isOnline()) {
                    IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));
                    LocalSyncService.syncUpObjectByAll().then(function () {
                        IonicLoadingService.hide();
                        deferred.resolve();
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };


            /**
             * Deep clone for js object
             */
            this.cloneObj = function (obj) {
                var newObj = new Object();
                if(obj.RecordTypeId != null && obj.RecordTypeId != '') {
                    newObj['RecordTypeId'] = obj.RecordTypeId;
                    newObj['RecordTypeId_sid'] = obj.RecordTypeId_sid;
                    newObj['RecordTypeId_type'] = 'RecordType';
                }
                return newObj;
            };




        });
})();





























