(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:SQuoteService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('SQuoteService', function($q, $filter, $log, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, SMARTSTORE_COMMON_SETTING) {

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
                             or {Account:Customer_Number__c} like '%"+keyword+"%'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let accounts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            accounts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Customer_Number__c: entry[0].Customer_Number__c,
                                Office_Address__c: entry[0].Office_Address__c,
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
                                Customer_Number__c: entry[0].Customer_Number__c,
                                Office_Address__c: entry[0].Office_Address__c,
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
             * @func  searchTrucks
             * @desc  search (fuzzy) Truck_Fleet__c list by name
             * @param {String} keyword - part of Truck_Fleet__c name
             * @returns {Promise} [Truck_Fleet__c] - Truck_Fleet__c list, including Id, Name etc.
             */

            this.searchTrucks = function(keyword){
                console.log('searchTrucks.keyword:%s', keyword);
                let deferred = $q.defer();

                let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where {Truck_Fleet__c:Name} like '%"+keyword+"%'";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let trucks = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            trucks.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Family__c: entry[0].Family__c,
                                Model__c: entry[0].Model__c,
                                Ship_To_CS__c: entry[0].Ship_To_CS__c,
                                Maintenance_Key__c: entry[0].Maintenance_Key__c,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                        });
                    }
                    deferred.resolve(trucks);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('searchTrucks::', deferred.promise);
                return deferred.promise;
            };



            /**
             * @func  getMaintenanceLevelsAndDescriptions
             * @desc  get all Maintenance Levels and Maintenance Descriptions for certain Maintenance_Key__c
             * @param {String} keyword - Truck_Fleet__c.Maintenance_Key__c
             * @returns {Promise} Object.levels(Maintenance Levels[] - String list)
             *             Object.descriptions(Maintenance Descriptions[] - String list)
             */

            this.getMaintenanceLevelsAndDescriptions = function(keyword){
                console.log('getMaintenanceLevels.keyword:%s', keyword);
                let deferred = $q.defer();

                let sql =  "select {Maintenance_Key_Level_Parts__c:_soup}\
                         from {Maintenance_Key_Level_Parts__c}\
                         where {Maintenance_Key_Level_Parts__c:Name} like '%"+keyword+"%'";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let result = new Object();
                    let mlevels = [];
                    let mDescs = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            let bool_existMlevel = false;
                            angular.forEach(mlevels, function (mitem) {
                                if (mitem == entry[0].Maintenance_Level__c) {
                                    bool_existMlevel = true;
                                }
                            });
                            if (!bool_existMlevel && entry[0].Maintenance_Level__c != null && entry[0].Maintenance_Level__c != '') {
                                mlevels.push(entry[0].Maintenance_Level__c);
                            }

                            let bool_existMDescs = false;
                            angular.forEach(mDescs, function (mDitem) {
                                if (mDitem == entry[0].Maintenance_Description__c) {
                                    bool_existMDescs = true;
                                }
                            });
                            if (!bool_existMDescs && entry[0].Maintenance_Description__c != null && entry[0].Maintenance_Description__c != '') {
                                mDescs.push(entry[0].Maintenance_Description__c);
                            }
                        });
                        result.levels = mlevels;
                        result.descriptions = mDescs;
                    }
                    deferred.resolve(result);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getMaintenanceLevels::', deferred.promise);
                return deferred.promise;
            };


            /**
             * @func  getDefaultWorkHour
             * @desc  get default work hour for certain Maintenance_Key__c,Maintenance_Level__c and Maintenance_Description__c.
             * @param {String} keyword - selected Truck_Fleet__c.Maintenance_Key__c
             *      {String} level - selected Maintenance_Level__c in page
             *      {String} desp - selected Maintenance_Description__c in page
             * @returns {Promise} Decimal[] - available work hours list
             */

            this.getDefaultWorkHour = function(keyword,level,desp){
                console.log('getDefaultWorkHour.keyword:', keyword);
                console.log('getDefaultWorkHour.level:', level);
                console.log('getDefaultWorkHour.desp:', desp);
                let deferred = $q.defer();

                if((keyword == null || keyword == '') && (level == null || level == '') && (desp == null || desp == '')){
                    deferred.resolve([]);
                }

                let sql =  "select {Maintenance_Key_Level_Parts__c:_soup}\
                         from {Maintenance_Key_Level_Parts__c}\
                         where {Maintenance_Key_Level_Parts__c:Id} != null";

                if(keyword != null && keyword != '') {
                    sql = sql + " and {Maintenance_Key_Level_Parts__c:Name} like '%" + keyword + "%'";
                }
                if(level != null && level != '') {
                    sql = sql + " and {Maintenance_Key_Level_Parts__c:Maintenance_Level__c} like '%" + level + "%'";
                }
                if(desp != null && desp != '') {
                    sql = sql + " and {Maintenance_Key_Level_Parts__c:Maintenance_Description__c} like '%" + desp + "%'";
                }

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let results = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            let bool_existHour = false;
                            angular.forEach(results, function (mitem) {
                                if (mitem == entry[0].Work_Hour__c) {
                                    bool_existHour = true;
                                }
                            });
                            if (!bool_existHour && entry[0].Work_Hour__c != null && entry[0].Work_Hour__c != '') {
                                results.push(entry[0].Work_Hour__c);
                            }
                        });
                    }
                    deferred.resolve(results);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getDefaultWorkHour::', deferred.promise);
                return deferred.promise;
            };



            /**
             * @func  getDefaultUnitPrice
             * @desc  get default unit price for service fee.
             * @param no param needed
             * @returns {Promise} Object
             *      labour：labour cost
             *      trans：transportation cost
             *
             */

            this.getDefaultUnitPrice = function(){
                console.log('getDefaultUnitPrice.:');
                let deferred = $q.defer();

                let sql =  "select {Price_Term__c:_soup}\
                         from {Price_Term__c}\
                         where {Price_Term__c:Sap_Table__c} = 'A911'";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let result = new Object();
                    result.labour = 0;
                    result.trans = 0;

                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            if(entry[0].Material__c == '7990110000'){
                                result.labour = entry[0].Amount__c;
                            }
                            if(entry[0].Material__c == '7990110003'){
                                result.trans = entry[0].Amount__c;
                            }
                        });
                    }
                    deferred.resolve(result);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getDefaultUnitPrice::', deferred.promise);
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
             *  Ship_To__c
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

                        if(adrRecordType != null && adrRecordType.Id != null){newItem['RecordTypeId'] = adrRecordType.Id;}
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





























